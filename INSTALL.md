# คู่มือติดตั้ง v2 — GitHub Pages + Google Apps Script

---

## สถาปัตยกรรมใหม่

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│      GitHub Pages           │        │    Google Apps Script        │
│  (Frontend — Static Files)  │        │  (Backend — REST API)        │
│                             │  HTTP  │                              │
│  index.html                 │ ──────▶│  doGet(e)  ?action=xxx       │
│  js/api.js                  │        │  doPost(e) body:{action,...} │
│  js/app.js                  │ ◀──────│                              │
│  js/member_views.js         │  JSON  │  ← Google Sheets (DB)        │
│  js/admin_views.js          │        │                              │
│  js/handlers.js             │        │                              │
└─────────────────────────────┘        └──────────────────────────────┘
```

---

## ส่วนที่ 1: ติดตั้ง Backend (Google Apps Script)

### ขั้นตอน 1.1 — สร้าง Google Sheets + Apps Script

1. ไปที่ [sheets.google.com](https://sheets.google.com) → สร้าง Spreadsheet ใหม่
2. ตั้งชื่อ เช่น `ระบบสลาก-DB`
3. เมนู **Extensions** → **Apps Script**

### ขั้นตอน 1.2 — สร้างไฟล์ .gs ทั้งหมด

ใน Apps Script editor สร้างไฟล์ต่อไปนี้ตามลำดับ:

| ลำดับ | ชื่อไฟล์ | หมายเหตุ |
|-------|----------|----------|
| 1 | `Config` | **ต้องอยู่บนสุด** |
| 2 | `Main`   | มี doGet / doPost |
| 3 | `Auth`   | |
| 4 | `Members` | |
| 5 | `Deposits` | |
| 6 | `Withdrawals` | |
| 7 | `Lottery` | |
| 8 | `Announcements` | |
| 9 | `Banks` | |
| 10 | `Notifications` | |

วิธีสร้างแต่ละไฟล์:
- กด **+** ด้านซ้าย → เลือก **Script**
- ตั้งชื่อ (ไม่ต้องพิมพ์ `.gs`)
- วางโค้ดจากโฟลเดอร์ `backend/`

### ขั้นตอน 1.3 — แก้ Config.gs

```javascript
// เปลี่ยนเป็นค่าจริง
const LINE_CHANNEL_ACCESS_TOKEN = 'your_token_here';
const LINE_GROUP_ID             = 'your_group_id_here';
```

### ขั้นตอน 1.4 — Deploy เป็น Web App

1. กด **Deploy** → **New deployment**
2. กด ⚙️ → เลือก **Web app**
3. ตั้งค่า:

   ```
   Execute as:      Me
   Who has access:  Anyone
   ```

4. กด **Deploy** → **Authorize access** → Allow
5. **คัดลอก Web App URL** ไว้ (จะใช้ในขั้นตอนถัดไป)

   ตัวอย่าง URL:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxx/exec
   ```

### ขั้นตอน 1.5 — ทดสอบ API

เปิด browser ไปที่ URL ต่อไปนี้ ต้องได้ JSON กลับมา:

```
https://script.google.com/macros/s/AKfycbxxx/exec?action=getLotteryTypes
```

ผลที่ควรได้:
```json
[
  {"id":"L2U","name":"เลข 2 ตัวบน","description":"00-99","digits":2},
  ...
]
```

---

## ส่วนที่ 2: ติดตั้ง Frontend (GitHub Pages)

### ขั้นตอน 2.1 — สร้าง Repository บน GitHub

