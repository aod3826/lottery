// =================================================================
// js/handlers.js — Event Handlers
// ทุก write operation ใช้ api.post('action', payload)
// =================================================================

// ================================================================
// AUTH
// ================================================================

function handleLogin(e) {
  e.preventDefault();
  loading('กำลังเข้าสู่ระบบ...');
  api.post('login', {
    credentials: {
      username: document.getElementById('inp-username').value,
      password: document.getElementById('inp-password').value,
    },
  }).then(res => {
    if (res.success) { onLoginSuccess(res); Swal.close(); }
    else Swal.fire('ผิดพลาด!', res.message, 'error');
  }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
}

function handleRegister(e) {
  e.preventDefault();
  const form      = e.target;
  const fileInput = form.querySelector('input[name="idCardPhoto"]');
  const file      = fileInput.files[0];
  const fd        = new FormData(form);
  const formData  = Object.fromEntries(fd.entries());
  delete formData.idCardPhoto;

  const callServer = (fileObject) => {
    loading('กำลังสมัครสมาชิก...');
    api.post('registerUser', { formData, fileObject })
      .then(res => {
        Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
        if (res.success) { showPage('pg-login'); form.reset(); }
      }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
  };

  if (file) {
    const reader = new FileReader();
    reader.onload  = ev => callServer({ fileName: file.name, mimeType: file.type, data: ev.target.result });
    reader.onerror = () => Swal.fire('ผิดพลาด!', 'อ่านไฟล์ไม่ได้', 'error');
    reader.readAsDataURL(file);
  } else {
    callServer(null);
  }
}

// ================================================================
// MEMBER FORMS
// ================================================================

function handleDepositSubmit(form) {
  const fileInput = form.querySelector('input[name="slipFile"]');
  const file      = fileInput.files[0];
  if (!file) { Swal.fire('ผิดพลาด!', 'กรุณาแนบสลิป', 'error'); return; }

  const fd         = new FormData(form);
  const depositInfo = Object.fromEntries(fd.entries());
  depositInfo.amount = parseFloat(depositInfo.amount);
  delete depositInfo.slipFile;

  const reader = new FileReader();
  reader.onload = ev => {
    loading('กำลังส่งหลักฐาน...');
    api.post('requestCreditDeposit', {
      depositInfo,
      fileObject: { fileName: file.name, mimeType: file.type, data: ev.target.result },
    }).then(res => {
      Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
      if (res.success) form.reset();
    }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
  };
  reader.onerror = () => Swal.fire('ผิดพลาด!', 'อ่านไฟล์ไม่ได้', 'error');
  reader.readAsDataURL(file);
}

function handleWithdrawSubmit(form) {
  const amount = parseFloat(form.querySelector('[name="amount"]').value);
  if (isNaN(amount) || amount <= 0 || amount > parseFloat(App.user.credit)) {
    Swal.fire('ผิดพลาด!', 'จำนวนเงินไม่ถูกต้อง', 'error'); return;
  }
  Swal.fire({
    title: 'ยืนยันการถอนเงิน', text: `ถอน ${fmtMoney(amount)} บาท?`,
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#d33', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
  }).then(r => {
    if (!r.isConfirmed) return;
    loading('กำลังส่งคำขอ...');
    api.post('requestWithdrawal', { withdrawalData: { memberId: App.user.id, amount } })
      .then(res => {
        Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
        if (res.success) loadMember('withdraw');
      }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
  });
}

function handleClaim(purchaseId) {
  Swal.fire({
    title: 'ยืนยันการรับรางวัล?', text: 'เครดิตจะถูกเพิ่มทันที',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
  }).then(r => {
    if (!r.isConfirmed) return;
    loading('กำลังดำเนินการ...');
    api.post('claimWinnings', { purchaseId, memberId: App.user.id })
      .then(res => {
        if (res.success) {
          App.user.credit = res.newCredit; refreshTopBar();
          Swal.fire('สำเร็จ!', res.message, 'success');
          loadMember('purchase-history');
        } else { Swal.fire('ผิดพลาด!', res.message, 'error'); }
      }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
  });
}

// ================================================================
// ADMIN CLICK DELEGATION
// ================================================================

function handleAdminClick(e) {

  const approveMemberBtn = e.target.closest('.btn-approve-member');
  if (approveMemberBtn) {
    _confirmAction('ยืนยันการอนุมัติสมาชิก?', () =>
      api.post('approveMember', { memberId: approveMemberBtn.dataset.id })
        .then(res => _afterAdmin(res, 'members'))
    ); return;
  }

  const approveDepBtn = e.target.closest('.btn-approve-deposit');
  if (approveDepBtn) {
    const { id, memberId, amount } = approveDepBtn.dataset;
    _confirmAction(`อนุมัติเติมเงิน ${amount} บาท?`, () =>
      api.post('approveDeposit', { depositId: id, memberId, amount: parseFloat(amount) })
        .then(res => _afterAdmin(res, 'approve-deposits'))
    ); return;
  }

  const approveWdBtn = e.target.closest('.btn-approve-withdrawal');
  if (approveWdBtn) {
    const { id, memberId, amount } = approveWdBtn.dataset;
    _confirmAction(`อนุมัติถอนเงิน ${amount} บาท?`, () =>
      api.post('approveWithdrawal', { withdrawalId: id, memberId, amount: parseFloat(amount) })
        .then(res => _afterAdmin(res, 'approve-withdrawals'))
    ); return;
  }

  const setActiveBtn = e.target.closest('.btn-set-active');
  if (setActiveBtn) {
    _confirmAction('ตั้งเป็นบัญชีที่ใช้งานหลัก?', () =>
      api.post('setActiveBankAccount', { bankId: setActiveBtn.dataset.id })
        .then(res => _afterAdmin(res, 'banks'))
    ); return;
  }

  const editBankBtn = e.target.closest('.btn-edit-bank');
  if (editBankBtn) {
    const acc = JSON.parse(editBankBtn.dataset.acc);
    document.getElementById('bank-id').value      = acc.id;
    document.getElementById('bank-name').value     = acc.bankName;
    document.getElementById('bank-number').value   = acc.accountNumber;
    document.getElementById('bank-accname').value  = acc.accountName;
    document.getElementById('bank-qr').value       = acc.qrCodeUrl;
    document.getElementById('admin-area').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const delBankBtn = e.target.closest('.btn-delete-bank');
  if (delBankBtn) {
    _confirmDelete('บัญชีนี้', () =>
      api.post('deleteBankAccount', { bankId: delBankBtn.dataset.id })
        .then(res => _afterAdmin(res, 'banks'))
    ); return;
  }

  const editTypeBtn = e.target.closest('.btn-edit-type');
  if (editTypeBtn) {
    const t = JSON.parse(editTypeBtn.dataset.type);
    document.getElementById('type-id').value     = t.id;
    document.getElementById('type-name').value   = t.name;
    document.getElementById('type-desc').value   = t.description;
    document.getElementById('type-digits').value = t.digits;
    document.getElementById('admin-area').scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const delTypeBtn = e.target.closest('.btn-delete-type');
  if (delTypeBtn) {
    _confirmDelete('ประเภทสลากนี้', () =>
      api.post('deleteLotteryType', { typeId: delTypeBtn.dataset.id })
        .then(res => _afterAdmin(res, 'lottery-types'))
    ); return;
  }
}

// ================================================================
// ADMIN FORMS
// ================================================================

function handleBankFormSubmit(form) {
  loading('กำลังบันทึก...');
  api.post('updateBankAccount', {
    bankInfo: {
      id:            document.getElementById('bank-id').value || null,
      bankName:      document.getElementById('bank-name').value,
      accountNumber: document.getElementById('bank-number').value,
      accountName:   document.getElementById('bank-accname').value,
      qrCodeUrl:     document.getElementById('bank-qr').value,
    },
  }).then(res => {
    Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
    if (res.success) { form.reset(); document.getElementById('bank-id').value = ''; loadAdmin('banks'); }
  }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
}

function handleLotteryTypeSubmit(form) {
  loading('กำลังบันทึก...');
  api.post('updateLotteryType', {
    typeInfo: {
      id:          document.getElementById('type-id').value || null,
      name:        document.getElementById('type-name').value,
      description: document.getElementById('type-desc').value,
      digits:      document.getElementById('type-digits').value,
    },
  }).then(res => {
    Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
    if (res.success) { form.reset(); document.getElementById('type-id').value = ''; loadAdmin('lottery-types'); }
  }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
}

function handleAnnounceSubmit(form) {
  const winningNumbers = Object.fromEntries(new FormData(form).entries());
  Swal.fire({
    title: 'ยืนยันการประกาศผล?', text: 'ระบบจะตรวจผู้ถูกรางวัลทันที',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#d33', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
  }).then(r => {
    if (!r.isConfirmed) return;
    loading('กำลังประมวลผล...');
    api.post('announceWinners', { winningNumbers })
      .then(res => {
        Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
        if (res.success) loadAdmin('announce');
      }).catch(err => Swal.fire('ผิดพลาด!', err.message, 'error'));
  });
}

// ================================================================
// Dialog helpers
// ================================================================

function _confirmAction(text, action) {
  Swal.fire({
    title: 'ยืนยัน', text, icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#166534', confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก',
  }).then(r => { if (r.isConfirmed) { loading(); action().catch(err => Swal.fire('ผิดพลาด!', err.message, 'error')); } });
}

function _confirmDelete(label, action) {
  Swal.fire({
    title: `ยืนยันการลบ${label}?`, text: 'ไม่สามารถย้อนกลับได้',
    icon: 'warning', showCancelButton: true,
    confirmButtonColor: '#d33', confirmButtonText: 'ลบเลย!', cancelButtonText: 'ยกเลิก',
  }).then(r => { if (r.isConfirmed) { loading('กำลังลบ...'); action().catch(err => Swal.fire('ผิดพลาด!', err.message, 'error')); } });
}

function _afterAdmin(res, reloadView) {
  Swal.fire(res.success ? 'สำเร็จ!' : 'ผิดพลาด!', res.message, res.success ? 'success' : 'error');
  if (res.success) loadAdmin(reloadView);
}
