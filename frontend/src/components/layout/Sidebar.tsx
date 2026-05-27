import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, useWindowDimensions } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useNoteStore } from '../../store/useNoteStore';
import { useAppStore } from '../../store/useAppStore';
import { EditLabelsModal } from './EditLabelsModal';

interface NavItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href: string;
  active: boolean;
  isDark: boolean;
  onPress?: () => void;
}

function NavItem({ icon, label, href, active, isDark, onPress }: NavItemProps) {
  const router = useRouter();
  const activeBg = isDark ? '#064e3b' : colors.primarySubtle;
  const activeTextColor = isDark ? '#34d399' : colors.primary;
  const inactiveTextColor = isDark ? '#9ca3af' : colors.textSecondary;

  return (
    <TouchableOpacity
      style={[styles.navItem, active && { backgroundColor: activeBg }]}
      onPress={() => { if (onPress) onPress(); else router.push(href as any); }}
      activeOpacity={0.7}
    >
      <Feather name={icon} size={18} color={active ? activeTextColor : inactiveTextColor} />
      <Text style={[
        styles.navLabel, { color: inactiveTextColor },
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
  const { openCreateText, openCreateTodo } = useNoteStore();
  const [isNewNoteOpen, setIsNewNoteOpen] = React.useState(false);

  // ── File 1: tags thật + EditLabelsModal ──────────────────────────────────
  const { theme, tags, fetchTags } = useAppStore();
  const [showEditLabels, setShowEditLabels] = React.useState(false);
  const isDark = theme === 'dark';

  React.useEffect(() => { fetchTags(); }, []);

  const handleEditLabelsClose = React.useCallback(() => {
    setShowEditLabels(false);
    fetchTags(); // Refresh sau khi sửa nhãn
  }, [fetchTags]);

  // ── Layout từ File 2 ──────────────────────────────────────────────────────
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const insets = useSafeAreaInsets();
  const isFirstRender = React.useRef(true);
  const slideAnim = React.useRef(new Animated.Value(isSidebarOpen ? 0 : -265)).current;

  React.useEffect(() => {
    if (isMobile) {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        slideAnim.setValue(isSidebarOpen ? 0 : -265);
      } else {
        Animated.timing(slideAnim, {
          toValue: isSidebarOpen ? 0 : -265,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isSidebarOpen, isMobile]);

  const dc = {
    bg: isDark ? '#111827' : colors.bgSurface,
    border: isDark ? '#374151' : colors.borderDefault,
    textMain: isDark ? '#f9fafb' : colors.textPrimary,
    textSec: isDark ? '#9ca3af' : colors.textSecondary,
    textTer: isDark ? '#6b7280' : colors.textTertiary,
  };

  if (!isMobile && !isSidebarOpen) return null;

  const handleNavItemPress = (href: string) => {
    if (isMobile && isSidebarOpen) toggleSidebar();
    router.push(href as any);
  };

  const handleCreateText = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') router.push('/(main)');
    openCreateText();
    if (isMobile && isSidebarOpen) toggleSidebar();
  };

  const handleCreateTodo = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') router.push('/(main)');
    openCreateTodo();
    if (isMobile && isSidebarOpen) toggleSidebar();
  };

  return (
    <Animated.View
      style={[
        styles.sidebar,
        { backgroundColor: dc.bg, borderRightColor: dc.border },
        isMobile && {
          position: 'absolute',
          left: 0, top: 0, bottom: 0, zIndex: 1000,
          height: '100%',
          paddingTop: insets.top > 0 ? insets.top + 12 : 20,
          transform: [{ translateX: slideAnim }],
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 4, height: 0 },
          elevation: 16,
        },
      ]}
    >
      {/* ── Fixed top: New note + main nav ── */}
      <View style={styles.fixedTopNav}>
        <View style={styles.newNoteWrapper}>
          <TouchableOpacity style={styles.newNote} activeOpacity={0.8} onPress={() => setIsNewNoteOpen(!isNewNoteOpen)}>
            <Feather name="plus" size={18} color={dc.textMain} />
            <Text style={[styles.newNoteText, { color: dc.textMain }]}>New note</Text>
          </TouchableOpacity>

          {isNewNoteOpen && (
            <View style={[styles.dropdownContent, { borderLeftColor: dc.border }]}>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleCreateText}>
                <Feather name="type" size={14} color={dc.textSec} />
                <Text style={[styles.dropdownItemText, { color: dc.textSec }]}>Text</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={handleCreateTodo}>
                <Feather name="check-square" size={14} color={dc.textSec} />
                <Text style={[styles.dropdownItemText, { color: dc.textSec }]}>To-do list</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

<<<<<<< HEAD
        {/* Main nav */}
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} isDark={isDark} onPress={() => handleNavItemPress('/(main)')} />
        {/* 🔥 CHỈ SỬA HREF Ở ĐÂY ĐỂ ĐIỀU HƯỚNG VÀO TRONG (MAIN) */}
=======
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} isDark={isDark} onPress={() => handleNavItemPress('/(main)')} />
>>>>>>> 5486d1a (feat: cập nhật lại giao diện và logic xử lý thẻ tag trong Sidebar)
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/reminders')} />

        <View style={[styles.divider, { backgroundColor: dc.border }]} />
      </View>

      {/* ── ScrollView labels (layout File 2) + logic thật (File 1) ── */}
      <View style={styles.scrollArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={[styles.sectionLabel, { color: dc.textTer }]}>LABELS</Text>

          {tags.map((tag) => {
            const isActive = pathname === `/label/${tag.id}`;
            return (
              <TouchableOpacity
                key={tag.id}
                style={[styles.navItem, isActive && { backgroundColor: isDark ? '#064e3b' : colors.primarySubtle }]}
                activeOpacity={0.7}
                onPress={() => handleNavItemPress(`/(main)/label/${tag.id}`)}
              >
                <Feather
                  name="tag"
                  size={16}
                  color={isActive ? (isDark ? '#34d399' : colors.primary) : dc.textSec}
                />
                <Text
                  style={[
                    styles.navLabel, { color: dc.textSec },
                    isActive && { color: isDark ? '#34d399' : colors.primary, fontFamily: 'Inter-Medium' },
                  ]}
                  numberOfLines={1}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Edit labels — mở modal thật */}
          <TouchableOpacity style={styles.editLabels} onPress={() => setShowEditLabels(true)}>
            <Feather name="edit-2" size={13} color={dc.textTer} />
            <Text style={[styles.editLabelsText, { color: dc.textTer }]}>Edit labels</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: dc.border }]} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/archive')} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/trash')} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/settings')} />
      </View>

      <EditLabelsModal visible={showEditLabels} onClose={handleEditLabelsClose} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 250,
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.borderDefault,
    paddingTop: Platform.OS === 'web' ? 0 : 44,
    // File 2 layout: column với flex
    flexDirection: 'column',
  },
  fixedTopNav: {
    paddingHorizontal: 18,
  },
  // File 2: ScrollView cho labels
  scrollArea: {
    flex: 1,
    paddingHorizontal: 0,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 18,
  },
  footer: {
    paddingHorizontal: 18,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
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
    color: colors.textSecondary,
  },
  newNoteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textPrimary,
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
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 10,
  },
  editLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 6,
    marginTop: 2,
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