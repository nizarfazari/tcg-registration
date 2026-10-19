/**
 * Script ini dibuat dari spreadsheet tujuan (Extensions > Apps Script).
 * Urutan data form: Timestamp, Nama, Player Name, WhatsApp, Komunitas,
 * Leader/Pokémon, Deck, Status Deck, Konfirmasi, Email, Jenis TCG.
 */
function doPost(e) {
  try {
    const data = e.parameter;
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const duplicate = findDuplicates_(sheet, data.email, data.phone, data.game);
    if (duplicate.email || duplicate.phone) {
      return response_({ ok: false, duplicate: duplicate });
    }

    // Tulis tanggal sebagai teks agar spreadsheet tidak mengubah data lain menjadi format jam.
    const timestamp = Utilities.formatDate(
      new Date(),
      Session.getScriptTimeZone(),
      'dd/MM/yyyy HH:mm:ss'
    );
    // Satu operasi tulis ke spreadsheet.
    sheet.appendRow([
      timestamp, data.fullName || '', data.playerName || '', data.phone || '',
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

function findDuplicates_(sheet, email, phone, game) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPhone = String(phone || '').replace(/\D/g, '');
  const normalizedGame = String(game || '').trim().toLowerCase();
  const lastRow = sheet.getLastRow();
  if (!normalizedGame || lastRow < 2) return { email: false, phone: false };

  // Satu pembacaan ringan: hanya kolom D–K, bukan seluruh spreadsheet.
  // D=WhatsApp, J=Email, K=Jenis TCG.
  const rows = sheet.getRange(2, 4, lastRow - 1, 8).getDisplayValues();
  let duplicateEmail = false;
  let duplicatePhone = false;
  rows.forEach((row) => {
    if (String(row[7] || '').trim().toLowerCase() !== normalizedGame) return;
    if (normalizedEmail && String(row[6] || '').trim().toLowerCase() === normalizedEmail) duplicateEmail = true;
    if (normalizedPhone && String(row[0] || '').replace(/\D/g, '') === normalizedPhone) duplicatePhone = true;
  });
  return { email: duplicateEmail, phone: duplicatePhone };
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
