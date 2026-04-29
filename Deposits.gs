// =================================================================
// Deposits.gs — การเติมเงิน
// =================================================================

function requestCreditDeposit(depositInfo, fileObject) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!fileObject?.data) return _fail('ไม่พบไฟล์สลิปแนบ');

    const newId   = 'DEP' + Date.now();
    const slipUrl = uploadFileToDrive(fileObject.data, fileObject.fileName, newId);
    if (!slipUrl) return _fail('ไม่สามารถอัปโหลดสลิปได้');

    getSheet('Deposits').appendRow([
      newId,
      depositInfo.memberId,
      depositInfo.memberName,
      parseFloat(depositInfo.amount),
      slipUrl,
      'Pending',
      new Date().toISOString(),
      "'" + depositInfo.phone,
    ]);

    sendLineMessage(
      `🔔 มีรายการแจ้งฝากเงิน\n` +
      `ชื่อ: ${depositInfo.memberName}\n` +
      `เบอร์: ${depositInfo.phone}\n` +
      `ยอด: ${parseFloat(depositInfo.amount).toFixed(2)} บาท\n` +
      `สลิป: ${slipUrl}`
    );

    return _ok('ส่งคำขอเติมเครดิตสำเร็จ รอการตรวจสอบ');
  } catch (err) {
    Logger.log('requestCreditDeposit: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function approveDeposit(depositId, memberId, amount) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const dSheet = getSheet('Deposits');
    const { headers: dH, rows: dRows } = getSheetData('Deposits');
    const dc = _colMap(dH);

    const dIdx = dRows.findIndex(r => r[dc.ID] === depositId && r[dc.Status] === 'Pending');
    if (dIdx === -1) return _fail('ไม่พบรายการ หรือถูกจัดการไปแล้ว');

    const mSheet = getSheet('Members');
    const { headers: mH, rows: mRows } = getSheetData('Members');
    const mc = _colMap(mH);

    const mIdx = mRows.findIndex(r => r[mc.ID] === memberId);
    if (mIdx === -1) {
      dSheet.getRange(dIdx + 2, dc.Status + 1).setValue('Error: Member Not Found');
      return _fail('ไม่พบสมาชิก ID: ' + memberId);
    }

    const newCredit = parseFloat(mRows[mIdx][mc.Credit] || 0) + parseFloat(amount);
    mSheet.getRange(mIdx + 2, mc.Credit + 1).setValue(newCredit);
    dSheet.getRange(dIdx + 2, dc.Status + 1).setValue('Approved');

    return _ok(`อนุมัติการเติมเงิน ${amount} บาท สำเร็จ`, { newCredit });
  } catch (err) {
    Logger.log('approveDeposit: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function getPendingDeposits() {
  return _getDepositsByStatus('Pending');
}

function getDepositHistory() {
  const all = _getAllDeposits();
  return all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// -----------------------------------------------------------------

function _getAllDeposits() {
  try {
    const { headers, rows } = getSheetData('Deposits');
    const c = _colMap(headers);
    return rows.map(r => ({
      id:         r[c.ID],
      memberId:   r[c.MemberID],
      memberName: r[c.MemberName],
      amount:     parseFloat(r[c.Amount]),
      slipUrl:    r[c.SlipUrl],
      status:     r[c.Status],
      timestamp:  r[c.Timestamp],
      phone:      _cleanStr(r[c.Phone]),
    }));
  } catch (err) {
    Logger.log('_getAllDeposits: ' + err);
    return [];
  }
}

function _getDepositsByStatus(status) {
  return _getAllDeposits().filter(d => d.status === status);
}
