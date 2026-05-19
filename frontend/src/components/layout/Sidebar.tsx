import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import React from 'react';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
// THÊM: Import AppStore để lấy theme
import { useAppStore } from '../../store/useAppStore'; 

const LABELS = ['Personal', 'Work', 'Ideas'];

interface NavItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href: string;
  active: boolean;
  // THÊM: props màu động
  isDark: boolean;
  onClose?: () => void;
}

function NavItem({ icon, label, href, active, isDark, onClose }: NavItemProps) {
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
      onPress={() => {
        router.push(href as any);
        if (onClose) onClose();
      }}
      activeOpacity={0.7}
    >
      <Feather
        name={icon}
        size={18}
        color={active ? activeTextColor : inactiveTextColor}
      />
      <Text style={[
        styles.navLabel, 
        { color: inactiveTextColor },
        active && { color: activeTextColor, fontFamily: 'Inter-Medium' }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useLayoutStore();
  const pathname = usePathname();
  const router = useRouter();

  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const handleCloseIfMobile = () => {
    if (isMobile && isSidebarOpen) toggleSidebar();
  };

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

  return (
    <View style={[styles.sidebar, { backgroundColor: dynamicColors.bg, borderRightColor: dynamicColors.border }]}>
      <View style={styles.fixedTopNav}>
        {/* Main nav */}
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} isDark={isDark} onClose={handleCloseIfMobile} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} isDark={isDark} onClose={handleCloseIfMobile} />

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
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Footer */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} isDark={isDark} onClose={handleCloseIfMobile} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} isDark={isDark} onClose={handleCloseIfMobile} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} isDark={isDark} onClose={handleCloseIfMobile} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    height: '100%',
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.borderDefault,
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
    color: colors.textSecondary,
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