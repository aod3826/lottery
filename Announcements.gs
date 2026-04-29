// =================================================================
// Announcements.gs — ประกาศผลรางวัล
// =================================================================

function announceWinners(winningNumbers) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const roundId = 'RND' + Date.now();

    // บันทึกการประกาศรอบนี้
    getSheet('Announcements').appendRow([
      roundId,
      new Date().toISOString(),
      JSON.stringify(winningNumbers),
      'ADMIN',
    ]);

    // ดึง purchases ที่ยัง Pending
    const pSheet = getSheet('Purchases');
    if (pSheet.getLastRow() < 2)
      return _ok('ไม่พบรายการซื้อที่ต้องตรวจ');

    const pRange  = pSheet.getRange(2, 1, pSheet.getLastRow() - 1, pSheet.getLastColumn());
    const pValues = pRange.getValues();
    const pHeaders = pSheet.getRange(1, 1, 1, pSheet.getLastColumn()).getValues()[0];
    const pc = _colMap(pHeaders);

    let winnersCount = 0;

    pValues.forEach(row => {
      if (row[pc.Status] !== 'Pending') return;

      const typeId        = row[pc.LotteryTypeID];
      const number        = _cleanStr(row[pc.Number]);
      const amount        = parseFloat(row[pc.Amount]);
      const winningNumber = winningNumbers[typeId];

      row[pc.RoundID] = roundId;

      if (winningNumber && number === String(winningNumber)) {
        row[pc.WinningAmount] = amount * (PAYOUT_RATES[typeId] || 0);
        row[pc.Status]        = 'Won';
        winnersCount++;
      } else {
        row[pc.WinningAmount] = 0;
        row[pc.Status]        = 'Lost';
      }
    });

    pRange.setValues(pValues);
    return _ok(`ประกาศผลสำเร็จ พบผู้ชนะ ${winnersCount} รายการ`);
  } catch (err) {
    Logger.log('announceWinners: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------

function getPastAnnouncements() {
  try {
    const { rows } = getSheetData('Announcements');
    return rows
      .map(r => {
        try {
          return { roundId: r[0], date: r[1], numbers: JSON.parse(r[2]) };
        } catch (_) { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (err) {
    Logger.log('getPastAnnouncements: ' + err);
    return [];
  }
}
