// =================================================================
// Config.gs — ค่าคงที่และโครงสร้างชีตทั้งหมด
// แก้ไขแค่ไฟล์นี้เพื่อเปลี่ยน Token / Group ID
// =================================================================

const LINE_CHANNEL_ACCESS_TOKEN = 'YOUR_CHANNEL_ACCESS_TOKEN_HERE';
const LINE_GROUP_ID              = 'YOUR_GROUP_ID_HERE';
const DRIVE_FOLDER_NAME          = 'LotteryUploads';

// อัตราจ่าย (x เท่าของเงินเดิมพัน)
const PAYOUT_RATES = {
  'L2U': 90,
  'L2L': 90,
  'L3L': 500,
};

// โครงสร้างหัวตารางแต่ละชีต
const SHEET_HEADERS = {
  Members: [
    'ID', 'Username', 'Password', 'FullName',
    'Phone', 'BankName', 'BankAccount',
    'IdCardPhotoUrl', 'Status', 'Credit', 'Timestamp',
  ],
  Deposits: [
    'ID', 'MemberID', 'MemberName', 'Amount',
    'SlipUrl', 'Status', 'Timestamp', 'Phone',
  ],
  Withdrawals: [
    'ID', 'MemberID', 'MemberName', 'Amount',
    'Status', 'Timestamp', 'BankAccount', 'Phone',
  ],
  LotteryTypes: ['ID', 'Name', 'Description', 'Digits'],
  Purchases: [
    'ID', 'MemberID', 'LotteryTypeID', 'Number',
    'Amount', 'Status', 'Timestamp', 'WinningAmount',
    'RoundID', 'ClaimedTimestamp',
  ],
  BankAccounts: [
    'ID', 'BankName', 'AccountNumber',
    'AccountName', 'QrCodeUrl', 'Status',
  ],
  Announcements: [
    'RoundID', 'AnnouncementDate', 'WinningNumbers', 'ProcessedByAdmin',
  ],
  Admins: ['Username', 'Password'],
};
