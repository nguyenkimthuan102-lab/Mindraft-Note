import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router'; // ✅ Thêm bộ đôi này để điều hướng
import { colors } from '../../constants/colors';
import { useNoteStore } from '../../store/useNoteStore';

const MAIN_ITEMS = [
  { id: 'all', icon: 'document-text-outline', label: 'All notes' },
  { id: 'reminders', icon: 'notifications-outline', label: 'Reminders' },
];

const LABELS = [
  { id: 'personal', color: '#FFB74D', label: 'Personal' },
  { id: 'work', color: '#64B5F6', label: 'Work' },
  { id: 'ideas', color: '#81C784', label: 'Ideas' },
];

const BOTTOM_ITEMS = [
  { id: 'archive', icon: 'archive-outline', label: 'Archive' },
  { id: 'trash', icon: 'trash-outline', label: 'Trash' },
];

export const Sidebar = () => {
  const router = useRouter(); // ✅ Khởi tạo router để nhảy trang
  const pathname = usePathname(); // ✅ Lấy đường dẫn hiện tại để highlight nút
  const { activeFilter, setActiveFilter, openCreateText } = useNoteStore();

  // Kiểm tra xem có đang ở trang settings không
  const isSettingsPage = pathname === '/settings';

  const renderItem = (item: any, isLabel = false) => {
    // Chỉ highlight item nếu KHÔNG phải đang ở trang settings
    const isActive = activeFilter === item.id && !isSettingsPage; 
    
    return (
      <TouchableOpacity 
        key={item.id}
        style={[styles.menuItem, isActive && styles.activeItem]}
        onPress={() => {
          setActiveFilter(item.id);
          if (isSettingsPage) router.push('/'); // Nếu đang ở settings mà bấm vào filter thì quay về Home
        }}
      >
        {isLabel ? (
          <View style={[styles.labelDot, { backgroundColor: item.color }]} />
        ) : (
          <Ionicons 
            name={item.icon} 
            size={20} 
            color={isActive ? colors.black : colors.grayText} 
            style={styles.icon}
          />
        )}
        <Text style={[styles.menuText, isActive && styles.activeText]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header (Logo + Brand) */}
      <View style={styles.header}>
        <View style={styles.logoBox}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <Text style={styles.brandName}>Mindraft</Text>
      </View>

      {/* Nút Tạo mới */}
      <TouchableOpacity style={styles.newNoteBtn} onPress={openCreateText}>
        <Ionicons name="add" size={20} color={colors.white} />
        <Text style={styles.newNoteText}>New note</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          {MAIN_ITEMS.map(item => renderItem(item))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LABELS</Text>
          {LABELS.map(item => renderItem(item, true))}
        </View>

        <View style={styles.section}>
          {BOTTOM_ITEMS.map(item => renderItem(item))}
        </View>
      </ScrollView>

      {/* ✅ NÚT SETTINGS GÓC TRÁI DƯỚI CÙNG ĐÃ ĐƯỢC FIX */}
      <View style={styles.footer}>
        <TouchableOpacity 
           style={[
             styles.menuItem, 
             isSettingsPage && styles.activeItem, // Tự sáng lên khi đang ở trang Settings
             { backgroundColor: isSettingsPage ? '#E8F5E9' : 'transparent' }
           ]}
           onPress={() => router.push('/settings')} // ✅ Chuyển trang thực sự
        >
          <Ionicons 
            name={isSettingsPage ? "settings" : "settings-outline"} 
            size={20} 
            color={colors.primary} 
            style={styles.icon} 
          />
          <Text style={[
            styles.menuText, 
            { color: colors.primary, fontWeight: isSettingsPage ? '700' : '600' }
          ]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: colors.grayBorder,
    paddingVertical: 24,
    paddingHorizontal: 16,
    height: '100%',
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingHorizontal: 8 },
  logoBox: { width: 28, height: 28, backgroundColor: colors.primary, borderRadius: 6, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  logoText: { color: colors.white, fontWeight: 'bold', fontSize: 16 },
  brandName: { fontSize: 18, fontWeight: '800', color: colors.black },
  
  newNoteBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  newNoteText: { color: colors.white, fontWeight: '700', fontSize: 15 },
  
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: colors.grayText, marginBottom: 12, paddingHorizontal: 8, letterSpacing: 1 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  activeItem: { backgroundColor: '#E8F5E9' }, 
  icon: { marginRight: 12, width: 20 },
  labelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 16, marginLeft: 4 },
  menuText: { fontSize: 14, color: '#555', fontWeight: '500' },
  activeText: { color: colors.black, fontWeight: '700' },
  
  footer: { borderTopWidth: 1, borderTopColor: colors.grayBorder, paddingTop: 16, marginTop: 'auto' }
});