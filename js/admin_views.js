// =================================================================
// admin_views.js — Renderers สำหรับ Admin (GitHub Pages version)
// =================================================================

// ---------- Members Table ----------
function renderMembersTable(members) {
  const area = document.getElementById('admin-area');
  const rows = members.map(m => {
    const badge = _statusBadge(m.status);
    const photo = m.idCardPhotoUrl
      ? `<a href="${m.idCardPhotoUrl}" target="_blank" class="text-blue-500 hover:underline text-xs">ดูรูป</a>`
      : '-';
    const approve = m.status === 'Pending'
      ? `<button class="btn-approve-member mr-1 bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
             data-id="${m.id}">อนุมัติ</button>` : '';
    return [
      `${m.fullName} <span class="text-gray-400 text-xs font-mono">(${m.username})</span>`,
      m.phone,
      `<span class="font-bold">${fmtMoney(m.credit)}</span>`,
      badge, photo,
      approve,
    ];
  });

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">จัดการสมาชิก</h3>
    ${_tbl(['ชื่อ-สกุล','เบอร์','เครดิต','สถานะ','รูปบัตร','ดำเนินการ'], rows)}`;
}

// ---------- Pending Deposits ----------
function renderPendingDeposits(deposits) {
  const area = document.getElementById('admin-area');
  const rows = deposits.map(d => [
    d.memberName, d.phone,
    `<span class="font-bold text-green-600">${fmtMoney(d.amount)} บาท</span>`,
    fmtDate(d.timestamp),
    `<a href="${d.slipUrl}" target="_blank" class="text-blue-500 hover:underline text-xs">ดูสลิป</a>`,
    `<button class="btn-approve-deposit bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
        data-id="${d.id}" data-member-id="${d.memberId}" data-amount="${d.amount}">อนุมัติ</button>`,
  ]);

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">รายการรออนุมัติเติมเงิน</h3>
    ${_tbl(['ชื่อ','เบอร์','จำนวน','เวลา','หลักฐาน','ดำเนินการ'], rows)}`;
}

// ---------- Pending Withdrawals ----------
function renderPendingWithdrawals(withdrawals) {
  const area = document.getElementById('admin-area');
  const rows = withdrawals.map(w => [
    w.memberName, w.phone,
    `${w.bankName} / ${w.bankAccount}`,
    `<span class="font-bold text-red-600">${fmtMoney(w.amount)} บาท</span>`,
    fmtDate(w.timestamp),
    `<button class="btn-approve-withdrawal bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
        data-id="${w.id}" data-member-id="${w.memberId}" data-amount="${w.amount}">อนุมัติ</button>`,
  ]);

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">รายการรออนุมัติถอนเงิน</h3>
    ${_tbl(['ชื่อ','เบอร์','ธนาคาร','จำนวน','เวลา','ดำเนินการ'], rows)}`;
}

// ---------- Deposit History ----------
function renderDepositHistory(deposits) {
  const area = document.getElementById('admin-area');
  const rows = deposits.map(d => [
    d.memberName,
    `<span class="font-bold text-green-600">${fmtMoney(d.amount)} บาท</span>`,
    fmtDate(d.timestamp),
    `<a href="${d.slipUrl}" target="_blank" class="text-blue-500 hover:underline text-xs">ดูสลิป</a>`,
    _statusBadge(d.status),
  ]);

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">ประวัติการเติมเงินทั้งหมด</h3>
    ${_tbl(['ชื่อสมาชิก','จำนวน','เวลา','หลักฐาน','สถานะ'], rows)}`;
}

