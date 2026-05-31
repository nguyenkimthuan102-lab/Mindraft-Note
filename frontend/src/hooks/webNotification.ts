import { createNotification } from '../api/notificationApi';
import { useNotificationStore } from '../store/useNotificationStore';

const scheduledTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();

// ── Tính thời điểm kế tiếp hợp lệ ───────────────────────────────────────
export function resolveNextTriggerDate(
  remindAt: Date,
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly'
): Date {
  const now = new Date();
  const target = new Date(remindAt);

  // Nếu mốc thời gian truyền vào ở tương lai, giữ nguyên sử dụng luôn
  if (target > now) return target;

  // Nếu thời gian truyền vào đã thuộc về quá khứ:
  if (repeatType === 'none') {
    return target; // Không lặp -> Trả về mốc cũ để hàm gọi phía sau biết là đã quá hạn và chặn lại
  }

  const next = new Date(target);

  switch (repeatType) {
    case 'daily': {
      while (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      return next;
    }
    case 'weekly': {
      while (next <= now) {
        next.setDate(next.getDate() + 7);
      }
      return next;
    }
    case 'monthly': {
      while (next <= now) {
        next.setMonth(next.getMonth() + 1);
      }
      return next;
    }
    default:
      return target;
  }
}

// ── Xin quyền thông báo ───────────────────────────────────────────────────
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
  repeatType: 'none' | 'daily' | 'weekly' | 'monthly';
  noteId?: string;
  noteTitle?: string;
}): Promise<{ scheduled: boolean; nextTrigger: Date | null }> {
  const hasPermission = await requestWebNotificationPermission();
  if (!hasPermission) return { scheduled: false, nextTrigger: null };

  // Tính toán thời điểm nổ chuông hợp lệ tiếp theo
  const nextTrigger = resolveNextTriggerDate(params.remindAt, params.repeatType);
  const now = new Date();

  // CHẶN SPAM: Nếu không lặp mà thời gian tính ra đã qua hoặc bằng hiện tại -> Huỷ bỏ xếp lịch
  if (params.repeatType === 'none' && nextTrigger <= now) {
    console.log(`[WebNotification] Bỏ qua nhắc nhở không lặp đã quá hạn: "${params.body}"`);
    cancelWebNotification(params.id);
    return { scheduled: false, nextTrigger: null };
  }

  const delay = nextTrigger.getTime() - now.getTime();

  // Xoá bộ hẹn giờ cũ của id này (nếu có) trước khi tạo bộ hẹn giờ mới
  cancelWebNotification(params.id);

  console.log(
    `[WebNotification] Lên lịch thành công: "${params.body}" lúc ${nextTrigger.toLocaleString('vi-VN')} (sau ${Math.round(delay / 1000)} giây)`
  );

  const timer = setTimeout(async () => {
    // Ngay khi kích hoạt, xoá timer khỏi Map lưu trữ RAM tạm thời
    scheduledTimers.delete(params.id);

    // 1. Hiển thị Banner đẩy của trình duyệt
    const notification = new Notification(params.title, {
      body: params.body,
      tag: params.id,
      requireInteraction: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    // 2. Đồng bộ lưu lịch sử thông báo lên Server hệ thống
    try {
      await createNotification({
        type: 'reminder',
        note: params.noteId ?? null,
        payload: {
          message: params.body,
          note_title: params.noteTitle ?? params.body,
          reminder_id: params.id,
        },
      });
      await useNotificationStore.getState().loadNotifications();
      console.log('[WebNotification] Đã lưu thông báo lên hệ thống Server.');
    } catch (err) {
      console.error('[WebNotification] Lỗi khi lưu dữ liệu thông báo lên Server:', err);
    }

    // 3. XỬ LÝ CHU KỲ LẶP TIẾP THEO: Nếu cấu hình có lặp
    if (params.repeatType !== 'none') {
      // Tính chu kỳ tiếp theo dựa trên mốc thời gian vừa nổ chuông (nextTrigger)
      const nextRepeat = resolveNextTriggerDate(nextTrigger, params.repeatType);
      
      // Chỉ kích hoạt xếp đệ quy chu kỳ mới nếu chu kỳ đó thực sự ở tương lai
      if (nextRepeat > new Date()) {
        await scheduleWebNotification({ ...params, remindAt: nextRepeat });
      }
    }
  }, Math.max(0, delay)); // Đảm bảo tham số delay truyền vào setTimeout không bao giờ âm

  // Lưu tham chiếu timer vào Map để có thể clear khi cần (Cập nhật / Xoá nhắc nhở)
  scheduledTimers.set(params.id, timer);
  return { scheduled: true, nextTrigger };
}

// ── Hủy thông báo đã lên lịch ────────────────────────────────────────────
export function cancelWebNotification(id: string): void {
  const timer = scheduledTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    scheduledTimers.delete(id);
    console.log(`[WebNotification] Đã xóa chu kỳ hẹn giờ của ID: ${id}`);
  }
}

// ── Kiểm tra quyền hiện tại của trình duyệt ───────────────────────────────
export function getWebNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}