/**
 * MOVE YOUR TEAM lead capture (Google Apps Script)
 *
 * 1. Create a Google Sheet. Add this header row in row 1:
 *    Masa | Nama | Telefon | Organisasi | Peranan | Bilangan hadir | Soalan | Sumber
 * 2. Extensions > Apps Script. Paste this file. Save.
 * 3. Deploy > New deployment > type "Web app".
 *    Execute as: Me.  Who has access: Anyone.
 * 4. Copy the web app URL and paste it into LEAD_ENDPOINT in move-your-team.html.
 */
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var d = {};
  try { d = JSON.parse(e.postData.contents); } catch (err) {}
  sheet.appendRow([
    new Date(),
    d.name || '',
    d.phone || '',
    d.organization || '',
    d.role || '',
    d.attendees || '',
    d.need || '',
    d.source || ''
  ]);
  return ContentService.createTextOutput('ok');
}
