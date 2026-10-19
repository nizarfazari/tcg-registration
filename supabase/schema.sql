create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  game text not null check (game in ('onepiece', 'pokemon')),
  full_name text not null,
  player_name text not null,
  phone text not null,
  email text not null,
  community text not null,
  leader text not null,
  deck text not null,
  deck_status text not null check (deck_status in ('ready', 'preparing')),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  constraint registrations_game_email_key unique (game, email),
  constraint registrations_game_phone_key unique (game, phone)
);

-- Service role dari Route Handler dapat menulis data. Jangan membuat policy INSERT
-- publik jika seluruh submit harus melalui app/api/registrations.
alter table public.registrations enable row level security;

-- Penyimpanan atomik: maksimal 24 pendaftaran aktif per jenis TCG.
-- Advisory lock mencegah dua request bersamaan mengambil slot ke-24.
create or replace function public.create_registration(
  p_game text,
  p_full_name text,
  p_player_name text,
  p_phone text,
  p_email text,
  p_community text,
  p_leader text,
  p_deck text,
  p_deck_status text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  registration_count integer;
begin
  perform pg_advisory_xact_lock(hashtext(p_game));
  select count(*) into registration_count
  from public.registrations
  where game = p_game and status in ('pending', 'confirmed');

  if registration_count >= 24 then
    raise exception 'Pendaftaran % sudah ditutup karena kuota 24 peserta telah terpenuhi.', p_game
      using errcode = 'P0001';
  end if;

  insert into public.registrations (game, full_name, player_name, phone, email, community, leader, deck, deck_status)
  values (p_game, p_full_name, p_player_name, p_phone, p_email, p_community, p_leader, p_deck, p_deck_status);

  return jsonb_build_object('ok', true, 'slots_remaining', 23 - registration_count);
end;
$$;

revoke all on function public.create_registration(text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.create_registration(text, text, text, text, text, text, text, text, text) to service_role;
