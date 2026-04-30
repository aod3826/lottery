// =================================================================
// Main.gs — REST API Router
// Frontend: GitHub Pages  ←→  Backend: Google Apps Script
//
// GET  ?action=xxx&param=yyy   → ดึงข้อมูล (ไม่มี side effect)
// POST body: { action, ...payload }  → เขียน/แก้ไขข้อมูล
// =================================================================

const ss = SpreadsheetApp.getActiveSpreadsheet();

// -----------------------------------------------------------------
// doGet — อ่านข้อมูล (Read operations)
// -----------------------------------------------------------------
function doGet(e) {
  try {
    initialSetup();
    const action = e.parameter.action;
    if (!action) return _res({ error: 'Missing action parameter' });

    const GET_ROUTES = {
      getLotteryTypes:          () => getLotteryTypes(),
      getBankAccounts:          () => getBankAccounts(e.parameter.forAdmin === 'true'),
      getPastAnnouncements:     () => getPastAnnouncements(),
      getAllMembers:             () => getAllMembers(),
      getPendingDeposits:       () => getPendingDeposits(),
      getPendingWithdrawals:    () => getPendingWithdrawals(),
      getDepositHistory:        () => getDepositHistory(),
      getWithdrawalHistory:     () => getWithdrawalHistory(),
      getMemberReport:          () => getMemberReport(),
      getMemberPurchaseHistory: () => getMemberPurchaseHistory(e.parameter.memberId),
      getMemberHistory:         () => getMemberHistory(e.parameter.memberId),
    };

    const handler = GET_ROUTES[action];
    if (!handler) return _res({ error: 'Unknown GET action: ' + action });

    return _res(handler());
  } catch (err) {
    Logger.log('doGet ERROR: ' + err);
    return _res({ error: err.message });
  }
}

// -----------------------------------------------------------------
// doPost — เขียน/แก้ไขข้อมูล (Write operations)
// Body: JSON string ส่งแบบ Content-Type: text/plain
// (หลีกเลี่ยง CORS preflight OPTIONS request)
// -----------------------------------------------------------------
function doPost(e) {
  try {
    initialSetup();

    let body = {};
    if (e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents);
    }

    const action = body.action;
    if (!action) return _res({ error: 'Missing action in request body' });

    const POST_ROUTES = {
      // Auth
      login:                () => login(body.credentials),
      registerUser:         () => registerUser(body.formData, body.fileObject),
      // Member
      requestCreditDeposit: () => requestCreditDeposit(body.depositInfo, body.fileObject),
      requestWithdrawal:    () => requestWithdrawal(body.withdrawalData),
      recordPurchases:      () => recordPurchases(body.purchases, body.memberId),
      claimWinnings:        () => claimWinnings(body.purchaseId, body.memberId),
      // Admin - สมาชิก
      approveMember:        () => approveMember(body.memberId),
      // Admin - เงิน
      approveDeposit:       () => approveDeposit(body.depositId, body.memberId, body.amount),
      approveWithdrawal:    () => approveWithdrawal(body.withdrawalId, body.memberId, body.amount),
      // Admin - ธนาคาร
      updateBankAccount:    () => updateBankAccount(body.bankInfo),
      deleteBankAccount:    () => deleteBankAccount(body.bankId),
      setActiveBankAccount: () => setActiveBankAccount(body.bankId),
      // Admin - ประเภทสลาก
      updateLotteryType:    () => updateLotteryType(body.typeInfo),
      deleteLotteryType:    () => deleteLotteryType(body.typeId),
      // Admin - ประกาศผล
      announceWinners:      () => announceWinners(body.winningNumbers),
    };

    const handler = POST_ROUTES[action];
    if (!handler) return _res({ error: 'Unknown POST action: ' + action });

    return _res(handler());
  } catch (err) {
    Logger.log('doPost ERROR: ' + err);
    return _res({ error: err.message });
  }
}

// -----------------------------------------------------------------
// Response helper
// GAS แนบ Access-Control-Allow-Origin: * อัตโนมัติ
// เมื่อ deploy แบบ "Anyone can access"
// -----------------------------------------------------------------
function _res(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// -----------------------------------------------------------------
// Sheet helpers
// -----------------------------------------------------------------
function getSheet(name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_HEADERS[name];
    if (headers) sheet.appendRow(headers);
  }
  return sheet;
}

function getSheetData(name) {
  const sheet = getSheet(name);
  if (sheet.getLastRow() < 2) {
    return { headers: SHEET_HEADERS[name] || [], rows: [] };
  }
  const all     = sheet.getDataRange().getValues();
  const headers = all.shift();
  return { headers, rows: all };
}

// -----------------------------------------------------------------
// Seed data
// -----------------------------------------------------------------
function initialSetup() {
  Object.keys(SHEET_HEADERS).forEach(name => getSheet(name));
  _seedAdmins();
  _seedBankAccounts();
  _seedLotteryTypes();
}

function _seedAdmins() {
  const s = getSheet('Admins');
  if (s.getLastRow() < 2) s.appendRow(['admin', '1234']);
}

function _seedBankAccounts() {
  const s = getSheet('BankAccounts');
  if (s.getLastRow() < 2)
    s.appendRow(['BANK'+Date.now(),'ธนาคารกรุงไทย','123-456-7890','บัญชีตัวอย่าง',
      'https://placehold.co/200x200/166534/ffffff?text=QR','Active']);
}

function _seedLotteryTypes() {
  const s = getSheet('LotteryTypes');
  if (s.getLastRow() < 2) {
    s.appendRow(['L2U','เลข 2 ตัวบน','00-99',2]);
    s.appendRow(['L2L','เลข 2 ตัวล่าง','00-99',2]);
    s.appendRow(['L3L','เลขชุด 3 ตัวหลัง','000-999',3]);
  }
}
