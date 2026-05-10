import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
// Sử dụng hook để lấy màu động thay vì import hằng số tĩnh
import { useThemeColors } from '../../hooks/useThemeColors'; 
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
  const colors = useThemeColors(); // Lấy màu động cho từng item

  return (
    <TouchableOpacity
      style={[
        styles.navItem, 
        active && { backgroundColor: colors.primarySubtle } // Màu nền khi active động
      ]}
      onPress={() => router.push(href as any)}
      activeOpacity={0.7}
    >
      <Feather
        name={icon}
        size={18}
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text style={[
        styles.navLabel, 
        { color: colors.textSecondary },
        active && { color: colors.primary, fontFamily: 'Inter-Medium' }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Sidebar() {
  const colors = useThemeColors(); // Lấy bảng màu hiện tại (Sáng/Tối)
  const { isSidebarOpen } = useLayoutStore();
  const pathname = usePathname();
  const router = useRouter();
  const { openCreateText, openCreateTodo } = useNoteStore();
  const [isNewNoteOpen, setIsNewNoteOpen] = React.useState(false);

  if (!isSidebarOpen) return null;

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
    <View style={[
      styles.sidebar, 
      { backgroundColor: colors.bgSurface, borderRightColor: colors.borderDefault }
    ]}>
      <View style={styles.fixedTopNav}>
        {/* Nút New note và menu xổ xuống */}
        <View style={styles.newNoteWrapper}>
          <TouchableOpacity 
            style={styles.newNote} 
            activeOpacity={0.8}
            onPress={() => setIsNewNoteOpen(!isNewNoteOpen)}
          >
            <Feather name="plus" size={18} color={colors.textPrimary} />
            <Text style={[styles.newNoteText, { color: colors.textPrimary }]}>New note</Text>
          </TouchableOpacity>
          
          {isNewNoteOpen && (
            <View style={[styles.dropdownContent, { borderLeftColor: colors.borderDefault }]}>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleCreateText}>
                <Feather name="type" size={14} color={colors.textSecondary} />
                <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>Văn bản</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.dropdownItem} onPress={handleCreateTodo}>
                <Feather name="check-square" size={14} color={colors.textSecondary} />
                <Text style={[styles.dropdownItemText, { color: colors.textSecondary }]}>To-do list</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Các mục chính */}
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} />

        <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
      </View>

      {/* Phần Labels */}
      <View style={styles.scrollArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>LABELS</Text>
          {LABELS.map((label) => (
            <TouchableOpacity key={label} style={styles.navItem} activeOpacity={0.7}>
              <Feather name="tag" size={16} color={colors.textSecondary} />
              <Text style={[styles.navLabel, { color: colors.textSecondary }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.editLabels}>
            <Text style={[styles.editLabelsText, { color: colors.textTertiary }]}>Edit labels</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} />
        <NavItem 
          icon="settings" 
          label="Settings" 
          href="/settings" 
          active={pathname === '/settings'} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    borderRightWidth: 1,
    paddingTop: Platform.OS === 'web' ? 0 : 44,
  },
  fixedTopNav: {
    paddingHorizontal: 18,
  },
  scrollArea: {
    flex: 1,
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
  },
  newNoteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
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
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
});