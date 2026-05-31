import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReminderData } from '../../api/reminderApi';
import { useLocalNotification } from '../../hooks/useLocalNotification';
import { resolveNextTriggerDate } from '../../hooks/webNotification';

const isWeb = Platform.OS === 'web';

const REPEAT_OPTIONS = [
  { label: 'Không lặp', value: 'none' },
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' },
] as const;

const NOTE_COLOR_MAP: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3',
  yellow: '#FEF7CD', green: '#E2F3E8', teal: '#D0F4EE',
  blue: '#D3E3FD', purple: '#E8DEFC', pink: '#FDCFE8', brown: '#F0E6DA',
};

// Chuyển Date → chuỗi "YYYY-MM-DDTHH:MM" cho input datetime-local trên Web
const toDatetimeLocal = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface Props {
  reminder: ReminderData;
  isDark: boolean;
  onUpdate: (
    id: string,
    data: Partial<ReminderData>,
    onSuccessNotification?: (updatedData: ReminderData) => Promise<void>
  ) => Promise<void>;
  onDelete: (
    id: string,
    onSuccessNotification?: () => Promise<void>
  ) => Promise<void>;
}

export const ReminderCard = ({ reminder, isDark, onUpdate, onDelete }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editDate, setEditDate] = useState(new Date(reminder.remind_at));
  const [webDatetimeValue, setWebDatetimeValue] = useState(
    toDatetimeLocal(new Date(reminder.remind_at))
  );
  const [editRepeat, setEditRepeat] = useState<ReminderData['repeat_type']>(reminder.repeat_type);
  const [saving, setSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState(''); // Lưu thông báo trạng thái/lỗi thân thiện cho user

  const { scheduleReminderNotification, cancelReminderNotification } = useLocalNotification();

  const c = {
    card:       isDark ? '#1f2937' : '#ffffff',
    border:     isDark ? '#374151' : '#e5e7eb',
    text:       isDark ? '#f9fafb' : '#111827',
    sub:        isDark ? '#9ca3af' : '#6b7280',
    chip:       isDark ? '#374151' : '#f3f4f6',
    chipActive: isDark ? '#1d4ed8' : '#3b82f6',
    expandBg:   isDark ? '#111827' : '#f9fafb',
    inputBg:    isDark ? '#1f2937' : '#ffffff',
  };

  const isPast = new Date(reminder.remind_at) < new Date();
  const noteBg = NOTE_COLOR_MAP[reminder.note_color ?? 'default'];
  const displayTitle = reminder.note_title || `Ghi chú #${reminder.note?.slice(0, 8) || ''}`;
  const repeatLabel = REPEAT_OPTIONS.find(r => r.value === reminder.repeat_type)?.label ?? '';

  const formatDate = (d: Date) =>
    d.toLocaleString('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  // Mobile only: Điều chỉnh thời gian qua nút nhấn
  const adjustDate = (field: 'day' | 'hour' | 'minute', delta: number) => {
    const d = new Date(editDate);
    if (field === 'day')    d.setDate(d.getDate() + delta);
    if (field === 'hour')   d.setHours(d.getHours() + delta);
    if (field === 'minute') d.setMinutes(d.getMinutes() + delta);
    setEditDate(d);
    setInfoMsg('');
  };

  // Web only: Xử lý thay đổi input datetime-local
  const handleWebDatetimeChange = (e: any) => {
    const val = e.target.value;
    setWebDatetimeValue(val);
    if (val) {
      setEditDate(new Date(val));
      setInfoMsg('');
    }
  };

  const handleSave = async () => {
    if (saving) return;
    setInfoMsg('');

    const rawDate = isWeb ? new Date(webDatetimeValue) : editDate;

    if (!rawDate || isNaN(rawDate.getTime())) {
      setInfoMsg('Thời gian không hợp lệ.');
      return;
    }

    // Tự động tính chu kỳ/ngày kế tiếp nếu mốc thời gian lựa chọn đã trôi qua
    const finalDate = resolveNextTriggerDate(rawDate, editRepeat);

    setSaving(true);
    try {
      // Thiết lập callback lên lịch thông báo đẩy sau khi API cập nhật DB thành công
      const handleNotificationSetup = async (updatedData: ReminderData) => {
        const titleFallback = `Nội dung ghi chú #${updatedData.note.slice(0, 8)}`;
        await scheduleReminderNotification(updatedData, titleFallback);
      };

      await onUpdate(reminder.id, {
        remind_at: finalDate.toISOString(),
        repeat_type: editRepeat,
      }, handleNotificationSetup);

      setExpanded(false);
      setInfoMsg('');
    } catch (err) {
      setInfoMsg('Không thể lưu lịch nhắc. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      try {
        // Thiết lập hủy lịch thông báo ở client-side sau khi xóa thành công ở backend
        const handleNotificationCancel = async () => {
          await cancelReminderNotification(reminder.id);
        };
        await onDelete(reminder.id, handleNotificationCancel);
      } catch {
        if (isWeb) {
          setInfoMsg('Không thể xóa nhắc nhở.');
        } else {
          Alert.alert('Lỗi', 'Không thể xóa nhắc nhở.');
        }
      }
    };

    if (isWeb) {
      if (typeof window !== 'undefined' && window.confirm(`Xóa nhắc nhở cho "${displayTitle}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert(
        'Xóa nhắc nhở',
        `Xóa nhắc nhở cho "${displayTitle}"?`,
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Xóa', style: 'destructive', onPress: doDelete },
        ]
      );
    }
  };

  const handleCancel = () => {
    setExpanded(false);
    setInfoMsg('');
    const original = new Date(reminder.remind_at);
    setEditDate(original);
    setWebDatetimeValue(toDatetimeLocal(original));
    setEditRepeat(reminder.repeat_type);
  };

  // Lắng nghe sự thay đổi thời gian để cập nhật dòng thông báo tự động (Preview UX)
  const targetDate = isWeb ? new Date(webDatetimeValue) : editDate;
  const computedNextDate = (!targetDate || isNaN(targetDate.getTime())) ? null : resolveNextTriggerDate(targetDate, editRepeat);
  const previewMsg = (computedNextDate && targetDate && computedNextDate.getTime() !== targetDate.getTime())
    ? (editRepeat === 'none'
        ? `Giờ đã qua → sẽ nhắc vào ngày mai: ${formatDate(computedNextDate)}`
        : `Giờ đã qua → lần nhắc tiếp: ${formatDate(computedNextDate)}`)
    : '';

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[
        styles.colorStrip,
        { backgroundColor: noteBg === '#FFFFFF' ? c.border : noteBg },
      ]} />

      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={styles.mainRow}
          onPress={() => { setExpanded(v => !v); setInfoMsg(''); }}
          activeOpacity={0.75}
        >
          <View style={[
            styles.iconWrap,
            { backgroundColor: isPast ? '#fef2f2' : '#eff6ff' },
          ]}>
            <MaterialCommunityIcons
              name={reminder.repeat_type !== 'none' ? 'bell-ring-outline' : 'bell-outline'}
              size={20}
              color={isPast ? '#ef4444' : '#3b82f6'}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={[styles.noteTitle, { color: c.text }]} numberOfLines={1}>
              {displayTitle}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="clock-outline" size={12}
                color={isPast ? '#ef4444' : c.sub}
              />
              <Text style={[
                styles.metaText,
                { color: isPast ? '#ef4444' : c.sub },
                isPast && { fontWeight: '600' },
              ]}>
                {isPast ? '⚠ Đã qua · ' : ''}{formatDate(new Date(reminder.remind_at))}
              </Text>
            </View>
            {reminder.repeat_type !== 'none' && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="repeat" size={12} color={c.sub} />
                <Text style={[styles.metaText, { color: c.sub }]}>Lặp {repeatLabel}</Text>
              </View>
            )}
          </View>

          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20} color={c.sub}
          />
        </TouchableOpacity>

        {expanded && (
          <View style={[styles.expandPanel, {
            backgroundColor: c.expandBg,
            borderTopColor: c.border,
          }]}>

            <Text style={[styles.editLabel, { color: c.sub }]}>Thời gian nhắc</Text>

            {isWeb ? (
              <input
                type="datetime-local"
                value={webDatetimeValue}
                onChange={handleWebDatetimeChange}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: `1px solid ${c.border}`,
                  backgroundColor: c.inputBg,
                  color: c.text,
                  fontSize: 14,
                  fontFamily: 'Inter-Regular',
                  marginBottom: 12,
                  outline: 'none',
                  boxSizing: 'border-box',
                } as any}
              />
            ) : (
              <>
                <View style={[styles.dateBox, { borderColor: c.border, backgroundColor: c.card }]}>
                  <Text style={[styles.dateText, { color: c.text }]}>
                    {formatDate(editDate)}
                  </Text>
                </View>
                <View style={styles.adjustRow}>
                  {(['day', 'hour', 'minute'] as const).map((field) => (
                    <View key={field} style={styles.adjustGroup}>
                      <Text style={[styles.adjustLabel, { color: c.sub }]}>
                        {field === 'day' ? 'Ngày' : field === 'hour' ? 'Giờ' : 'Phút'}
                      </Text>
                      <View style={styles.adjustBtns}>
                        <TouchableOpacity
                          onPress={() => adjustDate(field, field === 'minute' ? -15 : -1)}
                          style={[styles.adjBtn, { borderColor: c.border }]}
                        >
                          <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => adjustDate(field, field === 'minute' ? 15 : 1)}
                          style={[styles.adjBtn, { borderColor: c.border }]}
                        >
                          <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Hiển thị câu thông báo điều chỉnh thời gian thực (Real-time Preview) hoặc thông báo lỗi hệ thống */}
            {(!!previewMsg || !!infoMsg) && (
              <View style={[styles.infoBox, !!infoMsg && infoMsg.includes('Không thể') && styles.errorBox]}>
                <MaterialCommunityIcons 
                  name={!!infoMsg && infoMsg.includes('Không thể') ? "alert-circle-outline" : "information-outline"} 
                  size={14} 
                  color={!!infoMsg && infoMsg.includes('Không thể') ? "#ef4444" : "#3b82f6"} 
                />
                <Text style={[styles.infoText, !!infoMsg && infoMsg.includes('Không thể') && styles.errorText]}>
                  {infoMsg || previewMsg}
                </Text>
              </View>
            )}

            <Text style={[styles.editLabel, { color: c.sub, marginTop: 14 }]}>Lặp lại</Text>
            <View style={styles.chips}>
              {REPEAT_OPTIONS.map(opt => {
                const active = editRepeat === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => { setEditRepeat(opt.value); setInfoMsg(''); }}
                    style={[styles.chip, { backgroundColor: active ? c.chipActive : c.chip }]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : c.sub }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Xóa</Text>
              </TouchableOpacity>
              <View style={styles.saveCancelRow}>
                <TouchableOpacity
                  onPress={handleCancel}
                  style={[styles.cancelBtn, { borderColor: c.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: c.sub }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>
                    {saving ? 'Đang lưu...' : 'Lưu'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, overflow: 'hidden', marginBottom: 10 },
  colorStrip: { width: 4, flexShrink: 0 },
  mainRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  noteTitle: { fontFamily: 'Inter-Medium', fontSize: 15, marginBottom: 3 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  metaText: { fontFamily: 'Inter-Regular', fontSize: 12 },
  expandPanel: { padding: 14, borderTopWidth: 1 },
  editLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  dateBox: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, marginBottom: 10 },
  dateText: { fontFamily: 'Inter-Regular', fontSize: 14 },
  adjustRow: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  adjustGroup: { alignItems: 'center', gap: 6 },
  adjustLabel: { fontFamily: 'Inter-Regular', fontSize: 11 },
  adjustBtns: { flexDirection: 'row', gap: 6 },
  adjBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#eff6ff', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7, marginBottom: 8 },
  infoText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#1d4ed8', flex: 1, lineHeight: 18 },
  errorBox: { backgroundColor: '#fef2f2' },
  errorText: { color: '#ef4444' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  chipText: { fontFamily: 'Inter-Medium', fontSize: 13 },
  editActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  deleteBtnText: { color: '#ef4444', fontFamily: 'Inter-Medium', fontSize: 13 },
  saveCancelRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  cancelBtnText: { fontFamily: 'Inter-Medium', fontSize: 14 },
  saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#3b82f6' },
  saveBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
});