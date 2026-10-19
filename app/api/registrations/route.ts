import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Registration = {
  game: 'onepiece' | 'pokemon';
  fullName: string;
  playerName: string;
  phone: string;
  email: string;
  community: string;
  leader: string;
  deck: string;
  deckStatus: 'ready' | 'preparing';
};

const requiredFields = ['game', 'fullName', 'playerName', 'phone', 'email', 'community', 'leader', 'deck', 'deckStatus'];

export async function POST(request: Request) {
  const payload = await request.json() as Partial<Registration>;
  if (requiredFields.some((field) => !String(payload[field as keyof Registration] ?? '').trim())) {
    return NextResponse.json({ message: 'Lengkapi seluruh data pendaftaran.' }, { status: 400 });
  }

  const phone = String(payload.phone).replace(/\D/g, '');
  const email = String(payload.email).trim().toLowerCase();
  if (!/^\d{10,15}$/.test(phone) || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ message: 'Format email atau nomor WhatsApp tidak valid.' }, { status: 400 });
  }
  if (payload.game !== 'onepiece' && payload.game !== 'pokemon') {
    return NextResponse.json({ message: 'Jenis TCG tidak valid.' }, { status: 400 });
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ message: 'Konfigurasi database belum tersedia.' }, { status: 500 });
  }

  // Service key hanya dipakai di Route Handler (server), tidak pernah dikirim ke browser.
  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.rpc('create_registration', {
    p_game: payload.game,
    p_full_name: String(payload.fullName).trim(),
    p_player_name: String(payload.playerName).trim(),
    p_phone: phone,
    p_email: email,
    p_community: String(payload.community).trim(),
    p_leader: String(payload.leader).trim(),
    p_deck: String(payload.deck).trim(),
    p_deck_status: payload.deckStatus
  });

  if (error?.code === '23505') {
    const isPhone = error.message.includes('registrations_game_phone_key');
    return NextResponse.json({ message: isPhone ? 'Nomor WhatsApp sudah terdaftar untuk TCG ini.' : 'Email sudah terdaftar untuk TCG ini.' }, { status: 409 });
  }
  if (error?.code === 'P0001') {
    return NextResponse.json({ message: error.message }, { status: 409 });
  }
  if (error) {
    console.error('Registration insert failed:', error);
    return NextResponse.json({ message: 'Pendaftaran gagal diproses. Silakan coba lagi.' }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function GET(request: Request) {
  const game = new URL(request.url).searchParams.get('game');
  if (game !== 'onepiece' && game !== 'pokemon') return NextResponse.json({ message: 'Jenis TCG tidak valid.' }, { status: 400 });
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return NextResponse.json({ message: 'Konfigurasi database belum tersedia.' }, { status: 500 });

  const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { count, error } = await supabase.from('registrations').select('*', { count: 'exact', head: true })
    .eq('game', game).in('status', ['pending', 'confirmed']);
  if (error) return NextResponse.json({ message: 'Status kuota tidak tersedia.' }, { status: 500 });
  return NextResponse.json({ count: count || 0, limit: 24, closed: (count || 0) >= 24 });
}
