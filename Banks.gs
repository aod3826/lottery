// =================================================================
// Banks.gs — จัดการบัญชีธนาคาร
// =================================================================

function getBankAccounts(forAdmin = false) {
  try {
    const { rows } = getSheetData('BankAccounts');
    const accounts = rows.map(r => ({
      id:            r[0],
      bankName:      r[1],
      accountNumber: r[2],
      accountName:   r[3],
      qrCodeUrl:     r[4],
      status:        r[5],
    }));
    return forAdmin ? accounts : accounts.filter(a => a.status === 'Active');
  } catch (err) {
    Logger.log('getBankAccounts: ' + err);
    return [];
  }
}

// -----------------------------------------------------------------

function updateBankAccount(bankInfo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet      = getSheet('BankAccounts');
    const { rows }   = getSheetData('BankAccounts');
    const newValues  = [bankInfo.bankName, bankInfo.accountNumber, bankInfo.accountName, bankInfo.qrCodeUrl, 'Active'];

    if (bankInfo.id) {
      const idx = rows.findIndex(r => r[0] === bankInfo.id);
      if (idx === -1) return _fail('ไม่พบบัญชีที่ต้องการแก้ไข');
      sheet.getRange(idx + 2, 2, 1, 5).setValues([newValues]);
      return _ok('แก้ไขข้อมูลบัญชีสำเร็จ');
    }

    sheet.appendRow(['BANK' + Date.now(), ...newValues]);
    return _ok('เพิ่มบัญชีใหม่สำเร็จ');
  } catch (err) {
    Logger.log('updateBankAccount: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function deleteBankAccount(bankId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet    = getSheet('BankAccounts');
    const { rows } = getSheetData('BankAccounts');
    const idx = rows.findIndex(r => r[0] === bankId);
    if (idx === -1) return _fail('ไม่พบบัญชีที่ต้องการลบ');
    sheet.deleteRow(idx + 2);
    return _ok('ลบบัญชีสำเร็จ');
  } catch (err) {
    Logger.log('deleteBankAccount: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function setActiveBankAccount(bankId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet    = getSheet('BankAccounts');
    const { rows } = getSheetData('BankAccounts');
    if (!rows.length) return _fail('ไม่พบบัญชีธนาคาร');

    const updated = rows.map(r => {
      r[5] = (r[0] === bankId) ? 'Active' : 'Inactive';
      return r;
    });

    const found = rows.some(r => r[0] === bankId);
    if (!found) return _fail('ไม่พบบัญชีที่ต้องการตั้งค่า');

    sheet.getRange(2, 1, updated.length, updated[0].length).setValues(updated);
    return _ok('ตั้งค่าบัญชีที่ใช้งานสำเร็จ');
  } catch (err) {
    Logger.log('setActiveBankAccount: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}
