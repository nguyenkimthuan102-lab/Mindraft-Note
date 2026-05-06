import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// --- Bảng màu chuẩn Mindraft ---
const COLORS = {
  green: '#00A84D',
  greenLight: '#E8F5E9',
  black: '#000000',
  white: '#ffffff',
  grayBg: '#F9FAFB',
  grayBorder: '#EEEEEE',
  grayText: '#666666',
  grayTitle: '#111111',
  orange: '#FFB020',
  blue: '#3366FF',
};

// ✅ Data arrays định nghĩa NGOÀI JSX để tránh lỗi "Text string must be rendered within <Text>"
const EXTRA_CATEGORIES: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Tài khoản', icon: 'person-outline' },
  { label: 'Dữ liệu & đồng bộ', icon: 'cloud-upload-outline' },
  { label: 'Giới thiệu', icon: 'information-circle-outline' },
];

const THEME_OPTIONS: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Sáng', icon: 'sunny-outline' },
  { id: 'Tối', icon: 'moon-outline' },
  { id: 'Hệ thống', icon: 'desktop-outline' },
];

const VIEW_MODE_OPTIONS: { id: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'Lưới', icon: 'grid-outline' },
  { id: 'Danh sách', icon: 'list-outline' },
];

type SortKey = 'updated_at' | 'created_at' | 'custom';
const SORT_OPTIONS: { id: SortKey; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }[] = [
  { id: 'updated_at', label: 'Cập nhật lần cuối', icon: 'time-outline',       desc: 'Ghi chú mới sửa hiện lên đầu' },
  { id: 'created_at', label: 'Ngày tạo',          icon: 'calendar-outline',   desc: 'Ghi chú mới tạo hiện lên đầu' },
  { id: 'custom',     label: 'Tùy chỉnh',          icon: 'reorder-four-outline', desc: 'Kéo thả để sắp xếp thủ công' },
];

// --- Sub-components ---
const SidebarItem = ({ icon, label, color = COLORS.grayText, active = false }: any) => (
  <TouchableOpacity style={[styles.sideItem, active && styles.sideItemActive]}>
    <Ionicons name={icon} size={20} color={active ? COLORS.green : color} />
    <Text style={[styles.sideLabel, active && styles.sideLabelActive]}>{label}</Text>
  </TouchableOpacity>
);

const CustomSwitch = ({ value, onToggle }: { value: boolean; onToggle: () => void }) => (
  <TouchableOpacity
    onPress={onToggle}
    style={[styles.switchTrack, value ? { backgroundColor: COLORS.green } : { backgroundColor: '#CCC' }]}
  >
    <View style={[styles.switchThumb, value ? { alignSelf: 'flex-end' } : { alignSelf: 'flex-start' }]} />
  </TouchableOpacity>
);

