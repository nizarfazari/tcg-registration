/**
 * Script ini harus dibuat dari spreadsheet tujuan (Extensions > Apps Script).
 * Header kolom tambahan yang diperlukan: Email dan Jenis TCG.
 */
function doPost(e) {
  try {
    const data = e.parameter;
    if (isDuplicateEmail_(data.email, data.game)) {
      return response_({ ok: false, duplicate: true, message: 'Email sudah terdaftar untuk jenis TCG ini.' });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    // Urutan awal mengikuti respons Google Form, lalu Email dan Jenis TCG.
    sheet.appendRow([
      new Date(),
      data.fullName || '',
      data.playerName || '',
      data.phone || '',
      data.community || '',
      data.leader || '',
      data.deck || '',
      data.hasDeck === 'ready' ? 'Ya, sudah siap' : 'Sedang mempersiapkan deck',
      'Saya bersedia hadir sesuai jadwal, mengikuti ketentuan panitia, dan menerima informasi terkait turnamen melalui WhatsApp.',
      data.email || '',
      data.game || ''
    ]);
    return response_({ ok: true });
  } catch (error) {
    return response_({ ok: false, message: error.message });
  }
}

// Dipanggil oleh form sebelum submit untuk memberi pesan penolakan langsung.
function doGet(e) {
  if (e.parameter.action !== 'check-email') return response_({ ok: true });
  const callback = String(e.parameter.callback || '').replace(/[^a-zA-Z0-9_$]/g, '');
  const result = { duplicate: isDuplicateEmail_(e.parameter.email, e.parameter.game) };
  if (!callback) return response_(result);
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function isDuplicateEmail_(email, game) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedGame = String(game || '').trim().toLowerCase();
  if (!normalizedEmail || !normalizedGame) return false;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  const rows = sheet.getDataRange().getDisplayValues();
  if (rows.length < 2) return false;
  const headers = rows[0].map(String);
  const emailColumn = headers.indexOf('Email');
  const gameColumn = headers.indexOf('Jenis TCG');
  if (emailColumn < 0 || gameColumn < 0) {
    throw new Error('Header kolom Email atau Jenis TCG belum ditemukan.');
  }
  return rows.slice(1).some((row) =>
    String(row[emailColumn] || '').trim().toLowerCase() === normalizedEmail &&
    String(row[gameColumn] || '').trim().toLowerCase() === normalizedGame
  );
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
