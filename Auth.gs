// =================================================================
// Auth.gs — สมัครสมาชิก / เข้าสู่ระบบ
// =================================================================

function registerUser(formData, fileObject) {
  try {
    const { headers, rows } = getSheetData('Members');
    const usernameCol = headers.indexOf('Username');

    const isDuplicate = rows.some(r => String(r[usernameCol]) === String(formData.username));
    if (isDuplicate) return _fail('ชื่อผู้ใช้งานนี้มีอยู่แล้ว');

    const newId   = 'MEM' + Date.now();
    let   photoUrl = '';

    if (fileObject?.data) {
      photoUrl = uploadFileToDrive(fileObject.data, fileObject.fileName, newId);
      if (!photoUrl) return _fail('ไม่สามารถอัปโหลดรูปบัตรประชาชนได้');
    }

    getSheet('Members').appendRow([
      newId,
      formData.username,
      formData.password,
      formData.fullName,
      "'" + formData.phone,
      formData.bankName,
      "'" + formData.bankAccount,
      photoUrl,
      'Pending',
      0,
      new Date().toISOString(),
    ]);

    return _ok('สมัครสมาชิกสำเร็จ! รอการอนุมัติจากผู้ดูแลระบบ');
  } catch (err) {
    Logger.log('registerUser: ' + err);
    return _fail('เกิดข้อผิดพลาด: ' + err.message);
  }
}

// -----------------------------------------------------------------

function login(credentials) {
  try {
    // 1. ตรวจ Admin
    const adminResult = _checkAdmin(credentials);
    if (adminResult) return adminResult;

    // 2. ตรวจ Member
    return _checkMember(credentials);
  } catch (err) {
    Logger.log('login: ' + err);
    return _fail('เกิดข้อผิดพลาด: ' + err.message);
  }
}

function _checkAdmin({ username, password }) {
  const sheet = ss.getSheetByName('Admins') || getSheet('Admins');
  const data  = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(username) &&
        String(data[i][1]) === String(password)) {
      return { success: true, role: 'admin', message: 'เข้าสู่ระบบผู้ดูแลสำเร็จ' };
    }
  }
  return null;
}

function _checkMember({ username, password }) {
  const { headers, rows } = getSheetData('Members');

  const col = (names) => headers.findIndex(h => names.includes(h.trim()));
  const usernameCol = col(['Username', 'ชื่อผู้ใช้']);
  const passwordCol = col(['Password', 'รหัสผ่าน']);
  const statusCol   = col(['Status',   'สถานะ']);
  const creditCol   = col(['Credit',   'เครดิต']);
  const nameCol     = col(['FullName',  'ชื่อ-นามสกุล', 'ชื่อจริง']);

  for (const row of rows) {
    if (String(row[usernameCol]) !== String(username)) continue;
    if (String(row[passwordCol]) !== String(password)) continue;

    const status = String(row[statusCol]);
    if (status === 'Approved') {
      return {
        success: true,
        role: 'member',
        message: 'เข้าสู่ระบบสำเร็จ',
        memberInfo: {
          id:     row[0],
          name:   row[nameCol],
          credit: parseFloat(row[creditCol] || 0),
        },
      };
    }
    return _fail('บัญชีของคุณสถานะ: ' + status + ' (ยังไม่ได้รับอนุมัติ)');
  }

  return _fail('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
}

// -----------------------------------------------------------------
// Helper: อัปโหลดไฟล์ไปยัง Drive
// -----------------------------------------------------------------

function uploadFileToDrive(base64Data, fileName, prefix) {
  try {
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    const folder  = folders.hasNext() ? folders.next() : DriveApp.createFolder(DRIVE_FOLDER_NAME);

    const contentType = base64Data.substring(5, base64Data.indexOf(';'));
    const bytes = Utilities.base64Decode(base64Data.substr(base64Data.indexOf('base64,') + 7));
    const blob  = Utilities.newBlob(bytes, contentType, `${prefix}_${fileName}`);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    return file.getUrl();
  } catch (err) {
    Logger.log('uploadFileToDrive: ' + err);
    return null;
  }
}

// -----------------------------------------------------------------
// Shared response helpers (ใช้ในทุก .gs)
// -----------------------------------------------------------------

function _ok(message, extra = {})   { return { success: true,  message, ...extra }; }
function _fail(message, extra = {}) { return { success: false, message, ...extra }; }

/** แปลง phone/account ที่มี prefix ' ออก */
function _cleanStr(val) {
  const s = String(val || '');
  return s.startsWith("'") ? s.slice(1) : s;
}
