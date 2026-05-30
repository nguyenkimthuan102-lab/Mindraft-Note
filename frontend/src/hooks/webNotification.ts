// src/hooks/webNotification.ts
// Dùng Web Notification API + setTimeout để lên lịch thông báo trên trình duyệt

// ── Map lưu các timer đang chạy (để cancel được) ─────────────────────────
const scheduledTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

// ── Xin quyền thông báo trên web ─────────────────────────────────────────
export async function requestWebNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[WebNotification] Trình duyệt không hỗ trợ Notification API');
    return false;
  }

  if (Notification.permission === 'granted') return true;

  if (Notification.permission === 'denied') {
    alert('Bạn đã chặn thông báo. Vào Settings trình duyệt để bật lại.');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// ── Lên lịch thông báo web ────────────────────────────────────────────────
export async function scheduleWebNotification(params: {
  id: string;
  title: string;
  body: string;
  remindAt: Date;
  noteId?: string;
}): Promise<boolean> {
  const hasPermission = await requestWebNotificationPermission();
  if (!hasPermission) return false;

  const now = new Date();
  const delay = params.remindAt.getTime() - now.getTime();

  if (delay <= 0) {
    console.warn('[WebNotification] Thời gian đã qua, không lên lịch.');
    return false;
  }

  // Hủy timer cũ nếu đã tồn tại
  cancelWebNotification(params.id);

  console.log(
    `[WebNotification] Đã lên lịch: "${params.body}" sau ${Math.round(delay / 1000)}s`
  );

  const timer = setTimeout(() => {
    const notification = new Notification(params.title, {
      body: params.body,
      icon: '/icon.png',
      tag: params.id,
      requireInteraction: true, // giữ thông báo đến khi user bấm
    });

    // Bấm vào thông báo → focus tab
    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    scheduledTimers.delete(params.id);
  }, delay);

  scheduledTimers.set(params.id, timer);
  return true;
}

// ── Hủy thông báo đã lên lịch ────────────────────────────────────────────
export function cancelWebNotification(id: string): void {
  const timer = scheduledTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    scheduledTimers.delete(id);
    console.log(`[WebNotification] Đã hủy lịch: ${id}`);
  }
}

// ── Kiểm tra permission hiện tại ─────────────────────────────────────────
export function getWebNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}