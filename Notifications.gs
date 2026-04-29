// =================================================================
// Notifications.gs — ส่ง LINE message
// =================================================================

function sendLineMessage(text) {
  if (!LINE_CHANNEL_ACCESS_TOKEN || LINE_CHANNEL_ACCESS_TOKEN === 'YOUR_CHANNEL_ACCESS_TOKEN_HERE') {
    Logger.log('LINE Token ไม่ได้ตั้งค่า ข้ามการแจ้งเตือน');
    return;
  }
  if (!LINE_GROUP_ID || LINE_GROUP_ID === 'YOUR_GROUP_ID_HERE') {
    Logger.log('LINE Group ID ไม่ได้ตั้งค่า ข้ามการแจ้งเตือน');
    return;
  }

  try {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      contentType: 'application/json',
      headers: { Authorization: 'Bearer ' + LINE_CHANNEL_ACCESS_TOKEN },
      payload: JSON.stringify({
        to: LINE_GROUP_ID,
        messages: [{ type: 'text', text }],
      }),
      muteHttpExceptions: true,
    });
  } catch (err) {
    Logger.log('sendLineMessage error: ' + err);
  }
}
