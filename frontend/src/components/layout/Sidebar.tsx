import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated, useWindowDimensions } from 'react-native';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useNoteStore } from '../../store/useNoteStore';
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
  onPress?: () => void;
}

function NavItem({ icon, label, href, active, isDark, onPress }: NavItemProps) {
  const router = useRouter();
  
  // Màu sắc động cho item
  const activeBg = isDark ? '#064e3b' : colors.primarySubtle;
  const activeTextColor = isDark ? '#34d399' : colors.primary;
  const inactiveTextColor = isDark ? '#9ca3af' : colors.textSecondary;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(href as any);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.navItem, 
        active && { backgroundColor: activeBg } // Ghi đè màu active
      ]}
      onPress={handlePress}
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
  const { openCreateText, openCreateTodo } = useNoteStore();
  const [isNewNoteOpen, setIsNewNoteOpen] = React.useState(false);

  // THÊM: Lấy theme từ AppStore
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const insets = useSafeAreaInsets();

  // Ref to detect first render to avoid initial close animation glitch on mobile mount
  const isFirstRender = React.useRef(true);
  
  // Translation X animation value for slide-in drawer effect (-265 completely hides drawer including shadows)
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

  // Bảng màu động cho Sidebar
  const dynamicColors = {
    bg: isDark ? '#111827' : colors.bgSurface,
    border: isDark ? '#374151' : colors.borderDefault,
    textMain: isDark ? '#f9fafb' : colors.textPrimary,
    textSec: isDark ? '#9ca3af' : colors.textSecondary,
    textTer: isDark ? '#6b7280' : colors.textTertiary,
  };

  // If not mobile and sidebar is not open, return null (desktop collapsible behavior)
  if (!isMobile && !isSidebarOpen) return null;

  const handleNavItemPress = (href: string) => {
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
    router.push(href as any);
  };

  const handleCreateText = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') {
      router.push('/(main)');
    }
    openCreateText();
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handleCreateTodo = () => {
    setIsNewNoteOpen(false);
    if (pathname !== '/') {
      router.push('/(main)');
    }
    openCreateTodo();
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  };

  const handlePlaceholderClick = () => {
    if (isMobile && isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <Animated.View 
      style={[
        styles.sidebar, 
        { 
          backgroundColor: dynamicColors.bg, 
          borderRightColor: dynamicColors.border 
        },
        isMobile && {
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 1000,
          height: '100%',
          paddingTop: insets.top > 0 ? insets.top + 12 : 20,
          transform: [{ translateX: slideAnim }],
          // Premium drop-shadow to separate drawer from background
          shadowColor: '#000',
          shadowOpacity: isDark ? 0.4 : 0.15,
          shadowRadius: 10,
          shadowOffset: { width: 4, height: 0 },
          elevation: 16,
        }
      ]}
    >
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
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateText}
              >
                <Feather name="type" size={14} color={dynamicColors.textSec} />
                <Text style={[styles.dropdownItemText, { color: dynamicColors.textSec }]}>Văn bản</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={handleCreateTodo}
              >
                <Feather name="check-square" size={14} color={dynamicColors.textSec} />
                <Text style={[styles.dropdownItemText, { color: dynamicColors.textSec }]}>To-do list</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Main nav */}
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} isDark={isDark} onPress={() => handleNavItemPress('/(main)')} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/reminders')} />

        <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />
      </View>

      {/* 3. Phần Labels */}
      <View style={styles.scrollArea}>
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
          <Text style={[styles.sectionLabel, { color: dynamicColors.textTer }]}>LABELS</Text>
          {LABELS.map((label) => (
            <TouchableOpacity key={label} style={styles.navItem} activeOpacity={0.7} onPress={handlePlaceholderClick}>
              <Feather name="tag" size={16} color={dynamicColors.textSec} />
              <Text style={[styles.navLabel, { color: dynamicColors.textSec }]}>{label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.editLabels} onPress={handlePlaceholderClick}>
            <Text style={[styles.editLabelsText, { color: dynamicColors.textTer }]}>Edit labels</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 4. Footer */}
      <View style={styles.footer}>
        <View style={[styles.divider, { backgroundColor: dynamicColors.border }]} />
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/archive')} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/trash')} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} isDark={isDark} onPress={() => handleNavItemPress('/(main)/settings')} />
      </View>
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