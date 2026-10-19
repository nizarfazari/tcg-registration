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