// ---------- Withdrawal History ----------
function renderWithdrawalHistory(withdrawals) {
  const area = document.getElementById('admin-area');
  const rows = withdrawals.map(w => [
    w.memberName, w.phone, w.bankAccount,
    `<span class="font-bold text-red-600">${fmtMoney(w.amount)} บาท</span>`,
    fmtDate(w.timestamp),
    _statusBadge(w.status),
  ]);

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">ประวัติการถอนเงินทั้งหมด</h3>
    ${_tbl(['ชื่อ','เบอร์','บัญชี','จำนวน','เวลา','สถานะ'], rows)}`;
}

// ---------- Banks ----------
function renderBanks(accounts) {
  const area = document.getElementById('admin-area');
  const list = accounts.map(acc => {
    const isActive = acc.status === 'Active';
    const activeBadge = isActive
      ? '<span class="px-2 py-1 text-xs font-semibold rounded-full text-green-700 bg-green-100">กำลังใช้งาน</span>'
      : `<button class="btn-set-active text-xs text-blue-600 font-semibold hover:underline"
             data-id="${acc.id}">เลือกใช้</button>`;

    return `<div class="p-4 border rounded-lg flex justify-between items-center bg-white shadow-sm">
      <div>
        <p class="font-bold text-gray-800">${acc.bankName} — ${acc.accountNumber}</p>
        <p class="text-sm text-gray-600">ชื่อบัญชี: ${acc.accountName}</p>
        <div class="mt-1">${activeBadge}</div>
      </div>
      <div class="flex gap-2">
        <button class="btn-edit-bank text-xs text-gray-500 font-semibold hover:underline"
            data-acc='${JSON.stringify(acc)}'>แก้ไข</button>
        <button class="btn-delete-bank text-xs text-red-600 font-semibold hover:underline"
            data-id="${acc.id}">ลบ</button>
      </div>
    </div>`;
  }).join('');

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">จัดการบัญชีธนาคาร</h3>
    <div class="bg-white p-6 rounded-xl shadow-lg">
      <form id="form-bank" class="mb-6 border-b pb-6">
        <h4 class="font-semibold text-lg mb-3">เพิ่ม / แก้ไขบัญชี</h4>
        <input type="hidden" id="bank-id">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input type="text" id="bank-name"    placeholder="ชื่อธนาคาร"  class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" required>
          <input type="text" id="bank-number"  placeholder="เลขบัญชี"     class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" required>
          <input type="text" id="bank-accname" placeholder="ชื่อบัญชี"    class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" required>
          <input type="url"  id="bank-qr"      placeholder="URL QR Code"  class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400">
        </div>
        <button type="submit" class="mt-3 bg-green-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-800">บันทึก</button>
      </form>
      <h4 class="font-semibold text-lg mb-3">รายการบัญชีทั้งหมด</h4>
      <div class="space-y-3">${list || '<p class="text-gray-500">ยังไม่มีบัญชี</p>'}</div>
    </div>`;
}