export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'Giao diện' | 'Thông báo'>('Giao diện');
  const [theme, setTheme] = useState('Tối');
  const [viewMode, setViewMode] = useState('Lưới');
  const [sortBy, setSortBy] = useState<SortKey>('updated_at');
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifCollab, setNotifCollab] = useState(false);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.layout}>

          {/* CỘT 1: SIDEBAR TRÁI */}
          <View style={styles.sidebarLeft}>
            <View style={styles.logoRow}>
              <View style={styles.logoBox}>
                <Text style={styles.logoM}>M</Text>
              </View>
              <Text style={styles.logoText}>Mindraft</Text>
            </View>
            <TouchableOpacity style={styles.newNoteBtn}>
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.newNoteText}>New note</Text>
            </TouchableOpacity>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 20 }}>
              <SidebarItem icon="document-text-outline" label="All notes" />
              <SidebarItem icon="notifications-outline" label="Reminders" />
              <Text style={styles.sidebarSectionTitle}>LABELS</Text>
              <SidebarItem icon="ellipse" label="Personal" color={COLORS.orange} />
              <SidebarItem icon="ellipse" label="Work" color={COLORS.blue} />
              <SidebarItem icon="ellipse" label="Ideas" color={COLORS.green} />
              <View style={{ marginTop: 20 }}>
                <SidebarItem icon="archive-outline" label="Archive" />
                <SidebarItem icon="trash-outline" label="Trash" />
              </View>
            </ScrollView>
            <View style={{ flex: 1 }} />
            <SidebarItem icon="settings-outline" label="Settings" active />
          </View>

          {/* CỘT 2: DANH MỤC CÀI ĐẶT */}
          <View style={styles.sidebarMiddle}>
            <Text style={styles.paneTitle}>Cài đặt</Text>
            <Text style={styles.paneSub}>Tùy chỉnh trải nghiệm của bạn</Text>
            <View style={{ marginTop: 20 }}>

              {/* Tab Giao diện */}
              <TouchableOpacity
                style={[styles.catCard, activeTab === 'Giao diện' && styles.catCardActive]}
                onPress={() => setActiveTab('Giao diện')}
              >
                <View style={[styles.iconCircle, activeTab === 'Giao diện' && { backgroundColor: COLORS.green }]}>
                  <Ionicons
                    name="color-palette-outline"
                    size={20}
                    color={activeTab === 'Giao diện' ? COLORS.white : COLORS.grayText}
                  />
                </View>
                <View>
                  <Text style={[styles.catTitle, activeTab === 'Giao diện' && { color: COLORS.green }]}>
                    Giao diện
                  </Text>
                  <Text style={styles.catSubText}>Tùy chỉnh giao diện và chế độ</Text>
                </View>
              </TouchableOpacity>

              {/* Tab Thông báo */}
              <TouchableOpacity
                style={[styles.catCard, activeTab === 'Thông báo' && styles.catCardActive]}
                onPress={() => setActiveTab('Thông báo')}
              >
                <View style={[styles.iconCircle, activeTab === 'Thông báo' && { backgroundColor: COLORS.green }]}>
                  <Ionicons
                    name="notifications-outline"
                    size={20}
                    color={activeTab === 'Thông báo' ? COLORS.white : COLORS.grayText}
                  />
                </View>
                <View>
                  <Text style={[styles.catTitle, activeTab === 'Thông báo' && { color: COLORS.green }]}>
                    Thông báo
                  </Text>
                  <Text style={styles.catSubText}>Quản lý thông báo</Text>
                </View>
              </TouchableOpacity>

              {/* ✅ Dùng EXTRA_CATEGORIES thay vì array literal trong JSX */}
              {EXTRA_CATEGORIES.map((cat) => (
                <View key={cat.label} style={[styles.catCard, { opacity: 0.6 }]}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={cat.icon} size={20} color={COLORS.grayText} />
                  </View>
                  <Text style={styles.catTitle}>{cat.label}</Text>
                </View>
              ))}

            </View>
          </View>

          {/* CỘT 3: NỘI DUNG CHI TIẾT */}
          <View style={styles.contentRight}>
            <Text style={styles.paneTitle}>{activeTab}</Text>
            <Text style={styles.paneSub}>Tùy chỉnh Mindraft</Text>

            {activeTab === 'Giao diện' ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ marginTop: 30 }}>

                <Text style={styles.sectionHeading}>Chế độ giao diện</Text>
                <View style={styles.segmentRow}>
                  {/* ✅ Dùng THEME_OPTIONS thay vì array literal trong JSX */}
                  {THEME_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setTheme(item.id)}
                      style={[styles.segBtn, theme === item.id && styles.segBtnActive]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={theme === item.id ? COLORS.white : COLORS.black}
                      />
                      <Text style={[styles.segLabel, theme === item.id && { color: COLORS.white }]}>
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionHeading, { marginTop: 30 }]}>Chế độ xem mặc định</Text>
                <View style={styles.segmentRow}>
                  {/* ✅ Dùng VIEW_MODE_OPTIONS thay vì array literal trong JSX */}
                  {VIEW_MODE_OPTIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setViewMode(item.id)}
                      style={[styles.segBtn, viewMode === item.id && styles.segBtnActive]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={18}
                        color={viewMode === item.id ? COLORS.white : COLORS.black}
                      />
                      <Text style={[styles.segLabel, viewMode === item.id && { color: COLORS.white }]}>
                        {item.id}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sectionHeading, { marginTop: 30 }]}>Sắp xếp theo</Text>
                <View style={styles.sortGroup}>
                  {SORT_OPTIONS.map((opt) => {
                    const active = sortBy === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        onPress={() => setSortBy(opt.id)}
                        style={[styles.sortCard, active && styles.sortCardActive]}
                      >
                        <View style={[styles.sortIconBox, active && { backgroundColor: COLORS.green }]}>
                          <Ionicons name={opt.icon} size={18} color={active ? COLORS.white : COLORS.grayText} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.sortLabel, active && { color: COLORS.green }]}>
                            {opt.label}
                          </Text>
                          <Text style={styles.sortDesc}>{opt.desc}</Text>
                        </View>
                        {active && (
                          <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>

              </ScrollView>
            ) : (
              <View style={{ marginTop: 30 }}>
                <Text style={styles.sectionHeading}>Thông báo ứng dụng</Text>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Thông báo nhắc nhở</Text>
                  <CustomSwitch value={notifReminder} onToggle={() => setNotifReminder(!notifReminder)} />
                </View>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Thông báo cộng tác</Text>
                  <CustomSwitch value={notifCollab} onToggle={() => setNotifCollab(!notifCollab)} />
                </View>
              </View>
            )}

          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  layout: { flex: 1, flexDirection: 'row' },
  sidebarLeft: { width: 230, borderRightWidth: 1, borderColor: COLORS.grayBorder, padding: 16 },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logoBox: { width: 26, height: 26, backgroundColor: COLORS.green, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  logoM: { color: COLORS.white, fontWeight: 'bold' },
  logoText: { fontSize: 18, fontWeight: '800' },
  newNoteBtn: { backgroundColor: COLORS.green, padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  newNoteText: { color: COLORS.white, fontWeight: '700', marginLeft: 8 },
  sideItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 2 },
  sideItemActive: { backgroundColor: COLORS.greenLight },
  sideLabel: { marginLeft: 12, color: COLORS.grayText, fontSize: 14, fontWeight: '500' },
  sideLabelActive: { color: COLORS.green, fontWeight: '700' },
  sidebarSectionTitle: { fontSize: 10, fontWeight: '800', color: COLORS.grayText, marginTop: 24, marginBottom: 8, marginLeft: 10 },
  sidebarMiddle: { width: 300, backgroundColor: COLORS.grayBg, borderRightWidth: 1, borderColor: COLORS.grayBorder, padding: 24 },
  paneTitle: { fontSize: 26, fontWeight: '800' },
  paneSub: { fontSize: 13, color: COLORS.grayText, marginTop: 4 },
  catCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, padding: 16, borderRadius: 12, marginBottom: 12 },
  catCardActive: { backgroundColor: '#F1FBF3', borderWidth: 1, borderColor: '#00A84D33' },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  catTitle: { fontSize: 15, fontWeight: '700' },
  catSubText: { fontSize: 11, color: COLORS.grayText, marginTop: 2 },
  contentRight: { flex: 1, padding: 32 },
  sectionHeading: { fontSize: 17, fontWeight: '700', marginBottom: 15 },
  segmentRow: { flexDirection: 'row' },
  segBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: COLORS.grayBorder, marginRight: 12 },
  segBtnActive: { backgroundColor: COLORS.black, borderColor: COLORS.black },
  segLabel: { fontWeight: '600', fontSize: 14, marginLeft: 10 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.grayBorder },
  switchLabel: { fontSize: 15, fontWeight: '500' },
  switchTrack: { width: 42, height: 22, borderRadius: 11, padding: 2 },
  switchThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.white },
  sortGroup: { gap: 10 },
  sortCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.grayBorder, backgroundColor: COLORS.white },
  sortCardActive: { borderColor: '#00A84D66', backgroundColor: '#F1FBF3' },
  sortIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  sortLabel: { fontSize: 14, fontWeight: '700', color: COLORS.grayTitle },
  sortDesc: { fontSize: 11, color: COLORS.grayText, marginTop: 2 },
});
