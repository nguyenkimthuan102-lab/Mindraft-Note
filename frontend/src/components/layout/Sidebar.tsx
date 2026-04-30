import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useNoteStore } from '../../store/useNoteStore';

const LABELS = ['Personal', 'Work', 'Ideas'];

interface NavItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href: string;
  active: boolean;
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={() => router.push(href as any)}
      activeOpacity={0.7}
    >
      <Feather
        name={icon}
        size={18}
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
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
  if (!isSidebarOpen) return null; // Nếu đóng thì biến mất

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
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateText}
              >
                <Feather name="type" size={14} color={colors.textSecondary} />
                <Text style={styles.dropdownItemText}>Văn bản</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateTodo}
              >
                <Feather name="check-square" size={14} color={colors.textSecondary} />
                <Text style={styles.dropdownItemText}>To-do list</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main nav */}
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
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Footer - CỐ ĐỊNH ở đáy */}
      <View style={styles.footer}>
        <View style={styles.divider} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} />
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
    // Không có flex ở đây để nó chỉ chiếm vừa đủ diện tích của nó
  },
  scrollArea: {
    flex: 1, // Chiếm toàn bộ không gian còn lại giữa TopNav và Footer
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
  // ... các style còn lại (navItem, sectionLabel, divider...) giữ nguyên
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: colors.primarySubtle,
  },
  navLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },
  navLabelActive: {
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
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