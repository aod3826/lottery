// =================================================================
// Members.gs — จัดการข้อมูลสมาชิก
// =================================================================

function getAllMembers() {
  try {
    const { headers, rows } = getSheetData('Members');
    const c = _colMap(headers);
    return rows
      .filter(r => r[c.ID])
      .map(r => ({
        id:            r[c.ID],
        username:      r[c.Username],
        fullName:      r[c.FullName],
        phone:         _cleanStr(r[c.Phone]),
        bankName:      r[c.BankName],
        bankAccount:   _cleanStr(r[c.BankAccount]),
        idCardPhotoUrl:r[c.IdCardPhotoUrl],
        status:        r[c.Status],
        credit:        parseFloat(r[c.Credit] || 0),
        timestamp:     r[c.Timestamp],
      }));
  } catch (err) {
    Logger.log('getAllMembers: ' + err);
    return [];
  }
}

// -----------------------------------------------------------------

function approveMember(memberId) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet('Members');
    const { headers, rows } = getSheetData('Members');
    const c = _colMap(headers);

    for (let i = 0; i < rows.length; i++) {
      if (rows[i][c.ID] !== memberId) continue;
      if (rows[i][c.Status] !== 'Pending')
        return _fail('สมาชิกคนนี้ไม่อยู่ในสถานะรออนุมัติ');
      sheet.getRange(i + 2, c.Status + 1).setValue('Approved');
      return _ok('อนุมัติสมาชิกเรียบร้อยแล้ว');
    }
    return _fail('ไม่พบข้อมูลสมาชิก');
  } catch (err) {
    Logger.log('approveMember: ' + err);
    return _fail(err.message);
  } finally {
    lock.releaseLock();
  }
}

// -----------------------------------------------------------------
// Report
// -----------------------------------------------------------------

function getMemberReport() {
  try {
    const members   = getAllMembers();
    const { headers: pH, rows: pRows } = getSheetData('Purchases');
    const c = _colMap(pH);

    // สร้าง map: memberId → { totalSpent, totalWinnings }
    const statsMap = new Map();
    for (const row of pRows) {
      const mid = row[c.MemberID];
      if (!statsMap.has(mid)) statsMap.set(mid, { totalSpent: 0, totalWinnings: 0 });
      const s = statsMap.get(mid);
      s.totalSpent    += parseFloat(row[c.Amount]        || 0);
      s.totalWinnings += parseFloat(row[c.WinningAmount] || 0);
    }

    const memberDetails = members.map(m => {
      const s = statsMap.get(m.id) || { totalSpent: 0, totalWinnings: 0 };
      return { FullName: m.fullName, Phone: m.phone, BankAcc: m.bankAccount, ...s };
    });

    return {
      summary: {
        totalSpent:    memberDetails.reduce((a, m) => a + m.totalSpent,    0),
        totalWinnings: memberDetails.reduce((a, m) => a + m.totalWinnings, 0),
      },
      members: memberDetails,
    };
  } catch (err) {
    Logger.log('getMemberReport: ' + err);
    return { summary: { totalSpent: 0, totalWinnings: 0 }, members: [] };
  }
}

// -----------------------------------------------------------------
// Internal: สร้าง column index map จาก header array
// -----------------------------------------------------------------

function _colMap(headers) {
  const map = {};
  headers.forEach((h, i) => { map[h] = i; });
  return map;
}
