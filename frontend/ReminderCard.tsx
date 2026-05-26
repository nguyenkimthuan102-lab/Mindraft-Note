// src/components/reminders/ReminderCard.tsx
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '../../constants/colors';
import { ReminderData } from '../../api/reminderApi';

const REPEAT_OPTIONS = [
  { label: 'Không', value: 'none' },
  { label: 'Hàng ngày', value: 'daily' },
  { label: 'Hàng tuần', value: 'weekly' },
  { label: 'Hàng tháng', value: 'monthly' },
] as const;

const REPEAT_ICONS: Record<string, string> = {
  none: 'bell-outline',
  daily: 'bell-ring-outline',
  weekly: 'bell-ring-outline',
  monthly: 'bell-ring-outline',
};

const NOTE_COLOR_MAP: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
  green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
  pink: '#FDCFE8', brown: '#F0E6DA',
};

interface ReminderCardProps {
  reminder: ReminderData;
  isDark: boolean;
  onUpdate: (id: string, data: Partial<ReminderData>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ReminderCard = ({ reminder, isDark, onUpdate, onDelete }: ReminderCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editDate, setEditDate] = useState(new Date(reminder.remind_at));
  const [editRepeat, setEditRepeat] = useState(reminder.repeat_type);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const c = {
    card: isDark ? '#1f2937' : '#ffffff',
    border: isDark ? '#374151' : '#e5e7eb',
    text: isDark ? '#f9fafb' : '#111827',
    sub: isDark ? '#9ca3af' : '#6b7280',
    chip: isDark ? '#374151' : '#f3f4f6',
    chipActive: isDark ? '#1d4ed8' : '#3b82f6',
    expandBg: isDark ? '#111827' : '#f9fafb',
  };

  const noteBg = NOTE_COLOR_MAP[reminder.note_color ?? 'default'];
  const isPast = new Date(reminder.remind_at) < new Date();

  const formatDate = (d: Date) =>
    d.toLocaleString('vi-VN', {
      weekday: 'short', day: '2-digit', month: '2-digit',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const repeatLabel = REPEAT_OPTIONS.find(r => r.value === reminder.repeat_type)?.label ?? 'Không';

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(reminder.id, {
        remind_at: editDate.toISOString(),
        repeat_type: editRepeat,
      });
      setExpanded(false);
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu nhắc nhở. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa nhắc nhở',
      `Bạn muốn xóa nhắc nhở cho "${reminder.note_title ?? 'ghi chú này'}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(reminder.id);
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa nhắc nhở.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>

      {/* ── Dải màu note ── */}
      <View style={[styles.colorStrip, { backgroundColor: noteBg === '#FFFFFF' ? c.border : noteBg }]} />

      <View style={styles.cardBody}>

        {/* ── Row chính ── */}
        <TouchableOpacity
          style={styles.mainRow}
          onPress={() => setExpanded(v => !v)}
          activeOpacity={0.75}
        >
          {/* Icon */}
          <View style={[
            styles.iconWrap,
            { backgroundColor: isPast ? '#fef2f2' : '#eff6ff' },
          ]}>
            <MaterialCommunityIcons
              name={REPEAT_ICONS[reminder.repeat_type] as any}
              size={20}
              color={isPast ? '#ef4444' : '#3b82f6'}
            />
          </View>

          {/* Nội dung */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.noteTitle, { color: c.text }]} numberOfLines={1}>
              {reminder.note_title || 'Ghi chú không có tiêu đề'}
            </Text>
            <View style={styles.metaRow}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={13}
                color={isPast ? '#ef4444' : c.sub}
              />
              <Text style={[
                styles.metaText,
                { color: isPast ? '#ef4444' : c.sub },
                isPast && { fontWeight: '600' },
              ]}>
                {isPast ? 'Đã qua · ' : ''}{formatDate(new Date(reminder.remind_at))}
              </Text>
            </View>
            {reminder.repeat_type !== 'none' && (
              <View style={styles.metaRow}>
                <MaterialCommunityIcons name="repeat" size={13} color={c.sub} />
                <Text style={[styles.metaText, { color: c.sub }]}>Lặp {repeatLabel}</Text>
              </View>
            )}
          </View>

          {/* Chevron */}
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={c.sub}
          />
        </TouchableOpacity>

        {/* ── Panel chỉnh sửa (khi mở rộng) ── */}
        {expanded && (
          <View style={[styles.expandPanel, { backgroundColor: c.expandBg, borderTopColor: c.border }]}>

            {/* DateTimePicker */}
            <Text style={[styles.editLabel, { color: c.sub }]}>Thời gian nhắc</Text>
            {Platform.OS === 'web' ? (
              <TouchableOpacity
                style={[styles.dateBtn, { borderColor: c.border, backgroundColor: c.card }]}
                onPress={() => setShowDatePicker(v => !v)}
              >
                <MaterialCommunityIcons name="calendar-clock" size={16} color="#3b82f6" />
                <Text style={[styles.dateBtnText, { color: c.text }]}>{formatDate(editDate)}</Text>
              </TouchableOpacity>
            ) : (
              <DateTimePicker
                value={editDate}
                mode="datetime"
                display="default"
                minimumDate={new Date()}
                onChange={(_, d) => d && setEditDate(d)}
                style={{ alignSelf: 'flex-start' }}
              />
            )}

            {/* Repeat chips */}
            <Text style={[styles.editLabel, { color: c.sub, marginTop: 12 }]}>Lặp lại</Text>
            <View style={styles.chips}>
              {REPEAT_OPTIONS.map(opt => {
                const active = editRepeat === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setEditRepeat(opt.value)}
                    style={[
                      styles.chip,
                      { backgroundColor: active ? c.chipActive : c.chip },
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      { color: active ? '#fff' : c.sub },
                    ]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.editActions}>
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                <Text style={styles.deleteBtnText}>Xóa nhắc nhở</Text>
              </TouchableOpacity>
              <View style={styles.editBtns}>
                <TouchableOpacity
                  onPress={() => { setExpanded(false); setEditDate(new Date(reminder.remind_at)); setEditRepeat(reminder.repeat_type); }}
                  style={[styles.cancelBtn, { borderColor: c.border }]}
                >
                  <Text style={[styles.cancelBtnText, { color: c.sub }]}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
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
  colorStrip: {
    width: 4,
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
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
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dateBtnText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
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
    gap: 5,
  },
  deleteBtnText: {
    color: '#ef4444',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  editBtns: {
    flexDirection: 'row',
    gap: 8,
  },
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