// ---------- Lottery Types ----------
function renderLotteryTypes(types) {
  const area = document.getElementById('admin-area');
  const list = types.map(t => `
    <div class="p-4 border rounded-lg flex justify-between items-center bg-gray-50">
      <div>
        <p class="font-bold text-gray-800">${t.name}</p>
        <p class="text-sm text-gray-500">${t.description} / ${t.digits} หลัก</p>
      </div>
      <div class="flex gap-2">
        <button class="btn-edit-type text-xs text-blue-600 font-semibold hover:underline"
            data-type='${JSON.stringify(t)}'>แก้ไข</button>
        <button class="btn-delete-type text-xs text-red-600 font-semibold hover:underline"
            data-id="${t.id}">ลบ</button>
      </div>
    </div>`).join('');

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">จัดการประเภทสลาก</h3>
    <div class="bg-white p-6 rounded-xl shadow-lg">
      <form id="form-lottery-type" class="mb-6 border-b pb-6">
        <h4 class="font-semibold text-lg mb-3">เพิ่ม / แก้ไขประเภทสลาก</h4>
        <input type="hidden" id="type-id">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input type="text"   id="type-name"   placeholder="ชื่อประเภท"       class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" required>
          <input type="text"   id="type-desc"   placeholder="คำอธิบาย (00-99)" class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" required>
          <input type="number" id="type-digits" placeholder="จำนวนหลัก"        class="p-3 border rounded-lg outline-none focus:ring-2 focus:ring-green-400" min="1" max="10" required>
        </div>
        <button type="submit" class="mt-3 bg-green-700 text-white py-2 px-6 rounded-lg font-semibold hover:bg-green-800">บันทึก</button>
      </form>
      <h4 class="font-semibold text-lg mb-3">รายการประเภทสลาก</h4>
      <div class="space-y-3">${list || '<p class="text-gray-500">ยังไม่มีข้อมูล</p>'}</div>
    </div>`;
}

// ---------- Announce Winners ----------
function renderAnnounce(types, past) {
  const area = document.getElementById('admin-area');
  const inputs = types.map(t => `
    <div>
      <label class="block font-medium text-gray-700 mb-1">${t.name} (${t.description})</label>
      <input type="text" name="${t.id}"
             class="w-full p-3 border rounded-lg font-mono text-lg outline-none focus:ring-2 focus:ring-green-400"
             placeholder="ตัวเลข ${t.digits} หลัก" maxlength="${t.digits}" pattern="[0-9]{${t.digits}}" required>
    </div>`).join('');

  const pastRows = past.map(r => {
    const nums = types.map(t => `<td class="px-4 py-2 text-center font-mono font-bold text-blue-600">${r.numbers[t.id] || '-'}</td>`).join('');
    return `<tr class="border-b""><td class="px-4 py-2">${fmtDate(r.date)}</td>${nums}</tr>`;
  }).join('') || `<tr><td colspan="${types.length + 1}" class="text-center p-4 text-gray-400">ยังไม่มีประวัติ</td></tr>`;

  const histHeaders = ['วันที่ประกาศ', ...types.map(t => t.name)];

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">ประกาศผลรางวัล</h3>
    <div class="bg-white p-6 rounded-xl shadow-lg mb-6">
      <form id="form-announce" class="space-y-4">
        ${inputs}
        <div class="pt-4 border-t">
          <button type="submit"
                  class="bg-red-600 text-white py-3 px-6 rounded-lg text-lg font-semibold hover:bg-red-700">
            ประกาศผลรางวัล
          </button>
        </div>
      </form>
    </div>
    <h3 class="text-2xl font-bold text-green-800 mb-4">ประวัติการประกาศ</h3>
    <div class="bg-white p-4 rounded-xl shadow-lg overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-200">
          <tr>${histHeaders.map(h => `<th class="px-4 py-3 text-left">${h}</th>`).join('')}</tr>
        </thead>
        <tbody>${pastRows}</tbody>
      </table>
    </div>`;
}

// ---------- Member Report ----------
function renderReport(report) {
  const area = document.getElementById('admin-area');
  const rows = report.members.map(m => [
    m.FullName, m.Phone, m.BankAcc,
    `<span class="text-red-600 font-bold">${fmtMoney(m.totalSpent)}</span>`,
    `<span class="text-green-600 font-bold">${fmtMoney(m.totalWinnings)}</span>`,
  ]);

  area.innerHTML = `
    <h3 class="text-2xl font-bold text-green-800 mb-4">รายงานสมาชิก</h3>
    <div class="grid grid-cols-2 gap-4 mb-6">
      <div class="bg-green-50 p-4 rounded-xl shadow-sm">
        <p class="text-sm text-gray-600">ยอดซื้อรวม</p>
        <p class="text-2xl font-bold text-green-700">${fmtMoney(report.summary.totalSpent)} บาท</p>
      </div>
      <div class="bg-yellow-50 p-4 rounded-xl shadow-sm">
        <p class="text-sm text-gray-600">ยอดรางวัลรวม</p>
        <p class="text-2xl font-bold text-yellow-700">${fmtMoney(report.summary.totalWinnings)} บาท</p>
      </div>
    </div>
    ${_tbl(['ชื่อ-สกุล','เบอร์','บัญชี','ยอดซื้อรวม','ยอดรางวัลรวม'], rows)}`;
}
