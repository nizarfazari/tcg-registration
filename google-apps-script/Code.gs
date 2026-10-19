/**
 * Buat script ini dari spreadsheet tujuan (Extensions > Apps Script).
 * Kolom tambahan yang disarankan: Email dan Jenis TCG.
 */
function doPost(e) {
  try {
    const data = e.parameter;
    const duplicate = findDuplicates_(data.email, data.phone, data.game);
    if (duplicate.email || duplicate.phone) {
      return response_({ ok: false, duplicate: duplicate });
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    sheet.appendRow([
      new Date(), data.fullName || '', data.playerName || '', data.phone || '',
      data.community || '', data.leader || '', data.deck || '',
      data.hasDeck === 'ready' ? 'Ya, sudah siap' : 'Sedang mempersiapkan deck',
      'Saya bersedia hadir sesuai jadwal, mengikuti ketentuan panitia, dan menerima informasi terkait turnamen melalui WhatsApp.',
      data.email || '', data.game || ''
    ]);
    return response_({ ok: true });
  } catch (error) {
    return response_({ ok: false, message: error.message });
  }
}

// Dicek dari halaman form sebelum dikirim agar peserta langsung mendapat pesan.
function doGet(e) {
  if (e.parameter.action !== 'check-registration') return response_({ ok: true });
  const callback = String(e.parameter.callback || '').replace(/[^a-zA-Z0-9_$]/g, '');
  const result = findDuplicates_(e.parameter.email, e.parameter.phone, e.parameter.game);
  if (!callback) return response_(result);
  return ContentService.createTextOutput(callback + '(' + JSON.stringify(result) + ')')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function findDuplicates_(email, phone, game) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  const normalizedGame = String(game || '').trim().toLowerCase();
  if (!normalizedGame) return { email: false, phone: false };

  const rows = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].getDataRange().getDisplayValues();
  if (rows.length < 2) return { email: false, phone: false };
  const headers = rows[0].map(String);
  // Data dari form custom ditulis: nomor HP di kolom D, Email di J, Jenis TCG di K.
  const phoneColumn = headers.indexOf('Nomor WhatsApp Aktif') >= 0 ? headers.indexOf('Nomor WhatsApp Aktif') : 3;
  const emailColumn = headers.indexOf('Email') >= 0 ? headers.indexOf('Email') : 9;
  const gameColumn = headers.indexOf('Jenis TCG') >= 0 ? headers.indexOf('Jenis TCG') : 10;
  let duplicateEmail = false;
  let duplicatePhone = false;

  rows.slice(1).forEach((row) => {
    if (String(row[gameColumn] || '').trim().toLowerCase() !== normalizedGame) return;
    if (normalizedEmail && String(row[emailColumn] || '').trim().toLowerCase() === normalizedEmail) duplicateEmail = true;
    if (normalizedPhone && String(row[phoneColumn] || '').replace(/\D/g, '') === normalizedPhone) duplicatePhone = true;
  });
  return { email: duplicateEmail, phone: duplicatePhone };
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
