import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, LayoutAnimation, useWindowDimensions } from 'react-native';
import { Icon, Menu, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useSyncStore } from '../../store/useSyncStore';
import { SyncIndicator } from '../ui/SyncIndicator';
import { useSelectionStore } from '../../store/useSelectionStore';
import { useAppStore, DEFAULT_SORT } from '../../store/useAppStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const logoIcon = require('../../../assets/images/icon.png');

function ActionBtn({ icon, label, isDark }: { icon: string; label: string; isDark?: boolean }) {
  return (
    <TouchableOpacity style={styles.iconBtn}>
      <Icon source={icon} size={20} color={isDark ? '#9ca3af' : colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function Topbar({ onViewModeChange }: TopbarProps) {
  const { sort, setSort, viewMode, setViewMode, theme } = useAppStore(); // THÊM theme
  const [menuVisible, setMenuVisible] = useState(false);
  const isSortActive = sort.field !== DEFAULT_SORT.field || sort.direction !== DEFAULT_SORT.direction;
  const insets = useSafeAreaInsets();

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const [search, setSearch] = useState('');
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const { toggleSidebar } = useLayoutStore();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(main)';
  const isSettings = pathname.includes('settings');
  const router = useRouter();
  const { status: syncStatus } = useSyncStore();

  // THÊM: Logic màu sắc động cho Dark Mode
  const isDark = theme === 'dark';
  const dynamicColors = {
    bg: isDark ? '#111827' : colors.bgSurface,
    text: isDark ? '#f9fafb' : colors.textPrimary,
    textSec: isDark ? '#9ca3af' : colors.textSecondary,
    border: isDark ? '#374151' : colors.borderDefault,
    searchBg: isDark ? '#1f2937' : colors.gray100,
    placeholder: isDark ? '#6b7280' : colors.textPlaceholder,
  };

  const { selectedIds, clearSelection } = useSelectionStore();
  const selectedCount = selectedIds.length;

  const handleSortChange = (field: any, direction: any) => {
    setSort({ field, direction });
    closeMenu();
  };

  const handleToggle = () => {
    const nextMode = viewMode === 'list' ? 'grid' : 'list';
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setViewMode(nextMode);
    onViewModeChange?.(nextMode);
  };

  const getAreaTitle = () => {
    if (isHome) return 'Mindraft Note';
    if (pathname.includes('trash')) return 'Trash';
    if (pathname.includes('archive')) return 'Archive';
    if (pathname.includes('reminders')) return 'Reminders';
    if (pathname.includes('setting')) return 'Setting';
    if (pathname.includes('tag')) return pathname.split('/').pop()?.toUpperCase();
    return 'Mindraft Note';
  };

  if (selectedCount > 0) {
    return (
      <View
        style={[
          styles.topbar,
          {
            backgroundColor: dynamicColors.bg,
            borderBottomColor: dynamicColors.border,
            height: 66 + insets.top,
            paddingTop: insets.top,
            paddingHorizontal: isMobile ? 8 : 20,
          },
        ]}
      >
        <View style={styles.selectionSection}>
          <TouchableOpacity onPress={clearSelection} style={styles.menuBtn}>
            <Icon source="close" size={22} color={dynamicColors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.selectionText,
              { color: dynamicColors.text },
              isMobile && { fontSize: 15, marginLeft: 6 },
            ]}
          >
            {selectedCount} đã chọn
          </Text>
        </View>

        <View style={[styles.selectionActions, { gap: isMobile ? 4 : 10 }]}>
          <ActionBtn icon="pin-outline" label="Ghim" isDark={isDark} />
          <ActionBtn icon="bell-outline" label="Nhắc nhở" isDark={isDark} />
          <ActionBtn icon="palette-outline" label="Màu" isDark={isDark} />
          <ActionBtn icon="archive-arrow-down-outline" label="Lưu trữ" isDark={isDark} />
          <ActionBtn icon="delete-outline" label="Xóa" isDark={isDark} />
        </View>
      </View>
    );
  }

  if (isMobile && isSearchExpanded) {
    return (
      <View style={[styles.topbar, { backgroundColor: dynamicColors.bg, borderBottomColor: dynamicColors.border, paddingHorizontal: 12, height: 66 + insets.top, paddingTop: insets.top }]}>
        <View style={styles.mobileSearchHeader}>
          <TouchableOpacity onPress={() => { setIsSearchExpanded(false); setSearch(''); }} style={styles.menuBtn}>
            <Feather name="arrow-left" size={22} color={dynamicColors.textSec} />
          </TouchableOpacity>
          <View style={[styles.searchWrapMobile, { backgroundColor: dynamicColors.searchBg }]}>
            <TextInput
              style={[styles.searchInput, { color: dynamicColors.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search notes, tags..."
              placeholderTextColor={dynamicColors.placeholder}
              autoFocus
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                <Feather name="x" size={18} color={dynamicColors.textSec} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.topbar, { backgroundColor: dynamicColors.bg, borderBottomColor: dynamicColors.border, height: 66 + insets.top, paddingTop: insets.top }]}>

      <View style={[styles.leftSection, isMobile && { width: 'auto' }]}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <Feather name="menu" size={22} color={dynamicColors.textSec} />
        </TouchableOpacity>
        
        {!isMobile && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.logoContainer}
            disabled={isSettings}
            onPress={() => {
              if (isHome) {
                router.replace('/(main)');
              } else {
                router.push('/(main)');
              }
            }}
          >
            {isHome ? (
              <>
                <Image source={logoIcon} style={styles.logoImg} />
                <Text style={[styles.brandText, { color: dynamicColors.text }]}>Mindraft Note</Text>
              </>
            ) : (
              <Text style={[styles.areaTitle, { color: dynamicColors.textSec }]}>{getAreaTitle()}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {!isMobile && (
        <View style={[styles.searchWrap, { backgroundColor: dynamicColors.searchBg }]}>
          <Feather name="search" size={16} color={dynamicColors.textSec} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: dynamicColors.text }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes, tags, or text..."
            placeholderTextColor={dynamicColors.placeholder}
          />
        </View>
      )}

      <View style={[styles.actions, isMobile && { width: 'auto' }]}>
        {isMobile && (
          <TouchableOpacity style={styles.iconBtn} onPress={() => setIsSearchExpanded(true)}>
            <Feather name="search" size={20} color={dynamicColors.textSec} />
          </TouchableOpacity>
        )}

        <SyncIndicator status={syncStatus} />

        <TouchableOpacity style={styles.iconBtn} onPress={handleToggle}>
          <Feather name={viewMode === 'list' ? "grid" : "list"} size={20} color={dynamicColors.textSec} />
        </TouchableOpacity>

        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity
              style={[styles.iconBtn, isSortActive && styles.iconBtnActive, isSortActive && isDark && { backgroundColor: '#374151' }]}
              onPress={openMenu}
            >
              <Icon source="sort-variant" size={22} color={isSortActive ? colors.primary : dynamicColors.textSec} />
              {isSortActive && <View style={styles.sortDot} />}
            </TouchableOpacity>
          }
          contentStyle={{ backgroundColor: dynamicColors.bg }}
        >
          <Menu.Item title="SẮP XẾP THEO" titleStyle={[styles.menuHeader, { color: isDark ? '#6b7280' : colors.textTertiary }]} disabled />

          <Menu.Item
            leadingIcon="drag-variant"
            onPress={() => handleSortChange('custom', 'desc')}
            title="Thứ tự tùy chỉnh"
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'custom' ? "check" : undefined}
          />

          <Divider style={{ backgroundColor: dynamicColors.border }} />

          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'desc')}
            title="Sửa đổi: Mới nhất"
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'asc')}
            title="Sửa đổi: Cũ nhất"
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider style={{ backgroundColor: dynamicColors.border }} />

          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'desc')}
            title="Ngày tạo: Mới nhất"
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'created_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'asc')}
            title="Ngày tạo: Cũ nhất"
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'created_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider style={{ backgroundColor: dynamicColors.border }} />

          <Menu.Item
            leadingIcon="restore"
            onPress={() => handleSortChange(DEFAULT_SORT.field, DEFAULT_SORT.direction)}
            title="Đặt lại mặc định"
            titleStyle={{ color: dynamicColors.text }}
          />
        </Menu>

        <TouchableOpacity style={styles.iconBtn}>
          <View>
            <Feather name="bell" size={20} color={dynamicColors.textSec} />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.avatar}>
          <Text style={styles.avatarText}>U</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selectionSection: { flexDirection: 'row', alignItems: 'center' },
  selectionText: { fontSize: 18, fontFamily: 'Inter-Medium', marginLeft: 15 },
  selectionActions: { flexDirection: 'row', gap: 10 },
  topbar: {
    height: 66,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 250,
  },
  menuBtn: {
    padding: 8,
    marginRight: 4,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImg: {
    width: 32,
    height: 32,
  },
  brandText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  areaTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: colors.textSecondary,
    marginLeft: 12,
  },
  searchWrap: {
    width: '100%',
    maxWidth: 800,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textPrimary,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  actions: {
    width: 210,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: colors.bgHover,
  },
  notifDot: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.bgSurface,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#fff',
  },
  menuHeader: {
    fontSize: 11,
    color: colors.textTertiary,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sortDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.bgSurface,
  },
  mobileSearchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  searchWrapMobile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
});