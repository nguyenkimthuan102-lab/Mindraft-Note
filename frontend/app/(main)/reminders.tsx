// app/(main)/reminders.tsx
import {
  ScrollView, StyleSheet, View, Text,
  useWindowDimensions, TouchableOpacity, Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { colors } from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useReminderStore } from '../../src/store/useReminderStore';
import { ReminderCard } from '../../src/components/reminders/ReminderCard';

type FilterType = 'all' | 'upcoming' | 'past';

export default function RemindersScreen() {
  const { theme } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const { reminders, loading, loadReminders, updateReminderAction, deleteReminderAction } = useReminderStore();

  const [filter, setFilter] = useState<FilterType>('all');

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  const c = {
    text: isDark ? '#f9fafb' : '#111827',
    sub: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#374151' : '#e5e7eb',
    chipBg: isDark ? '#1f2937' : '#f3f4f6',
    chipActiveBg: isDark ? '#1d4ed8' : '#3b82f6',
    card: isDark ? '#1f2937' : '#ffffff',
  };

  useEffect(() => {
    setSyncing();
    loadReminders()
      .then(() => setDone())
      .catch(() => setError());
  }, []);

  // ── Phân loại ──────────────────────────────────────────────────────────────
  const now = new Date();
  const upcoming = reminders.filter(r => new Date(r.remind_at) >= now);
  const past = reminders.filter(r => new Date(r.remind_at) < now);

  const displayList = filter === 'upcoming' ? upcoming
    : filter === 'past' ? past
    : reminders;

  // Sort: upcoming trước, past sau; trong mỗi nhóm sort theo thời gian gần nhất
  const sorted = [...displayList].sort((a, b) => {
    const aDate = new Date(a.remind_at).getTime();
    const bDate = new Date(b.remind_at).getTime();
    const aFuture = aDate >= now.getTime();
    const bFuture = bDate >= now.getTime();
    if (aFuture && !bFuture) return -1;
    if (!aFuture && bFuture) return 1;
    return aFuture ? aDate - bDate : bDate - aDate;
  });

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isEmpty = sorted.length === 0;

  // ── Filter chip ────────────────────────────────────────────────────────────
  const FilterChip = ({ value, label, count }: { value: FilterType; label: string; count: number }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[
        styles.filterChip,
        { backgroundColor: filter === value ? c.chipActiveBg : c.chipBg },
      ]}
    >
      <Text style={[
        styles.filterChipText,
        { color: filter === value ? '#fff' : c.sub },
      ]}>
        {label}
      </Text>
      {count > 0 && (
        <View style={[
          styles.filterBadge,
          { backgroundColor: filter === value ? 'rgba(255,255,255,0.25)' : c.border },
        ]}>
          <Text style={[
            styles.filterBadgeText,
            { color: filter === value ? '#fff' : c.sub },
          ]}>
            {count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>

      {/* ── Header stats ────────────────────────────────────────────────────── */}
      <View style={[styles.statsBar, { borderBottomColor: c.border, backgroundColor: dynamicBg }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: c.text }]}>{reminders.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Tổng</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#3b82f6' }]}>{upcoming.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Sắp tới</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#ef4444' }]}>{past.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Đã qua</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          <FilterChip value="all" label="Tất cả" count={reminders.length} />
          <FilterChip value="upcoming" label="Sắp tới" count={upcoming.length} />
          <FilterChip value="past" label="Đã qua" count={past.length} />
        </View>
      </View>

      {/* ── Danh sách ───────────────────────────────────────────────────────── */}
      <ScrollView
        style={[styles.scroll, { backgroundColor: dynamicBg }]}
        contentContainerStyle={[
          styles.container,
          { flexGrow: 1 },
          isMobile && {
            paddingHorizontal: 8,
            paddingVertical: 12,
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          // ── Empty state ────────────────────────────────────────────────────
          <View style={styles.emptyWrapper}>
            <View style={[styles.emptyIconContainer, isDark && { backgroundColor: '#1F2937' }]}>
              <Icon
                source="bell-outline"
                size={80}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
              {filter === 'past'
                ? 'Không có nhắc nhở nào đã qua'
                : filter === 'upcoming'
                ? 'Không có nhắc nhở nào sắp tới'
                : 'Chưa có nhắc nhở nào'}
            </Text>
            <Text style={[styles.emptyHint, { color: isDark ? '#4B5563' : '#C4C4C4' }]}>
              Mở một ghi chú và nhấn nút 🔔 để thêm nhắc nhở
            </Text>
          </View>
        ) : (
          // ── List ──────────────────────────────────────────────────────────
          <View style={[
            styles.inner,
            { maxWidth: 720, alignSelf: 'center' },
          ]}>
            {/* Nhóm Sắp tới */}
            {(filter === 'all' || filter === 'upcoming') && upcoming.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={15} color="#3b82f6" />
                  <Text style={[styles.sectionTitle, { color: '#3b82f6' }]}>
                    Sắp tới · {upcoming.length}
                  </Text>
                </View>
                {[...upcoming]
                  .sort((a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime())
                  .map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      isDark={isDark}
                      onUpdate={updateReminderAction}
                      onDelete={deleteReminderAction}
                    />
                  ))}
              </View>
            )}

            {/* Nhóm Đã qua */}
            {(filter === 'all' || filter === 'past') && past.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={15} color="#ef4444" />
                  <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                    Đã qua · {past.length}
                  </Text>
                </View>
                {[...past]
                  .sort((a, b) => new Date(b.remind_at).getTime() - new Date(a.remind_at).getTime())
                  .map(reminder => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      isDark={isDark}
                      onUpdate={updateReminderAction}
                      onDelete={deleteReminderAction}
                    />
                  ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  statsBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 22,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 8,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
  },
  filterChipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  scroll: { flex: 1 },
  container: {
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  inner: { width: '100%' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingLeft: 2,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
    gap: 14,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    textAlign: 'center',
    maxWidth: 300,
  },
  emptyHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
});