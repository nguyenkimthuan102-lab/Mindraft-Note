import {
  ScrollView, StyleSheet, View, Text, useWindowDimensions,
} from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useReminderStore } from '@/src/store/useReminderStore';
import { ReminderCard } from '@/src/components/notes/ReminderCard';

type FilterType = 'all' | 'upcoming' | 'past';

export default function RemindersScreen() {
  const { theme } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const { reminders, loadReminders, updateReminderAction, deleteReminderAction } = useReminderStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : '#f9fafb';

  const c = {
    text:          isDark ? '#f9fafb' : '#111827',
    sub:           isDark ? '#9ca3af' : '#6b7280',
    border:        isDark ? '#374151' : '#e5e7eb',
    chipBg:        isDark ? '#1f2937' : '#f3f4f6',
    chipActiveBg:  '#3b82f6',
  };

  useEffect(() => {
    setSyncing();
    loadReminders()
      .then(() => setDone())
      .catch(() => setError());
  }, []);

  const now = new Date();
  const upcoming = reminders.filter(r => new Date(r.remind_at) >= now);
  const past     = reminders.filter(r => new Date(r.remind_at) < now);

  const upcomingSorted = [...upcoming].sort(
    (a, b) => new Date(a.remind_at).getTime() - new Date(b.remind_at).getTime()
  );
  const pastSorted = [...past].sort(
    (a, b) => new Date(b.remind_at).getTime() - new Date(a.remind_at).getTime()
  );

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isEmpty = reminders.length === 0;

  const FilterChip = ({
    value, label, count,
  }: { value: FilterType; label: string; count: number }) => (
    <TouchableOpacity
      onPress={() => setFilter(value)}
      style={[
        styles.filterChip,
        { backgroundColor: filter === value ? c.chipActiveBg : c.chipBg },
      ]}
    >
      <Text style={[styles.filterChipText, { color: filter === value ? '#fff' : c.sub }]}>
        {label}
      </Text>
      <View style={[
        styles.filterBadge,
        { backgroundColor: filter === value ? 'rgba(255,255,255,0.25)' : c.border },
      ]}>
        <Text style={[styles.filterBadgeText, { color: filter === value ? '#fff' : c.sub }]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>

      {/* Stats + Filter */}
      <View style={[styles.statsBar, { borderBottomColor: c.border }]}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: c.text }]}>{reminders.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Tổng</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#3b82f6' }]}>{upcoming.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Sắp tới</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNum, { color: '#ef4444' }]}>{past.length}</Text>
            <Text style={[styles.statLabel, { color: c.sub }]}>Đã qua</Text>
          </View>
        </View>

        <View style={styles.filterRow}>
          <FilterChip value="all"      label="Tất cả"  count={reminders.length} />
          <FilterChip value="upcoming" label="Sắp tới" count={upcoming.length} />
          <FilterChip value="past"     label="Đã qua"  count={past.length} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { flexGrow: 1 },
          isMobile && { paddingHorizontal: 8, paddingBottom: 40 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyWrapper}>
            <View style={[styles.emptyIcon, isDark && { backgroundColor: '#1F2937' }]}>
              <Icon source="bell-outline" size={80} color={isDark ? '#4B5563' : '#D1D5DB'} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
              Chưa có nhắc nhở nào
            </Text>
            <Text style={[styles.emptyHint, { color: isDark ? '#4B5563' : '#C4C4C4' }]}>
              Mở một ghi chú → nhấn nút 🔔 để thêm nhắc nhở
            </Text>
          </View>
        ) : (
          <View style={[styles.inner, { maxWidth: 720, alignSelf: 'center' }]}>

            {/* Nhóm Sắp tới */}
            {(filter === 'all' || filter === 'upcoming') && upcomingSorted.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#3b82f6" />
                  <Text style={[styles.sectionTitle, { color: '#3b82f6' }]}>
                    SẮP TỚI · {upcomingSorted.length}
                  </Text>
                </View>
                {upcomingSorted.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
                    isDark={isDark}
                    onUpdate={updateReminderAction}
                    onDelete={deleteReminderAction}
                  />
                ))}
              </View>
            )}

            {/* Nhóm Đã qua */}
            {(filter === 'all' || filter === 'past') && pastSorted.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="clock-alert-outline" size={14} color="#ef4444" />
                  <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>
                    ĐÃ QUA · {pastSorted.length}
                  </Text>
                </View>
                {pastSorted.map(r => (
                  <ReminderCard
                    key={r.id}
                    reminder={r}
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
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum:  { fontFamily: 'Inter-Bold', fontSize: 22 },
  statLabel:{ fontFamily: 'Inter-Regular', fontSize: 12 },
  statDivider: { width: 1, height: 32, marginHorizontal: 8 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
  },
  filterChipText: { fontFamily: 'Inter-Medium', fontSize: 13 },
  filterBadge: {
    minWidth: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  filterBadgeText: { fontFamily: 'Inter-SemiBold', fontSize: 11 },
  container: { paddingVertical: 20, paddingHorizontal: 24 },
  inner: { width: '100%' },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 6, marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold', fontSize: 11,
    letterSpacing: 0.8,
  },
  emptyWrapper: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    minHeight: 400, gap: 14,
  },
  emptyIcon: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontFamily: 'Inter-Medium', fontSize: 18, textAlign: 'center' },
  emptyHint: {
    fontFamily: 'Inter-Regular', fontSize: 14,
    textAlign: 'center', maxWidth: 280, lineHeight: 20,
  },
});