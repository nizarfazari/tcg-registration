'use client';

import { FormEvent, useEffect, useState, type InputHTMLAttributes } from 'react';

type Game = 'onepiece' | 'pokemon';
type Notice = { type: 'success' | 'error'; text: string } | null;

const gameCopy = {
  onepiece: { name: 'One Piece Card Game', title: 'ONE PIECE TOURNAMENT', leader: 'Leader yang Akan Digunakan', leaderPlaceholder: 'Contoh: Monkey D. Luffy (OP05-060)' },
  pokemon: { name: 'Pokémon Trading Card Game', title: 'POKÉMON TOURNAMENT', leader: 'Pokémon Utama yang Akan Digunakan', leaderPlaceholder: 'Contoh: Charizard ex' }
};

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [sending, setSending] = useState(false);
  const [closedGames, setClosedGames] = useState<Record<Game, boolean>>({ onepiece: false, pokemon: false });
  const copy = game ? gameCopy[game] : null;

  useEffect(() => {
    (['onepiece', 'pokemon'] as Game[]).forEach(async (gameType) => {
      try {
        const response = await fetch(`/api/registrations?game=${gameType}`);
        const result = await response.json();
        if (response.ok) setClosedGames((current) => ({ ...current, [gameType]: Boolean(result.closed) }));
      } catch { /* Server tetap memvalidasi kuota saat submit. */ }
    });
  }, []);

  function chooseGame(selectedGame: Game) {
    if (closedGames[selectedGame]) {
      setNotice({ type: 'error', text: `Pendaftaran ${gameCopy[selectedGame].name} sudah ditutup karena kuota 24 peserta terpenuhi.` });
      return;
    }
    setGame(selectedGame);
    setNotice(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!game) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    setSending(true);
    setNotice(null);
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, game })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Pendaftaran gagal diproses.');
      form.reset();
      setNotice({ type: 'success', text: 'Pendaftaran terkirim! Panitia akan menghubungi kamu melalui WhatsApp.' });
    } catch (error) {
      setNotice({ type: 'error', text: error instanceof Error ? error.message : 'Pendaftaran gagal diproses.' });
    } finally {
      setSending(false);
    }
  }

  if (!game || !copy) {
    return <main className="game-gate">
      {notice && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
      <section className="gate-copy">
        <div className="brand"><img className="brand-icon" src="/images/icon-tcg.png" alt="Card Zone TCG" /> CARD ZONE <small>TCG</small></div>
        <p className="eyebrow">REGISTRATION FORM</p>
        <h1>Pilih TCG<br />untuk turnamenmu</h1>
        <p className="muted">Pilih satu permainan untuk melanjutkan ke formulir pendaftaran.</p>
      </section>
      <section className="game-options" aria-label="Pilih jenis TCG">
        <button className="game-option one-piece" onClick={() => chooseGame('onepiece')} disabled={closedGames.onepiece}>
          <span><b>ONE PIECE</b><small>Card Game</small><em>{closedGames.onepiece ? 'Pendaftaran ditutup — kuota penuh' : 'Daftar turnamen →'}</em></span>
        </button>
        <button className="game-option pokemon" onClick={() => chooseGame('pokemon')} disabled={closedGames.pokemon}>
          <span><b>POKÉMON</b><small>Trading Card Game</small><em>{closedGames.pokemon ? 'Pendaftaran ditutup — kuota penuh' : 'Daftar turnamen →'}</em></span>
        </button>
      </section>
    </main>;
  }

  return <main className="registration-page">
    {notice && <div className={`notice ${notice.type}`} role="status">{notice.text}</div>}
    <section className="registration-card">
      <aside className={`hero ${game}`}>
        <div className="brand"><img className="brand-icon" src="/images/icon-tcg.png" alt="Card Zone TCG" /> CARD ZONE <small>TCG</small></div>
        <p className="eyebrow">{copy.name}</p>
        <h1>{copy.title}</h1>
        <button className="change-game" onClick={() => chooseGame(game === 'onepiece' ? 'pokemon' : 'onepiece')}>Ganti jenis TCG</button>
      </aside>
      <section className="form-panel">
        <p className="kicker">PENDAFTARAN PESERTA</p>
        <h2>{game === 'onepiece' ? 'Join the crew, Nakama!' : 'Catch your next victory!'}</h2>
        <p className="intro">Isi seluruh data dengan benar. Panitia akan menghubungi kamu melalui WhatsApp untuk konfirmasi slot.</p>
        <div className="event-info"><span>📅</span><p><b>Jumat, 6 November 2026</b><small>13.00 – 18.00 WIB</small></p><span>📍</span><p><b>Card Zone TCG</b><small>Lantai 2 Sender Coffee, Demangan</small></p>{game === 'onepiece' ? <div className="prizes"><b>🏆 Tournament Prizes</b><span>Champion: 1 Booster Box EB-05 + Brand Kit Card Zone</span><span>Runner Up: 5 Pack OP-17 + Deck Box + Playmat + Brand Kit Card Zone</span><span>3rd Place: Sleeve + Playmat + Brand Kit Card Zone</span></div> : <div className="prizes"><b>🏆 Tournament Prizes</b><span>Champion: 1 Box Pokémon 30th Anniversary Indonesia + Brand Kit Card Zone</span><span>Runner Up: Playmat + Deck Box + Brand Kit Card Zone</span><span>3rd Place: Deck Box + Sleeve + Brand Kit Card Zone</span></div>}</div>
        <form onSubmit={submit}>
          <div className="two-columns"><Field label="Nama Lengkap" name="fullName" placeholder="Masukkan nama lengkap" /><Field label="Nama Panggilan / Player Name" name="playerName" placeholder="Contoh: LuffySenpai" /></div>
          <div className="two-columns"><Field label="Nomor WhatsApp Aktif" name="phone" type="tel" placeholder="Contoh: 081234567890" inputMode="numeric" pattern="[0-9]{10,15}" maxLength={15} onInput={(event) => { event.currentTarget.value = event.currentTarget.value.replace(/\D/g, ''); }} /><Field label="Email Aktif" name="email" type="email" placeholder="Contoh: nama@email.com" /></div>
          <Field label="Domisili / Komunitas TCG" name="community" placeholder="Contoh: Yogyakarta / Jogja OP Players" />
          <Field label={copy.leader} name="leader" placeholder={copy.leaderPlaceholder} hint="Kode kartu boleh ditambahkan jika diketahui." />
          <Field label="Nama / Tipe Deck" name="deck" placeholder="Contoh: Purple Luffy Ramp" />
          <fieldset><legend>Apakah kamu memiliki deck sendiri untuk turnamen?</legend><div className="choice-row"><Choice value="ready" label="Ya, sudah siap" /><Choice value="preparing" label="Sedang mempersiapkan deck" /></div></fieldset>
          <label className="consent"><input type="checkbox" required /><span>Saya bersedia hadir sesuai jadwal, mengikuti ketentuan panitia, dan menerima informasi terkait turnamen melalui WhatsApp.</span></label>
          <button className="submit" disabled={sending}>{sending ? 'MENGIRIM...' : 'KIRIM PENDAFTARAN →'}</button>
        </form>
      </section>
    </section>
  </main>;
}

function Field({ label, name, hint, ...props }: { label: string; name: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <label className="field"><span>{label} <i>*</i></span><input name={name} required {...props} />{hint && <small>{hint}</small>}</label>;
}

function Choice({ value, label }: { value: string; label: string }) {
  return <label className="choice"><input type="radio" name="deckStatus" value={value} required /><span className="radio" />{label}</label>;
}
