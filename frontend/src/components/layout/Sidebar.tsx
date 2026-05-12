import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useNoteStore } from '../../store/useNoteStore';
<<<<<<< HEAD
// THÊM: Import AppStore để lấy theme
import { useAppStore } from '../../store/useAppStore'; 
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

const LABELS = ['Personal', 'Work', 'Ideas'];

interface NavItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href: string;
  active: boolean;
<<<<<<< HEAD
  // THÊM: props màu động
  isDark: boolean;
}

function NavItem({ icon, label, href, active, isDark }: NavItemProps) {
  const router = useRouter();
  
  // Màu sắc động cho item
  const activeBg = isDark ? '#064e3b' : colors.primarySubtle;
  const activeTextColor = isDark ? '#34d399' : colors.primary;
  const inactiveTextColor = isDark ? '#9ca3af' : colors.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.navItem, 
        active && { backgroundColor: activeBg } // Ghi đè màu active
      ]}
=======
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
      onPress={() => router.push(href as any)}
      activeOpacity={0.7}
    >
      <Feather
        name={icon}
        size={18}
<<<<<<< HEAD
        color={active ? activeTextColor : inactiveTextColor}
      />
      <Text style={[
        styles.navLabel, 
        { color: inactiveTextColor },
        active && { color: activeTextColor, fontFamily: 'Inter-Medium' }
      ]}>
=======
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Sidebar() {
  const { isSidebarOpen } = useLayoutStore();
  const pathname = usePathname();
  const router = useRouter();
  const { openCreateText, openCreateTodo } = useNoteStore();
  const [isNewNoteOpen, setIsNewNoteOpen] = React.useState(false);
<<<<<<< HEAD

  // THÊM: Lấy theme từ AppStore
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  // Bảng màu động cho Sidebar
  const dynamicColors = {
    bg: isDark ? '#111827' : colors.bgSurface,
    border: isDark ? '#374151' : colors.borderDefault,
    textMain: isDark ? '#f9fafb' : colors.textPrimary,
    textSec: isDark ? '#9ca3af' : colors.textSecondary,
    textTer: isDark ? '#6b7280' : colors.textTertiary,
  };

  if (!isSidebarOpen) return null;
=======
  if (!isSidebarOpen) return null; // Nếu đóng thì biến mất
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

  const handleCreateText = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') {
      router.push('/(main)');
    }
    openCreateText();
  };

  const handleCreateTodo = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') {
      router.push('/(main)');
    }
    openCreateTodo();
  };

  return (
<<<<<<< HEAD
    <View style={[styles.sidebar, { backgroundColor: dynamicColors.bg, borderRightColor: dynamicColors.border }]}>
      <View style={styles.fixedTopNav}>
        {/* New note */}
        <View style={styles.newNoteWrapper}>
          <TouchableOpacity 
            style={styles.newNote} 
            activeOpacity={0.8}
            onPress={() => setIsNewNoteOpen(!isNewNoteOpen)}
          >
            <Feather name="plus" size={18} color={dynamicColors.textMain} />
            <Text style={[styles.newNoteText, { color: dynamicColors.textMain }]}>New note</Text>
          </TouchableOpacity>

          {isNewNoteOpen && (
            <View style={[styles.dropdownContent, { borderLeftColor: dynamicColors.border }]}>
=======
    <View style={styles.sidebar}>
      <View style={styles.fixedTopNav}>
        {/* New note */}
        <View style={styles.newNoteWrapper}>
          <TouchableOpacity style={styles.newNote} activeOpacity={0.8}
            onPress={() => setIsNewNoteOpen(!isNewNoteOpen)} // Bấm để đóng/mở
          >
            <Feather name="plus" size={18} color={colors.textPrimary} />
            <Text style={styles.newNoteText}>New note</Text>
            {/* Thêm icon mũi tên để người dùng biết là có menu */}
          </TouchableOpacity>
          {/* Phần menu xổ xuống */}
          {isNewNoteOpen && (
            <View style={styles.dropdownContent}>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateText}
              >
<<<<<<< HEAD
                <Feather name="type" size={14} color={dynamicColors.textSec} />
                <Text style={[styles.dropdownItemText, { color: dynamicColors.textSec }]}>Văn bản</Text>
=======
                <Feather name="type" size={14} color={colors.textSecondary} />
                <Text style={styles.dropdownItemText}>Văn bản</Text>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateTodo}
              >
<<<<<<< HEAD
                <Feather name="check-square" size={14} color={dynamicColors.textSec} />
                <Text style={[styles.dropdownItemText, { color: dynamicColors.textSec }]}>To-do list</Text>
=======
                <Feather name="check-square" size={14} color={colors.textSecondary} />
                <Text style={styles.dropdownItemText}>To-do list</Text>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main nav */}
<<<<<<< HEAD
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} isDark={isDark} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} isDark={isDark} />

        <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />
      </View>

      {/* 3. Phần Labels */}
      <View style={styles.scrollArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={[styles.sectionLabel, { color: dynamicColors.textTer }]}>LABELS</Text>
          {LABELS.map((label) => (
            <TouchableOpacity key={label} style={styles.navItem} activeOpacity={0.7}>
              <Feather name="tag" size={16} color={dynamicColors.textSec} />
              <Text style={[styles.navLabel, { color: dynamicColors.textSec }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.editLabels}>
            <Text style={[styles.editLabelsText, { color: dynamicColors.textTer }]}>Edit labels</Text>
=======
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} />

        <View style={styles.divider} />
      </View>

      {/* 3. Phần Labels - CÓ THỂ CUỘN */}
      <View style={styles.scrollArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={styles.sectionLabel}>LABELS</Text>
          {LABELS.map((label) => (
            <TouchableOpacity key={label} style={styles.navItem} activeOpacity={0.7}>
              <Feather name="tag" size={16} color={colors.textSecondary} />
              <Text style={styles.navLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.editLabels}>
            <Text style={styles.editLabelsText}>Edit labels</Text>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
          </TouchableOpacity>
        </ScrollView>
      </View>

<<<<<<< HEAD
      {/* 4. Footer */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} isDark={isDark} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} isDark={isDark} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} isDark={isDark} />
=======
      {/* 4. Footer - CỐ ĐỊNH ở đáy */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.borderDefault,
    paddingTop: Platform.OS === 'web' ? 0 : 44,
  },
  fixedTopNav: {
    paddingHorizontal: 18,
<<<<<<< HEAD
  },
  scrollArea: {
    flex: 1,
=======
    // Không có flex ở đây để nó chỉ chiếm vừa đủ diện tích của nó
  },
  scrollArea: {
    flex: 1, // Chiếm toàn bộ không gian còn lại giữa TopNav và Footer
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
    paddingHorizontal: 0,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 18,
  },
<<<<<<< HEAD
=======

  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 26,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    height: 64, // Cố định chiều cao để header không bị nhảy khi mất logo
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  newNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  newNoteWrapper: {
    marginTop: 8,
    marginBottom: 4,
  },
  dropdownContent: {
    marginLeft: 36,
    marginTop: 2,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderDefault,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  newNoteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
<<<<<<< HEAD
=======
  // ... các style còn lại (navItem, sectionLabel, divider...) giữ nguyên
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
<<<<<<< HEAD
=======
  navItemActive: {
    backgroundColor: colors.primarySubtle,
  },
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  navLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },
<<<<<<< HEAD
=======
  navLabelActive: {
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 10,
  },
  editLabels: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editLabelsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginVertical: 12,
  },
});