1. ไปที่ [github.com](https://github.com) → กด **New repository**
2. ตั้งชื่อ เช่น `lottery-app`
3. เลือก **Public**
4. กด **Create repository**

### ขั้นตอน 2.2 — อัปโหลดไฟล์

โครงสร้างไฟล์ที่ต้องอัปโหลด:

```
📁 repository root
├── index.html
└── js/
    ├── api.js
    ├── app.js
    ├── member_views.js
    ├── admin_views.js
    └── handlers.js
```

วิธีอัปโหลด (ง่ายที่สุด):
- กด **Add file** → **Upload files**
- ลากไฟล์ทั้งหมดขึ้น (ต้องสร้างโฟลเดอร์ `js/` ด้วยการ upload ไฟล์ใน path `js/api.js`)

หรือใช้ Git:
```bash
git clone https://github.com/yourusername/lottery-app.git
# คัดลอกไฟล์เข้าไปใน folder
git add .
git commit -m "Initial setup"
git push origin main
```

### ขั้นตอน 2.3 — แก้ GAS_URL ใน api.js

เปิดไฟล์ `js/api.js` แก้บรรทัดนี้:

```javascript
// ❌ เดิม
const GAS_URL = 'YOUR_GAS_WEB_APP_URL_HERE';

// ✅ แก้เป็น URL จริงที่ได้จากขั้นตอน 1.4
const GAS_URL = 'https://script.google.com/macros/s/AKfycbxxxxxxxxx/exec';
```

### ขั้นตอน 2.4 — เปิด GitHub Pages

1. ใน Repository → กด **Settings** (เมนูบนสุด)
2. เลือก **Pages** (sidebar ซ้าย)
3. ตั้งค่า:
   ```
   Source: Deploy from a branch
   Branch: main
   Folder: / (root)
   ```
4. กด **Save**
5. รอ 1-2 นาที → URL จะขึ้นมาในรูปแบบ:
   ```
   https://yourusername.github.io/lottery-app/
   ```

---

## ขั้นตอน 3: ทดสอบระบบ

1. เปิด GitHub Pages URL
2. Login ด้วย `admin` / `1234`
3. ทดสอบสมัครสมาชิก → อนุมัติ → login → ซื้อสลาก

---

## การแก้ไขโค้ดในอนาคต

### แก้ Frontend (GitHub Pages)
```
แก้ไฟล์ → Push to GitHub → รอ 1-2 นาที → อัปเดตอัตโนมัติ ✅
```

### แก้ Backend (GAS)
```
แก้โค้ด → Deploy → Manage deployments → Edit → New version → Deploy ✅
```
> ⚠️ GAS ต้อง Redeploy ทุกครั้ง ถึงจะเห็นผล

---

## API Reference (สรุป)

### GET Endpoints

| action | params | คำอธิบาย |
|--------|--------|----------|
| `getLotteryTypes` | - | ดึงประเภทสลากทั้งหมด |
| `getBankAccounts` | `forAdmin=true` | ดึงบัญชีธนาคาร |
| `getAllMembers` | - | ดึงสมาชิกทั้งหมด (admin) |
| `getPendingDeposits` | - | รายการเติมเงินรออนุมัติ |
| `getPendingWithdrawals` | - | รายการถอนเงินรออนุมัติ |
| `getDepositHistory` | - | ประวัติเติมเงินทั้งหมด |
| `getWithdrawalHistory` | - | ประวัติถอนเงินทั้งหมด |
| `getMemberReport` | - | รายงานสมาชิก |
| `getMemberPurchaseHistory` | `memberId` | ประวัติซื้อสลากของสมาชิก |
| `getMemberHistory` | `memberId` | ประวัติเติม/ถอนของสมาชิก |
| `getPastAnnouncements` | - | ประวัติประกาศผล |

### POST Endpoints (body: JSON)

| action | payload | คำอธิบาย |
|--------|---------|----------|
| `login` | `{ credentials }` | เข้าสู่ระบบ |
| `registerUser` | `{ formData, fileObject }` | สมัครสมาชิก |
| `requestCreditDeposit` | `{ depositInfo, fileObject }` | แจ้งเติมเงิน |
| `requestWithdrawal` | `{ withdrawalData }` | แจ้งถอนเงิน |
| `recordPurchases` | `{ purchases, memberId }` | ซื้อสลาก |
| `claimWinnings` | `{ purchaseId, memberId }` | รับรางวัล |
| `approveMember` | `{ memberId }` | อนุมัติสมาชิก |
| `approveDeposit` | `{ depositId, memberId, amount }` | อนุมัติเติมเงิน |
| `approveWithdrawal` | `{ withdrawalId, memberId, amount }` | อนุมัติถอนเงิน |
| `updateBankAccount` | `{ bankInfo }` | เพิ่ม/แก้ไขธนาคาร |
| `deleteBankAccount` | `{ bankId }` | ลบธนาคาร |
| `setActiveBankAccount` | `{ bankId }` | เลือกธนาคารหลัก |
| `updateLotteryType` | `{ typeInfo }` | เพิ่ม/แก้ไขประเภทสลาก |
| `deleteLotteryType` | `{ typeId }` | ลบประเภทสลาก |
| `announceWinners` | `{ winningNumbers }` | ประกาศผลรางวัล |

---

## ปัญหาที่พบบ่อย

**CORS Error ใน Console**

→ ตรวจสอบว่า GAS deploy แบบ `Who has access: Anyone` (ไม่ใช่ Anyone with Google account)

→ ตรวจสอบว่า `api.js` ใช้ `redirect: 'follow'` ในทั้ง GET และ POST

**fetch ไม่ได้รับ Response**

→ ทดสอบ GET URL ใน browser ก่อน — ต้องได้ JSON กลับมา

**"Missing action parameter"**

→ ตรวจสอบว่า `GAS_URL` ใน `api.js` ถูกต้องและไม่มีช่องว่าง

**แก้โค้ดแล้วไม่เห็นผล**

→ GAS: ต้อง Redeploy → New version

→ GitHub Pages: ต้อง Push และรอ 1-2 นาที (หรือ Ctrl+Shift+R เพื่อ hard refresh)
