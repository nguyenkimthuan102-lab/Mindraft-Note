import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNoteStore } from '../../src/store/useNoteStore';

export default function SettingsScreen() {
  const { viewMode, setViewMode } = useNoteStore();
  
  // 1. Quản lý chuyển Tab (Giao diện / Thông báo)
  const [activeTab, setActiveTab] = useState<'interface' | 'notif' | 'account' | 'sync' | 'about'>('interface');

  // 2. State cho phần Giao diện (Sáng/Tối/Sắp xếp)
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('light');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'custom'>('created');

  // 3. State cho phần Thông báo (Bật/Tắt Switch)
  const [notifReminder, setNotifReminder] = useState(true);
  const [notifCollab, setNotifCollab] = useState(true);

  // Danh sách menu bên trái
  const menuItems = [
    { id: 'interface', title: 'Giao diện', sub: 'Tùy chỉnh giao diện và chế độ', icon: 'color-palette-outline' },
    { id: 'notif', title: 'Thông báo', sub: 'Quản lý thông báo', icon: 'notifications-outline' },
    { id: 'account', title: 'Tài khoản', sub: 'Quản lý thông tin cá nhân', icon: 'person-outline' },
    { id: 'sync', title: 'Dữ liệu & đồng bộ', sub: 'Quản lý bộ nhớ và đồng bộ', icon: 'cloud-upload-outline' },
    { id: 'about', title: 'Giới thiệu', sub: 'Về Mindraft', icon: 'information-circle-outline' },
  ];

  // --- HÀM RENDER NỘI DUNG CHI TIẾT ---
  const renderDetailContent = () => {
    if (activeTab === 'interface') {
      return (
        <>
          <Text style={styles.detailTitle}>Giao diện</Text>
          <Text style={styles.detailSub}>Tùy chỉnh Mindraft</Text>

          {/* Chế độ giao diện */}
          <Text style={styles.sectionHeading}>Chế độ giao diện</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity onPress={() => setThemeMode('light')} style={[styles.segmentBtn, themeMode === 'light' && styles.segmentBtnActive]}>
              <Ionicons name="sunny-outline" size={18} color={themeMode === 'light' ? '#fff' : '#333'} />
              <Text style={themeMode === 'light' ? styles.segmentTextActive : styles.segmentText}>Sáng</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setThemeMode('dark')} style={[styles.segmentBtn, themeMode === 'dark' && styles.segmentBtnActive]}>
              <Ionicons name="moon-outline" size={18} color={themeMode === 'dark' ? '#fff' : '#333'} />
              <Text style={themeMode === 'dark' ? styles.segmentTextActive : styles.segmentText}>Tối</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setThemeMode('system')} style={[styles.segmentBtn, themeMode === 'system' && styles.segmentBtnActive]}>
              <Ionicons name="desktop-outline" size={18} color={themeMode === 'system' ? '#fff' : '#333'} />
              <Text style={themeMode === 'system' ? styles.segmentTextActive : styles.segmentText}>Hệ thống</Text>
            </TouchableOpacity>
          </View>

          {/* Chế độ xem mặc định */}
          <Text style={styles.sectionHeading}>Chế độ xem mặc định</Text>
          <View style={styles.segmentedControl}>
            <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.segmentBtn, viewMode === 'grid' && styles.segmentBtnActive]}>
              <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? '#fff' : '#333'} />
              <Text style={viewMode === 'grid' ? styles.segmentTextActive : styles.segmentText}>Lưới</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.segmentBtn, viewMode === 'list' && styles.segmentBtnActive]}>
              <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? '#fff' : '#333'} />
              <Text style={viewMode === 'list' ? styles.segmentTextActive : styles.segmentText}>Danh sách</Text>
            </TouchableOpacity>
          </View>

          {/* Sắp xếp theo */}
          <Text style={styles.sectionHeading}>Sắp xếp theo</Text>
          <View style={styles.cardList}>
            <TouchableOpacity onPress={() => setSortBy('updated')} style={[styles.optionCard, sortBy === 'updated' && styles.optionCardActive]}>
              <View style={styles.optionIcon}><Ionicons name="time-outline" size={20} color="#666" /></View>
              <View><Text style={styles.optionTitle}>Cập nhật lần cuối</Text><Text style={styles.optionSub}>Ghi chú mới sửa hiện lên đầu</Text></View>
              {sortBy === 'updated' && <Ionicons name="checkmark-circle" size={22} color="#2ecc71" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSortBy('created')} style={[styles.optionCard, sortBy === 'created' && styles.optionCardActive]}>
              <View style={[styles.optionIcon, sortBy === 'created' && {backgroundColor: '#2ecc71'}]}>
                <Ionicons name="calendar-outline" size={20} color={sortBy === 'created' ? '#fff' : '#666'} />
              </View>
              <View><Text style={[styles.optionTitle, sortBy === 'created' && {color: '#157347'}]}>Ngày tạo</Text><Text style={styles.optionSub}>Ghi chú mới tạo hiện lên đầu</Text></View>
              {sortBy === 'created' && <Ionicons name="checkmark-circle" size={22} color="#2ecc71" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setSortBy('custom')} style={[styles.optionCard, sortBy === 'custom' && styles.optionCardActive]}>
              <View style={styles.optionIcon}><Ionicons name="menu-outline" size={20} color="#666" /></View>
              <View><Text style={styles.optionTitle}>Tùy chỉnh</Text><Text style={styles.optionSub}>Kéo thả để sắp xếp thủ công</Text></View>
              {sortBy === 'custom' && <Ionicons name="checkmark-circle" size={22} color="#2ecc71" style={{marginLeft: 'auto'}} />}
            </TouchableOpacity>
          </View>
        </>
      );
    }

    if (activeTab === 'notif') {
      return (
        <>
          <Text style={styles.detailTitle}>Thông báo</Text>
          <Text style={styles.detailSub}>Tùy chỉnh Mindraft</Text>

          <Text style={styles.sectionHeading}>Thông báo ứng dụng</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Thông báo nhắc nhở</Text>
            <Switch value={notifReminder} onValueChange={setNotifReminder} trackColor={{ false: "#ddd", true: "#2ecc71" }} thumbColor="#fff" />
          </View>

          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Thông báo cộng tác</Text>
            <Switch value={notifCollab} onValueChange={setNotifCollab} trackColor={{ false: "#ddd", true: "#2ecc71" }} thumbColor="#fff" />
          </View>
        </>
      );
    }

    return (
      <View style={styles.emptyContent}>
        <Ionicons name="construct-outline" size={48} color="#ddd" />
        <Text style={{marginTop: 10, color: '#999'}}>Tính năng đang được cập nhật...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* CỘT TRÁI (MENU) */}
      <View style={styles.leftColumn}>
        <View style={styles.leftHeader}>
          <Text style={styles.mainTitle}>Cài đặt</Text>
          <Text style={styles.subTitle}>Tùy chỉnh trải nghiệm của bạn</Text>
        </View>

        <View style={styles.menuList}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, activeTab === item.id && styles.activeMenuItem]}
              onPress={() => setActiveTab(item.id as any)}
            >
              <View style={[styles.iconBox, activeTab === item.id && styles.activeIconBox]}>
                <Ionicons name={item.icon as any} size={20} color={activeTab === item.id ? '#fff' : '#666'} />
              </View>
              <View style={styles.menuItemText}>
                <Text style={[styles.menuItemTitle, activeTab === item.id && styles.activeText]}>{item.title}</Text>
                {item.sub !== '' && <Text style={styles.menuItemSub}>{item.sub}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* CỘT PHẢI (CHI TIẾT) */}
      <ScrollView style={styles.rightColumn} contentContainerStyle={styles.rightContent}>
        {renderDetailContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#fff' },
  
  // Cột trái
  leftColumn: { width: 320, borderRightWidth: 1, borderRightColor: '#f0f0f0', padding: 24 },
  leftHeader: { marginBottom: 32 },
  mainTitle: { fontSize: 28, fontWeight: '800', color: '#000' },
  subTitle: { fontSize: 13, color: '#888', marginTop: 4 },
  menuList: { gap: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, gap: 12 },
  activeMenuItem: { backgroundColor: '#f0fdf4' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  activeIconBox: { backgroundColor: '#2ecc71' },
  menuItemText: { flex: 1 },
  menuItemTitle: { fontSize: 15, fontWeight: '600', color: '#444' },
  menuItemSub: { fontSize: 11, color: '#999', marginTop: 2 },
  activeText: { color: '#157347' },

  // Cột phải
  rightColumn: { flex: 1, backgroundColor: '#fff' },
  rightContent: { padding: 40, maxWidth: 800 },
  detailTitle: { fontSize: 26, fontWeight: '700', color: '#000' },
  detailSub: { fontSize: 14, color: '#888', marginBottom: 32 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#000', marginTop: 24, marginBottom: 16 },

  // Segmented Control (Nút bấm Sáng/Tối/Lưới...)
  segmentedControl: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderRadius: 10, padding: 4, gap: 4, marginBottom: 10 },
  segmentBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 8 },
  segmentBtnActive: { backgroundColor: '#000' },
  segmentText: { fontSize: 14, fontWeight: '600', color: '#333' },
  segmentTextActive: { fontSize: 14, fontWeight: '600', color: '#fff' },

  // Cards (Phần Sắp xếp theo)
  cardList: { gap: 12 },
  optionCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#eee', gap: 16 },
  optionCardActive: { borderColor: '#2ecc71', backgroundColor: '#f0fdf4' },
  optionIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { fontSize: 15, fontWeight: '600', color: '#333' },
  optionSub: { fontSize: 12, color: '#999', marginTop: 2 },

  // Switch (Phần Thông báo)
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9' },
  switchLabel: { fontSize: 15, color: '#333', fontWeight: '500' },

  emptyContent: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
});