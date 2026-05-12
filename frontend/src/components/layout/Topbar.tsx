import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
<<<<<<< HEAD
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, LayoutAnimation } from 'react-native';
import { Icon, Menu, Divider } from 'react-native-paper';
=======
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, LayoutAnimation, UIManager, Modal } from 'react-native';
import { Icon, IconButton, Menu, Divider } from 'react-native-paper';
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useSyncStore } from '../../store/useSyncStore';
import { SyncIndicator } from '../ui/SyncIndicator';
<<<<<<< HEAD
import { useSelectionStore } from '../../store/useSelectionStore';
import { useAppStore, DEFAULT_SORT } from '../../store/useAppStore';
=======
import { useSelectionStore } from '../../store/useSelectionStore'; // Import store
import { useAppStore, DEFAULT_SORT, SortOption } from '../../store/useAppStore';
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const logoIcon = require('../../../assets/images/icon.png');

<<<<<<< HEAD
function ActionBtn({ icon, label, isDark }: { icon: string; label: string; isDark?: boolean }) {
  return (
    <TouchableOpacity style={styles.iconBtn}>
      <Icon source={icon} size={20} color={isDark ? '#9ca3af' : colors.textSecondary} />
=======
function ActionBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.iconBtn}>
      <Icon source={icon} size={20} color={colors.textSecondary} />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
    </TouchableOpacity>
  );
}

export function Topbar({ onViewModeChange }: TopbarProps) {
<<<<<<< HEAD
  const { sort, setSort, viewMode, setViewMode, theme } = useAppStore(); // THÊM theme
  const [menuVisible, setMenuVisible] = useState(false);
=======
  const { sort, setSort } = useAppStore();
  const [menuVisible, setMenuVisible] = useState(false); // State cho dropdown
  //const [sortVisible, setSortVisible] = useState(false);
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  const isSortActive = sort.field !== DEFAULT_SORT.field || sort.direction !== DEFAULT_SORT.direction;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const [search, setSearch] = useState('');
  const { toggleSidebar } = useLayoutStore();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(main)';
  const isSettings = pathname.includes('settings');
  const router = useRouter();
  const { status: syncStatus } = useSyncStore();
<<<<<<< HEAD

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

=======
  const { viewMode, setViewMode } = useAppStore();

  // Tự động lấy trạng thái từ Store
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  const { selectedIds, clearSelection } = useSelectionStore();
  const selectedCount = selectedIds.length;

  const handleSortChange = (field: any, direction: any) => {
    setSort({ field, direction });
    closeMenu();
  };

  const handleToggle = () => {
<<<<<<< HEAD
    const nextMode = viewMode === 'list' ? 'grid' : 'list';
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
=======
    // 1. Xác định chế độ tiếp theo
    const nextMode = viewMode === 'list' ? 'grid' : 'list';

    // 2. Chỉ chạy LayoutAnimation trên Mobile (Web hỗ trợ kém)
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    // 3. Cập nhật State
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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

<<<<<<< HEAD
  if (selectedCount > 0) {
    return (
      <View style={[styles.topbar, { backgroundColor: dynamicColors.bg, borderBottomColor: dynamicColors.border }]}>
        <View style={styles.selectionSection}>
          <TouchableOpacity onPress={clearSelection} style={styles.menuBtn}>
            <Icon source="close" size={22} color={dynamicColors.text} />
          </TouchableOpacity>
          <Text style={[styles.selectionText, { color: dynamicColors.text }]}>{selectedCount} đã chọn</Text>
        </View>

        <View style={styles.selectionActions}>
          <ActionBtn icon="pin-outline" label="Ghim" isDark={isDark} />
          <ActionBtn icon="bell-outline" label="Nhắc nhở" isDark={isDark} />
          <ActionBtn icon="palette-outline" label="Màu" isDark={isDark} />
          <ActionBtn icon="archive-arrow-down-outline" label="Lưu trữ" isDark={isDark} />
          <ActionBtn icon="delete-outline" label="Xóa" isDark={isDark} />
=======

  if (selectedCount > 0) {
    return (
      <View style={[styles.topbar, { backgroundColor: colors.bgSurface }]}>
        <View style={styles.selectionSection}>
          <TouchableOpacity onPress={clearSelection} style={styles.menuBtn}>
            {/* Đổi Feather name="x" thành Icon source="close" */}
            <Icon source="close" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.selectionText}>{selectedCount} đã chọn</Text>
        </View>

        <View style={styles.selectionActions}>
          {/* Cập nhật tên icon theo Material Design (kèm hậu tố -outline cho đồng bộ) */}
          <ActionBtn icon="pin-outline" label="Ghim" />
          <ActionBtn icon="bell-outline" label="Nhắc nhở" />
          <ActionBtn icon="palette-outline" label="Màu" />
          <ActionBtn icon="archive-arrow-down-outline" label="Lưu trữ" />
          <ActionBtn icon="delete-outline" label="Xóa" />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
        </View>
      </View>
    );
  }

  return (
<<<<<<< HEAD
    <View style={[styles.topbar, { backgroundColor: dynamicColors.bg, borderBottomColor: dynamicColors.border }]}>

      <View style={styles.leftSection}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <Feather name="menu" size={22} color={dynamicColors.textSec} />
        </TouchableOpacity>
        
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoContainer}
          disabled={isSettings}
          onPress={() => {
=======
    <View style={styles.topbar}>

      <View style={styles.leftSection}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.menuBtn}>
          <Feather name="menu" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {/* Bọc cụm Logo/Brand vào TouchableOpacity để click được */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.logoContainer}
          onPress={() => {
            // Nếu đang ở Home thì replace để reload, nếu ở trang khác thì push về Home
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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
<<<<<<< HEAD
              <Text style={[styles.brandText, { color: dynamicColors.text }]}>Mindraft Note</Text>
            </>
          ) : (
            <Text style={[styles.areaTitle, { color: dynamicColors.textSec }]}>{getAreaTitle()}</Text>
=======
              <Text style={styles.brandText}>Mindraft Note</Text>
            </>
          ) : (
            <Text style={styles.areaTitle}>{getAreaTitle()}</Text>
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
          )}
        </TouchableOpacity>
      </View>

<<<<<<< HEAD
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

      <View style={styles.actions}>
        <SyncIndicator status={syncStatus} />

        <TouchableOpacity style={styles.iconBtn} onPress={handleToggle}>
          <Feather name={viewMode === 'list' ? "grid" : "list"} size={20} color={dynamicColors.textSec} />
        </TouchableOpacity>

=======
      {/* Search */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={colors.textTertiary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search notes, tags, or text..."
          placeholderTextColor={colors.textPlaceholder}
        />
      </View>

      {/* Right actions */}
      <View style={styles.actions}>

        {/* Sync - gần search nhất */}
        <SyncIndicator status={syncStatus} />

        {/* View mode toggle */}
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={handleToggle}
        >{/* Nếu đang là list thì hiện icon grid (để bấm chuyển sang grid) và ngược lại */}
          <Feather
            name={viewMode === 'list' ? "grid" : "list"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {/* SORT DROPDOWN (Thay thế Modal) */}
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity
<<<<<<< HEAD
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
=======
              style={[styles.iconBtn, isSortActive && styles.iconBtnActive]}
              onPress={openMenu}
            >
              <Icon
                source="sort-variant"
                size={22}
                color={isSortActive ? colors.primary : colors.textSecondary}
              />
              {isSortActive && <View style={styles.sortDot} />}
            </TouchableOpacity>
          }
          contentStyle={{ backgroundColor: colors.bgSurface }}
        >
          <Menu.Item title="SẮP XẾP THEO" titleStyle={styles.menuHeader} disabled />

          {/* Lựa chọn Tùy chỉnh mới */}
          <Menu.Item
            leadingIcon="drag-variant" // Icon gợi ý việc kéo thả/tùy chỉnh
            onPress={() => handleSortChange('custom', 'desc')}
            title="Thứ tự tùy chỉnh"
            trailingIcon={sort.field === 'custom' ? "check" : undefined}
          />

          <Divider />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'desc')}
            title="Sửa đổi: Mới nhất"
<<<<<<< HEAD
            titleStyle={{ color: dynamicColors.text }}
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'asc')}
            title="Sửa đổi: Cũ nhất"
<<<<<<< HEAD
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider style={{ backgroundColor: dynamicColors.border }} />
=======
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'desc')}
            title="Ngày tạo: Mới nhất"
