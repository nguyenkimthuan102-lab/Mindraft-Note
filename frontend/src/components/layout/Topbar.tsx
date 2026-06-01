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
import { useNoteStore } from '../../store/useNoteStore';
import { useAppStore, DEFAULT_SORT } from '../../store/useAppStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/useAuthStore';
import { useNotificationStore } from '../../store/useNotificationStore'; // 🔥 IMPORT STORE THÔNG BÁO
import { ProfileModal } from './ProfileModal';

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const logoIcon = require('../../../assets/images/icon.png');

const NOTE_COLORS = [
  { key: 'default', bg: '#FFFFFF' }, { key: 'red', bg: '#FADADD' },
  { key: 'orange', bg: '#FEEFC3' }, { key: 'yellow', bg: '#FEF7CD' },
  { key: 'green', bg: '#E2F3E8' }, { key: 'teal', bg: '#D0F4EE' },
  { key: 'blue', bg: '#D3E3FD' }, { key: 'purple', bg: '#E8DEFC' },
  { key: 'pink', bg: '#FDCFE8' }, { key: 'brown', bg: '#F0E6DA' },
];

export function Topbar({ onViewModeChange }: TopbarProps) {
  const { sort, setSort, viewMode, setViewMode, theme } = useAppStore();
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore(); // 🔥 LẤY SỐ LƯỢNG THÔNG BÁO CHƯA ĐỌC ĐỘNG

  const [menuVisible, setMenuVisible] = useState(false);
  const [profileVisible, setProfileVisible] = useState(false);
  const [colorMenuVisible, setColorMenuVisible] = useState(false);

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

  const { batchPinAction, batchArchiveAction, batchTrashAction, batchColorAction } = useNoteStore();

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

  const handleBatchPin = async () => {
    const idsToProcess = [...selectedIds];
    clearSelection();
    await batchPinAction(idsToProcess);
  };

  const handleBatchArchive = async () => {
    const idsToProcess = [...selectedIds];
    clearSelection();
    await batchArchiveAction(idsToProcess);
  };

  const handleBatchTrash = async () => {
    const idsToProcess = [...selectedIds];
    clearSelection();
    await batchTrashAction(idsToProcess);
  };

  const handleBatchColor = async (colorKey: string) => {
    const idsToProcess = [...selectedIds];
    setColorMenuVisible(false);
    clearSelection();
    await batchColorAction(idsToProcess, colorKey);
  };

  // ------------------------------------------------─────────────
  // 1. GIAO DIỆN KHI CHỌN HÀNG LOẠT (BATCH MODE ACTIVE)
  // ------------------------------------------------─────────────
  if (selectedCount > 0) {
    return (
      <View
        style={[
          styles.topbar,
          {
            backgroundColor: isDark ? '#1f2937' : '#E3F2FD',
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
              { color: isDark ? '#93c5fd' : colors.primary },
              isMobile && { fontSize: 15, marginLeft: 6 },
            ]}
          >
            {selectedCount} đã chọn
          </Text>
        </View>

        <View style={[styles.selectionActions, { gap: isMobile ? 4 : 10 }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleBatchPin}>
            <Icon source="pin-outline" size={22} color={isDark ? '#9ca3af' : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => alert("Tính năng nhắc nhở hàng loạt chưa được hỗ trợ API")}>
            <Icon source="bell-outline" size={22} color={isDark ? '#9ca3af' : colors.textSecondary} />
          </TouchableOpacity>

          <Menu
            visible={colorMenuVisible}
            onDismiss={() => setColorMenuVisible(false)}
            anchor={
              <TouchableOpacity style={styles.iconBtn} onPress={() => setColorMenuVisible(true)}>
                <Icon source="palette-outline" size={22} color={isDark ? '#9ca3af' : colors.textSecondary} />
              </TouchableOpacity>
            }
            contentStyle={{ backgroundColor: dynamicColors.bg, padding: 8, borderRadius: 8, maxWidth: 200 }}
          >
            <Text style={[styles.menuHeader, { marginBottom: 8, color: dynamicColors.textSec }]}>ĐỔI MÀU CÁC MỤC ĐÃ CHỌN</Text>
            <View style={styles.colorGrid}>
              {NOTE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.colorDot, { backgroundColor: c.bg }]}
                  onPress={() => handleBatchColor(c.key)}
                />
              ))}
            </View>
          </Menu>

          <TouchableOpacity style={styles.iconBtn} onPress={handleBatchArchive}>
            <Icon source="archive-arrow-down-outline" size={22} color={isDark ? '#9ca3af' : colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleBatchTrash}>
            <Icon source="delete-outline" size={22} color={isDark ? '#9ca3af' : colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ------------------------------------------------─────────────
  // 2. GIAO DIỆN Ô TÌM KIẾM PHÓNG TO TRÊN MOBILE
  // ------------------------------------------------─────────────
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

  // ------------------------------------------------─────────────
  // 3. GIAO DIỆN TOPBAR BÌNH THƯỜNG
  // ------------------------------------------------─────────────
  return (
    <>
      <View style={[styles.topbar, { backgroundColor: dynamicColors.bg, borderBottomColor: dynamicColors.border, height: 66 + insets.top, paddingTop: insets.top }]}>

        {/* Cột trái: Nút menu và Brand/Title */}
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

        {/* Giữa: Ô tìm kiếm (Ẩn trên Mobile, chỉ hiện trên Tablet/Web) */}
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

        {/* Cột phải: Các nút chức năng hệ thống */}
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

          {/* Menu Sắp xếp */}
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

          {/* 🔥 QUẢ CHUÔNG THÔNG BÁO TỰ ĐỘNG ĐÃ ĐƯỢC ĐỔI ĐƯỜNG DẪN ĐIỀU HƯỚNG */}
          <TouchableOpacity 
            style={styles.iconBtn} 
            onPress={() => router.push('/(main)/notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.bellContainer}>
              <Feather name="bell" size={20} color={dynamicColors.textSec} />
              {unreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Avatar Profile */}
          <TouchableOpacity style={styles.avatar} onPress={() => setProfileVisible(true)}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarText}>
                {(user?.name ?? 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 8,
    justifyContent: 'center',
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  selectionSection: { flexDirection: 'row', alignItems: 'center' },
  selectionText: { fontSize: 18, fontFamily: 'Inter-Medium', marginLeft: 15 },
  selectionActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
  bellContainer: {
    position: 'relative',
  },
  // 🔥 STYLE BADGE CHẤM ĐỎ HIỂN THỊ SỐ ĐỘNG CHUẨN ĐẸP
  notifBadge: {
    position: 'absolute',
    top: -5,
    right: -7,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    lineHeight: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
    overflow: 'hidden',
  },
  avatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
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