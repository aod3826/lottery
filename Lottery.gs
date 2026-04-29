// =================================================================
// Lottery.gs — ประเภทสลาก, ซื้อสลาก, ประวัติ, รับรางวัล
// =================================================================

// ---------- Lottery Types ----------

function getLotteryTypes() {
  try {
    const { rows } = getSheetData('LotteryTypes');
    return rows.map(r => ({ id: r[0], name: r[1], description: r[2], digits: r[3] }));
  } catch (err) {
    Logger.log('getLotteryTypes: ' + err);
    return [];
  }
}

function updateLotteryType(typeInfo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (!typeInfo.name || !typeInfo.description || !typeInfo.digits)
      return _fail('กรุณากรอกข้อมูลให้ครบถ้วน');

    const sheet = getSheet('LotteryTypes');
    const { rows } = getSheetData('LotteryTypes');

    if (typeInfo.id) {
      const idx = rows.findIndex(r => r[0] === typeInfo.id);
      if (idx === -1) return _fail('ไม่พบประเภทสลากที่ต้องการแก้ไข');
      sheet.getRange(idx + 2, 2, 1, 3).setValues([[typeInfo.name, typeInfo.description, typeInfo.digits]]);
      return _ok('แก้ไขประเภทสลากสำเร็จ');
    }

    const newId = typeInfo.name.substring(0, 2).toUpperCase() + typeInfo.digits + Date.now().toString().slice(-3);
    sheet.appendRow([newId, typeInfo.name, typeInfo.description, typeInfo.digits]);
    return _ok('เพิ่มประเภทสลากใหม่สำเร็จ');
  } catch (err) {
    Logger.log('updateLotteryType: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

function deleteLotteryType(typeId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('LotteryTypes');
    const { rows } = getSheetData('LotteryTypes');
    const idx = rows.findIndex(r => r[0] === typeId);
    if (idx === -1) return _fail('ไม่พบประเภทสลาก');
    sheet.deleteRow(idx + 2);
    return _ok('ลบประเภทสลากสำเร็จ');
  } catch (err) {
    Logger.log('deleteLotteryType: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// ---------- Purchases ----------

function recordPurchases(purchases, memberId) {
  if (!purchases?.length) return _fail('ไม่มีรายการซื้อ');

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const mSheet = getSheet('Members');
    const { headers: mH, rows: mRows } = getSheetData('Members');
    const mc = _colMap(mH);

    const mIdx = mRows.findIndex(r => r[mc.ID] === memberId);
    if (mIdx === -1) return _fail('ไม่พบข้อมูลสมาชิก');

    const currentCredit = parseFloat(mRows[mIdx][mc.Credit] || 0);
    const totalCost     = purchases.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    if (currentCredit < totalCost)
      return _fail(`เครดิตไม่เพียงพอ (ต้องการ ${totalCost.toFixed(2)} บาท)`);

    const newCredit = currentCredit - totalCost;
    mSheet.getRange(mIdx + 2, mc.Credit + 1).setValue(newCredit);

    const pSheet = getSheet('Purchases');
    const newRows = purchases.map(p => [
      'PUR' + Date.now() + Math.random().toString(36).slice(2, 7),
      memberId,
      p.lotteryTypeId,
      "'" + p.number,
      parseFloat(p.amount),
      'Pending',
      new Date().toISOString(),
      0, '', '',   // WinningAmount, RoundID, ClaimedTimestamp
    ]);

    pSheet.getRange(pSheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
    return _ok('บันทึกการซื้อสำเร็จ!', { newCredit });
  } catch (err) {
    Logger.log('recordPurchases: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// ---------- Purchase History ----------

function getMemberPurchaseHistory(memberId) {
  try {
    const { headers, rows } = getSheetData('Purchases');
    const c = _colMap(headers);

    // LotteryTypes lookup
    const typeMap = new Map(getLotteryTypes().map(t => [t.id, t.name]));

    // Announcements lookup
    const annMap = _buildAnnouncementsMap();

    return rows
      .filter(r => String(r[c.MemberID]).trim() === String(memberId).trim())
      .map(r => {
        const typeId  = r[c.LotteryTypeID];
        const roundId = r[c.RoundID];
        const winNums = annMap.get(roundId) || {};
        return {
          PurchaseId:       r[c.ID],
          Timestamp:        r[c.Timestamp],
          LotteryType:      typeMap.get(typeId) || typeId,
          Number:           _cleanStr(r[c.Number]),
          CreditSpent:      parseFloat(r[c.Amount]        || 0),
          WinningAmount:    parseFloat(r[c.WinningAmount] || 0),
          Status:           r[c.Status],
          AnnouncedNumber:  winNums[typeId] || null,
          ClaimedTimestamp: r[c.ClaimedTimestamp] || null,
        };
      })
      .sort((a, b) => new Date(b.Timestamp) - new Date(a.Timestamp));
  } catch (err) {
    Logger.log('getMemberPurchaseHistory: ' + err);
    return [];
  }
}

function _buildAnnouncementsMap() {
  const map = new Map();
  try {
    const { rows } = getSheetData('Announcements');
    rows.forEach(r => {
      if (r[0] && r[2]) {
        try { map.set(r[0], JSON.parse(r[2])); } catch (_) {}
      }
    });
  } catch (_) {}
  return map;
}

// ---------- Claim Winnings ----------

function claimWinnings(purchaseId, memberId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const pSheet = getSheet('Purchases');
    const pRange = pSheet.getDataRange();
    const pAll   = pRange.getValues();
    const pHeaders = pAll.shift();
    const pc     = _colMap(pHeaders);

    const pIdx = pAll.findIndex(r => r[pc.ID] === purchaseId);
    if (pIdx === -1)                        throw new Error('ไม่พบรายการซื้อ');
    if (pAll[pIdx][pc.MemberID] !== memberId) throw new Error('ไม่มีสิทธิ์รับรางวัลนี้');
    if (pAll[pIdx][pc.Status] !== 'Won')    throw new Error('รายการนี้ไม่ถูกรางวัล');
    if (pAll[pIdx][pc.ClaimedTimestamp])    throw new Error('รับรางวัลนี้ไปแล้ว');

    const winAmount = parseFloat(pAll[pIdx][pc.WinningAmount]);
    if (winAmount <= 0) throw new Error('ไม่มียอดเงินรางวัลให้รับ');

    // อัปเดตเครดิตสมาชิก
    const mSheet   = getSheet('Members');
    const mRange   = mSheet.getDataRange();
    const mAll     = mRange.getValues();
    const mHeaders = mAll.shift();
    const mc       = _colMap(mHeaders);

    const mIdx = mAll.findIndex(r => r[mc.ID] === memberId);
    if (mIdx === -1) throw new Error('ไม่พบข้อมูลสมาชิก');

    const newCredit = parseFloat(mAll[mIdx][mc.Credit] || 0) + winAmount;
    mAll[mIdx][mc.Credit] = newCredit;
    pAll[pIdx][pc.ClaimedTimestamp] = new Date().toISOString();

    mRange.offset(1, 0, mAll.length).setValues(mAll);
    pRange.offset(1, 0, pAll.length).setValues(pAll);

    return _ok(`รับรางวัลสำเร็จ! เครดิตใหม่: ${newCredit.toFixed(2)} บาท`, { newCredit });
  } catch (err) {
    Logger.log('claimWinnings: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}