<<<<<<< HEAD
            titleStyle={{ color: dynamicColors.text }}
=======
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
            trailingIcon={sort.field === 'created_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'asc')}
            title="Ngày tạo: Cũ nhất"
<<<<<<< HEAD
            titleStyle={{ color: dynamicColors.text }}
            trailingIcon={sort.field === 'created_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider style={{ backgroundColor: dynamicColors.border }} />
=======
            trailingIcon={sort.field === 'created_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122

          <Menu.Item
            leadingIcon="restore"
            onPress={() => handleSortChange(DEFAULT_SORT.field, DEFAULT_SORT.direction)}
            title="Đặt lại mặc định"
<<<<<<< HEAD
            titleStyle={{ color: dynamicColors.text }}
          />
        </Menu>

        <TouchableOpacity style={styles.iconBtn}>
          <View>
            <Feather name="bell" size={20} color={dynamicColors.textSec} />
=======
          />
        </Menu>

        {/* Notification */}
        <TouchableOpacity style={styles.iconBtn}>
          <View>
            <Feather name="bell" size={20} color={colors.textSecondary} />
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>

<<<<<<< HEAD
=======
        {/* Avatar */}
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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
<<<<<<< HEAD
  selectionActions: { flexDirection: 'row', gap: 10 },
=======
  selectionActions: { flexDirection: 'row', gap: 10 }, // Đã thêm dấu phẩy
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
  topbar: {
    height: 66,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
<<<<<<< HEAD
=======
    //gap: 16,
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
<<<<<<< HEAD
    width: 250,
=======
    width: 250, // Giữ cố định để thanh search không bị nhảy
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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
<<<<<<< HEAD
    width: '100%',
    maxWidth: 800,
=======
    width: '100%', // Dùng width kết hợp maxWidth
    maxWidth: 800, // Độ rộng bạn muốn
>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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
<<<<<<< HEAD
=======


>>>>>>> 07cda75d68652b08f9f3356682296e9ea4400122
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
});