import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNoteStore } from '../../src/store/useNoteStore';
import { useThemeColors } from '../../src/hooks/useThemeColors';

const SettingsScreen = () => {
  const colors = useThemeColors();
  const [activeMenu, setActiveMenu] = useState<'appearance' | 'notifications'>('appearance');
  
  const { 
    theme, setTheme, 
    viewMode, setViewMode, 
    sortBy, setSortBy,
    notifications, toggleNotification 
  } = useNoteStore();

  const renderMenuItem = (id: string, icon: any, label: string, subLabel: string) => (
    <TouchableOpacity 
      style={[
        styles.menuItem, 
        activeMenu === id && { backgroundColor: theme === 'dark' ? '#2A2A2A' : '#FFFFFF', elevation: 2 }
      ]}
      onPress={() => setActiveMenu(id as any)}
    >
      <View style={[
        styles.iconBox, 
        { backgroundColor: colors.bgHover },
        activeMenu === id && { backgroundColor: colors.primary }
      ]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={20} 
          color={activeMenu === id ? '#FFFFFF' : colors.textSecondary} 
        />
      </View>
      <View style={styles.menuTextContent}>
        <Text style={[
            styles.menuLabel, 
            { color: colors.textPrimary },
            activeMenu === id && { color: colors.primary }
        ]}>{label}</Text>
        <Text style={[styles.menuSubLabel, { color: colors.textTertiary }]}>{subLabel}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurface }]}>
      <View style={[styles.sidebar, { borderRightColor: colors.borderDefault }]}>
        <Text style={[styles.sidebarTitle, { color: colors.textPrimary }]}>Cài đặt</Text>
        <Text style={[styles.sidebarSubTitle, { color: colors.textTertiary }]}>Tùy chỉnh trải nghiệm của bạn</Text>
        
        <View style={styles.menuList}>
          {renderMenuItem('appearance', 'palette-outline', 'Giao diện', 'Tùy chỉnh giao diện và chế độ')}
          {renderMenuItem('notifications', 'bell-outline', 'Thông báo', 'Quản lý thông báo')}
          {renderMenuItem('account', 'account-outline', 'Tài khoản', 'Thông tin cá nhân')}
          {renderMenuItem('sync', 'cloud-upload-outline', 'Dữ liệu & đồng bộ', 'Sao lưu dữ liệu')}
          {renderMenuItem('about', 'information-outline', 'Giới thiệu', 'Về Mindraft')}
        </View>
      </View>

      <ScrollView style={[styles.content, { backgroundColor: colors.bgSurface }]}>
        {activeMenu === 'appearance' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Giao diện</Text>
            <Text style={[styles.sectionSubTitle, { color: colors.textTertiary }]}>Tùy chỉnh Mindraft</Text>

            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Chế độ giao diện</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.bgPage }]}>
              {(['light', 'dark', 'system'] as const).map((t) => (
                <TouchableOpacity 
                  key={t}
                  style={[styles.segmentBtn, theme === t && { backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000' }]} 
                  onPress={() => setTheme(t)}
                >
                  <Text style={[
                    styles.segmentText, 
                    { color: colors.textPrimary },
                    theme === t && { color: theme === 'dark' ? '#000000' : '#FFFFFF' }
                  ]}>
                    {t === 'light' ? 'Sáng' : t === 'dark' ? 'Tối' : 'Hệ thống'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Chế độ xem mặc định</Text>
            <View style={[styles.segmentedControl, { backgroundColor: colors.bgPage }]}>
              <TouchableOpacity 
                style={[styles.segmentBtn, viewMode === 'grid' && { backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000' }]} 
                onPress={() => setViewMode('grid')}
              >
                <Text style={[styles.segmentText, { color: colors.textPrimary }, viewMode === 'grid' && { color: theme === 'dark' ? '#000000' : '#FFFFFF' }]}>Lưới</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.segmentBtn, viewMode === 'list' && { backgroundColor: theme === 'dark' ? '#FFFFFF' : '#000000' }]} 
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.segmentText, { color: colors.textPrimary }, viewMode === 'list' && { color: theme === 'dark' ? '#000000' : '#FFFFFF' }]}>Danh sách</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Sắp xếp theo</Text>
            <View style={styles.sortList}>
              {([
                { id: 'updated', label: 'Cập nhật lần cuối', sub: 'Ghi chú mới sửa hiện lên đầu', icon: 'clock-outline' },
                { id: 'created', label: 'Ngày tạo', sub: 'Ghi chú mới tạo hiện lên đầu', icon: 'calendar-check-outline' },
                { id: 'custom', label: 'Tùy chỉnh', sub: 'Kéo thả để sắp xếp thủ công', icon: 'menu' } // ĐÃ BỔ SUNG
              ] as const).map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[
                    styles.sortItem, 
                    { borderColor: colors.borderDefault },
                    sortBy === item.id && { borderColor: colors.primary, backgroundColor: theme === 'dark' ? '#1B2E25' : '#E8F5E9' }
                  ]}
                  onPress={() => setSortBy(item.id)}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={colors.textSecondary} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sortLabel, { color: colors.textPrimary }]}>{item.label}</Text>
                    <Text style={[styles.sortSub, { color: colors.textTertiary }]}>{item.sub}</Text>
                  </View>
                  {sortBy === item.id && <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {activeMenu === 'notifications' && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Thông báo</Text>
            <Text style={[styles.sectionSubTitle, { color: colors.textTertiary }]}>Tùy chỉnh Mindraft</Text>

            <Text style={[styles.itemLabel, { color: colors.textPrimary }]}>Thông báo ứng dụng</Text>
            
            <View style={[styles.switchRow, { borderBottomColor: colors.borderDefault }]}>
               <Text style={{ color: colors.textPrimary }}>Thông báo nhắc nhở</Text>
               <Switch 
                value={notifications.reminders} 
                onValueChange={() => toggleNotification('reminders')}
                trackColor={{ false: colors.borderDefault, true: colors.primary }}
               />
            </View>

            {/* ĐÃ BỔ SUNG THÔNG BÁO CỘNG TÁC */}
            <View style={[styles.switchRow, { borderBottomColor: colors.borderDefault }]}>
               <Text style={{ color: colors.textPrimary }}>Thông báo cộng tác</Text>
               <Switch 
                value={notifications.collaboration} 
                onValueChange={() => toggleNotification('collaboration')}
                trackColor={{ false: colors.borderDefault, true: colors.primary }}
               />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  sidebar: { width: 300, borderRightWidth: 1, padding: 24 },
  sidebarTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  sidebarSubTitle: { fontSize: 14, marginBottom: 32 },
  menuList: { gap: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuTextContent: { marginLeft: 12 },
  menuLabel: { fontSize: 16, fontWeight: '600' },
  menuSubLabel: { fontSize: 12 },
  content: { flex: 1, padding: 48 },
  section: { maxWidth: 800 },
  sectionTitle: { fontSize: 32, fontWeight: 'bold' },
  sectionSubTitle: { fontSize: 14, marginBottom: 32 },
  itemLabel: { fontSize: 16, fontWeight: 'bold', marginTop: 24, marginBottom: 12 },
  segmentedControl: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16 },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentText: { fontSize: 14, fontWeight: '500' },
  sortList: { gap: 12 },
  sortItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1 },
  sortLabel: { fontSize: 16, fontWeight: '600' },
  sortSub: { fontSize: 13 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 }
});

export default SettingsScreen;