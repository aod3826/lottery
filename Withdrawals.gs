// =================================================================
// Withdrawals.gs — การถอนเงิน
// =================================================================

function requestWithdrawal({ memberId, amount }) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return _fail('จำนวนเงินถอนไม่ถูกต้อง');

    const { headers, rows } = getSheetData('Members');
    const c   = _colMap(headers);
    const row = rows.find(r => r[c.ID] === memberId);
    if (!row) return _fail('ไม่พบข้อมูลสมาชิก');

    const currentCredit = parseFloat(row[c.Credit] || 0);
    if (currentCredit < numAmount) return _fail('เครดิตคงเหลือไม่เพียงพอ');

    const bankAccount = _cleanStr(row[c.BankAccount]);
    const phone       = _cleanStr(row[c.Phone]);
    const bankName    = row[c.BankName];
    const memberName  = row[c.FullName];

    getSheet('Withdrawals').appendRow([
      'WTH' + Date.now(),
      memberId,
      memberName,
      numAmount,
      'Pending',
      new Date().toISOString(),
      bankAccount,
      phone,
    ]);

    sendLineMessage(
      `💸 มีรายการแจ้งถอนเงิน\n` +
      `ชื่อ: ${memberName}\n` +
      `เบอร์: ${phone}\n` +
      `ธนาคาร: ${bankName} / ${bankAccount}\n` +
      `ยอด: ${numAmount.toFixed(2)} บาท`
    );

    return _ok('ส่งคำขอถอนเงินสำเร็จ รอผู้ดูแลระบบตรวจสอบ');
  } catch (err) {
    Logger.log('requestWithdrawal: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function approveWithdrawal(withdrawalId, memberId, amount) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const wSheet = getSheet('Withdrawals');
    const { headers: wH, rows: wRows } = getSheetData('Withdrawals');
    const wc = _colMap(wH);

    const wIdx = wRows.findIndex(r => r[wc.ID] === withdrawalId);
    if (wIdx === -1) return _fail('ไม่พบรายการ');
    if (wRows[wIdx][wc.Status] !== 'Pending') return _fail('รายการนี้ถูกจัดการไปแล้ว');

    const mSheet = getSheet('Members');
    const { headers: mH, rows: mRows } = getSheetData('Members');
    const mc = _colMap(mH);

    const mIdx = mRows.findIndex(r => r[mc.ID] === memberId);
    if (mIdx === -1) return _fail('ไม่พบสมาชิก');

    const numAmount     = parseFloat(amount);
    const currentCredit = parseFloat(mRows[mIdx][mc.Credit] || 0);
    if (currentCredit < numAmount) {
      wSheet.getRange(wIdx + 2, wc.Status + 1).setValue('Rejected');
      return _fail(`เครดิตไม่พอ (คงเหลือ ${currentCredit.toFixed(2)} บาท)`);
    }

    mSheet.getRange(mIdx + 2, mc.Credit + 1).setValue(currentCredit - numAmount);
    wSheet.getRange(wIdx + 2, wc.Status + 1).setValue('Approved');

    return _ok('อนุมัติการถอนเงินและหักเครดิตเรียบร้อย');
  } catch (err) {
    Logger.log('approveWithdrawal: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function getPendingWithdrawals() {
  try {
    const { headers, rows } = getSheetData('Withdrawals');
    const c = _colMap(headers);

    // สร้าง map สมาชิกสำหรับ join ข้อมูล bankName, phone
    const { headers: mH, rows: mRows } = getSheetData('Members');
    const mc       = _colMap(mH);
    const memberMap = new Map(mRows.map(r => [
      r[mc.ID],
      { phone: _cleanStr(r[mc.Phone]), bankName: r[mc.BankName] || 'N/A' },
    ]));

    return rows
      .filter(r => r[c.Status] === 'Pending')
      .map(r => {
        const mid     = r[c.MemberID];
        const details = memberMap.get(mid) || { phone: '-', bankName: '-' };
        return {
          id:          r[c.ID],
          memberId:    mid,
          memberName:  r[c.MemberName],
          amount:      parseFloat(r[c.Amount]),
          status:      r[c.Status],
          timestamp:   r[c.Timestamp],
          bankAccount: r[c.BankAccount],
          phone:       details.phone,
          bankName:    details.bankName,
        };
      });
  } catch (err) {
    Logger.log('getPendingWithdrawals: ' + err);
    return [];
  }
}

function getWithdrawalHistory() {
  try {
    const { headers, rows } = getSheetData('Withdrawals');
    const c = _colMap(headers);
    return rows
      .map(r => ({
        id:          r[c.ID],
        memberId:    r[c.MemberID],
        memberName:  r[c.MemberName],
        amount:      parseFloat(r[c.Amount]),
        status:      r[c.Status],
        timestamp:   r[c.Timestamp],
        bankAccount: r[c.BankAccount],
        phone:       r[c.Phone],
      }))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    Logger.log('getWithdrawalHistory: ' + err);
    return [];
  }
}

function getMemberHistory(memberId) {
  try {
    const deposits    = _getAllDeposits()
      .filter(d => d.memberId === memberId)
      .map(d => ({ Type: 'Deposit', ...d }));

    const withdrawals = getWithdrawalHistory()
      .filter(w => w.memberId === memberId)
      .map(w => ({ Type: 'Withdrawal', SlipUrl: null, ...w }));

    return [...deposits, ...withdrawals]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  } catch (err) {
    Logger.log('getMemberHistory: ' + err);
    return [];
  }
}
