import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ReminderData } from 'src/api/reminderApi';

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

interface Props {
  reminder: ReminderData;
  isDark: boolean;
  onUpdate: (id: string, data: Partial<ReminderData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ReminderCard = ({ reminder, isDark, onUpdate, onDelete }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const [editDate, setEditDate] = useState(new Date(reminder.remind_at));
  const [editRepeat, setEditRepeat] = useState<ReminderData['repeat_type']>(reminder.repeat_type);
  const [saving, setSaving] = useState(false);

  const c = {
    card:      isDark ? '#1f2937' : '#ffffff',
    border:    isDark ? '#374151' : '#e5e7eb',
    text:      isDark ? '#f9fafb' : '#111827',
    sub:       isDark ? '#9ca3af' : '#6b7280',
    chip:      isDark ? '#374151' : '#f3f4f6',
    chipActive:isDark ? '#1d4ed8' : '#3b82f6',
    expandBg:  isDark ? '#111827' : '#f9fafb',
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

  const adjustDate = (field: 'day' | 'hour' | 'minute', delta: number) => {
    const d = new Date(editDate);
    if (field === 'day')    d.setDate(d.getDate() + delta);
    if (field === 'hour')   d.setHours(d.getHours() + delta);
    if (field === 'minute') d.setMinutes(d.getMinutes() + delta);
    setEditDate(d);
  };

  // 🔥 ĐIỂM KÍCH HOẠT: Đã tối ưu hóa kiểm tra lỗi
  const handleSave = async () => {
    if (saving) return;

    // Chặn chống đặt lịch báo thức trong quá khứ
    if (editDate < new Date()) {
      Alert.alert('Thời gian không hợp lệ', 'Không thể đặt lịch nhắc nhở vào thời gian đã qua.');
      return;
    }

    setSaving(true);
    try {
      // 🚀 Store (useReminderStore) nhận data này sẽ tự chạy ngầm luồng xin quyền + đặt lịch expo-notifications
      await onUpdate(reminder.id, {
        remind_at: editDate.toISOString(),
        repeat_type: editRepeat,
      });
      setExpanded(false);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể lưu lịch nhắc. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Xóa nhắc nhở cho "${displayTitle}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try { 
              // 🚀 Store nhận lệnh xóa sẽ tự hủy lịch thông báo trên máy người dùng
              await onDelete(reminder.id); 
            } catch { 
              Alert.alert('Lỗi', 'Không thể xóa.'); 
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Dải màu note bên trái */}
      <View style={[
        styles.colorStrip,
        { backgroundColor: noteBg === '#FFFFFF' ? c.border : noteBg },
      ]} />

      <View style={{ flex: 1 }}>
        {/* ── Row chính ── */}
        <TouchableOpacity
          style={styles.mainRow}
          onPress={() => setExpanded(v => !v)}
          activeOpacity={0.75}
        >
          {/* Icon bell */}
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

          {/* Nội dung */}
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

        {/* ── Panel chỉnh sửa ── */}
        {expanded && (
          <View style={[styles.expandPanel, {
            backgroundColor: c.expandBg,
            borderTopColor: c.border,
          }]}>

            {/* Chỉnh ngày giờ bằng nút +/- */}
            <Text style={[styles.editLabel, { color: c.sub }]}>Thời gian nhắc</Text>
            <View style={[styles.dateBox, { borderColor: c.border, backgroundColor: c.card }]}>
              <Text style={[styles.dateText, { color: c.text }]}>
                {formatDate(editDate)}
              </Text>
            </View>
            <View style={styles.adjustRow}>
              {/* Ngày */}
              <View style={styles.adjustGroup}>
                <Text style={[styles.adjustLabel, { color: c.sub }]}>Ngày</Text>
                <View style={styles.adjustBtns}>
                  <TouchableOpacity
                    onPress={() => adjustDate('day', -1)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => adjustDate('day', 1)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Giờ */}
              <View style={styles.adjustGroup}>
                <Text style={[styles.adjustLabel, { color: c.sub }]}>Giờ</Text>
                <View style={styles.adjustBtns}>
                  <TouchableOpacity
                    onPress={() => adjustDate('hour', -1)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => adjustDate('hour', 1)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                  </TouchableOpacity>
                </View>
              </View>
              {/* Phút */}
              <View style={styles.adjustGroup}>
                <Text style={[styles.adjustLabel, { color: c.sub }]}>Phút</Text>
                <View style={styles.adjustBtns}>
                  <TouchableOpacity
                    onPress={() => adjustDate('minute', -15)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="minus" size={16} color={c.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => adjustDate('minute', 15)}
                    style={[styles.adjBtn, { borderColor: c.border }]}
                  >
                    <MaterialCommunityIcons name="plus" size={16} color={c.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Repeat chips */}
            <Text style={[styles.editLabel, { color: c.sub, marginTop: 14 }]}>Lặp lại</Text>
            <View style={styles.chips}>
              {REPEAT_OPTIONS.map(opt => {
                const active = editRepeat === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setEditRepeat(opt.value)}
                    style={[styles.chip, {
                      backgroundColor: active ? c.chipActive : c.chip,
                    }]}
                  >
                    <Text style={[styles.chipText, {
                      color: active ? '#fff' : c.sub,
                    }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Nút hành động */}
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Xóa</Text>
              </TouchableOpacity>
              <View style={styles.saveCancelRow}>
                <TouchableOpacity
                  onPress={() => {
                    setExpanded(false);
                    setEditDate(new Date(reminder.remind_at));
                    setEditRepeat(reminder.repeat_type);
                  }}
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
  card: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  colorStrip: { width: 4, flexShrink: 0 },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38, height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  metaText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  expandPanel: {
    padding: 14,
    borderTopWidth: 1,
  },
  editLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  dateBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  adjustRow: {
    flexDirection: 'row',
    gap: 16,
  },
  adjustGroup: { alignItems: 'center', gap: 6 },
  adjustLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
  adjustBtns: { flexDirection: 'row', gap: 6 },
  adjBtn: {
    width: 32, height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  chipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  saveCancelRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
  },
  saveBtnText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});