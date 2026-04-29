// =================================================================
// Main.gs — entry point และ initial setup
// =================================================================

const ss = SpreadsheetApp.getActiveSpreadsheet();

function doGet() {
  try {
    initialSetup();
    return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('ระบบสลากออนไลน์')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    Logger.log('FATAL: ' + err);
    return HtmlService.createHtmlOutput(
      `<h2 style="color:red;">ระบบขัดข้อง: ${err.message}</h2>`
    );
  }
}

/** ใช้ใน HTML template สำหรับ <?!= include('filename') ?> */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// -----------------------------------------------------------------
// Sheet helpers
// -----------------------------------------------------------------

/** คืน sheet พร้อม header (สร้างถ้ายังไม่มี) */
function getSheet(name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

/** คืน array ข้อมูลโดยตัด header row ออก (row 0 → headers object) */
function getSheetData(name) {
  const sheet = getSheet(name);
  if (sheet.getLastRow() < 2) return { headers: SHEET_HEADERS[name] || [], rows: [] };
  const all = sheet.getDataRange().getValues();
  const headers = all.shift();
  return { headers, rows: all };
}

// -----------------------------------------------------------------
// Initial seed data
// -----------------------------------------------------------------

function initialSetup() {
  Object.keys(SHEET_HEADERS).forEach(name => getSheet(name));

  _seedAdmins();
  _seedBankAccounts();
  _seedLotteryTypes();
}

function _seedAdmins() {
  const sheet = getSheet('Admins');
  if (sheet.getLastRow() < 2) sheet.appendRow(['admin', '1234']);
}

function _seedBankAccounts() {
  const sheet = getSheet('BankAccounts');
  if (sheet.getLastRow() < 2) {
    sheet.appendRow([
      'BANK' + Date.now(),
      'ธนาคารกรุงไทย', '123-456-7890', 'บัญชีโรงเรียน',
      'https://placehold.co/200x200/166534/ffffff?text=QR',
      'Active',
    ]);
  }
}

function _seedLotteryTypes() {
  const sheet = getSheet('LotteryTypes');
  if (sheet.getLastRow() < 2) {
    sheet.appendRow(['L2U', 'เลข 2 ตัวบน',   '00-99',  2]);
    sheet.appendRow(['L2L', 'เลข 2 ตัวล่าง', '00-99',  2]);
    sheet.appendRow(['L3L', 'เลขชุด 3 ตัวหลัง', '000-999', 3]);
  }
}
