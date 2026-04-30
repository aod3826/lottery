// =================================================================
// js/api.js — API Layer
// ทุก call ไป GAS ผ่านฟังก์ชันในไฟล์นี้เท่านั้น
//
// GET  → api.get('action', { param1, param2 })
// POST → api.post('action', { payload })
// =================================================================

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwkB2fznWL9B7ryUKLbEE_ceoyDIjIhW5iQSd2rM53hj2T0a2pf6jiPmnU6F-mPJWf8/exec';
// ตัวอย่าง: 'https://script.google.com/macros/s/AKfycb.../exec'

const api = {

  // ---------------------------------------------------------------
  // GET — ดึงข้อมูล
  // ส่ง params เป็น query string: ?action=xxx&key=value
  // ---------------------------------------------------------------
  async get(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const url = `${GAS_URL}?${qs}`;

    const res = await fetch(url, {
      method:   'GET',
      redirect: 'follow',   // ✅ สำคัญ: GAS redirect ไป /exec ก่อนตอบ
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },

  // ---------------------------------------------------------------
  // POST — เขียน/แก้ไขข้อมูล
  // ส่ง body เป็น JSON string, Content-Type: text/plain
  // (หลีกเลี่ยง CORS preflight — GAS ไม่รองรับ OPTIONS request)
  // ---------------------------------------------------------------
  async post(action, payload = {}) {
    const body = JSON.stringify({ action, ...payload });

    const res = await fetch(GAS_URL, {
      method:   'POST',
      redirect: 'follow',   // ✅ สำคัญ: GAS redirect ไป /exec ก่อนตอบ
      headers: {
        'Content-Type': 'text/plain', // ✅ หลีกเลี่ยง preflight
      },
      body,
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  },
};
