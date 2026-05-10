import { Feather } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, LayoutAnimation, } from 'react-native';
import { Icon, Menu, Divider } from 'react-native-paper';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useSyncStore } from '../../store/useSyncStore';
import { SyncIndicator } from '../ui/SyncIndicator';
import { useSelectionStore } from '../../store/useSelectionStore'; // Import store
import { useAppStore, DEFAULT_SORT } from '../../store/useAppStore';

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const logoIcon = require('../../../assets/images/icon.png');

function ActionBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.iconBtn}>
      <Icon source={icon} size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function Topbar({ onViewModeChange }: TopbarProps) {
  const { sort, setSort } = useAppStore();
  const [menuVisible, setMenuVisible] = useState(false); // State cho dropdown
  //const [sortVisible, setSortVisible] = useState(false);
  const isSortActive = sort.field !== DEFAULT_SORT.field || sort.direction !== DEFAULT_SORT.direction;

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const [search, setSearch] = useState('');
  const { toggleSidebar } = useLayoutStore();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(main)';
  const router = useRouter();
  const { status: syncStatus } = useSyncStore();
  const { viewMode, setViewMode } = useAppStore();

  // Tự động lấy trạng thái từ Store
  const { selectedIds, clearSelection } = useSelectionStore();
  const selectedCount = selectedIds.length;

  const handleSortChange = (field: any, direction: any) => {
    setSort({ field, direction });
    closeMenu();
  };

  const handleToggle = () => {
    // 1. Xác định chế độ tiếp theo
    const nextMode = viewMode === 'list' ? 'grid' : 'list';

    // 2. Chỉ chạy LayoutAnimation trên Mobile (Web hỗ trợ kém)
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    // 3. Cập nhật State
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
        </View>
      </View>
    );
  }

  return (
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
              <Text style={styles.brandText}>Mindraft Note</Text>
            </>
          ) : (
            <Text style={styles.areaTitle}>{getAreaTitle()}</Text>
          )}
        </TouchableOpacity>
      </View>

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
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity
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

          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'desc')}
            title="Sửa đổi: Mới nhất"
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="update"
            onPress={() => handleSortChange('updated_at', 'asc')}
            title="Sửa đổi: Cũ nhất"
            trailingIcon={sort.field === 'updated_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider />

          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'desc')}
            title="Ngày tạo: Mới nhất"
            trailingIcon={sort.field === 'created_at' && sort.direction === 'desc' ? "check" : undefined}
          />
          <Menu.Item
            leadingIcon="calendar-plus"
            onPress={() => handleSortChange('created_at', 'asc')}
            title="Ngày tạo: Cũ nhất"
            trailingIcon={sort.field === 'created_at' && sort.direction === 'asc' ? "check" : undefined}
          />

          <Divider />

          <Menu.Item
            leadingIcon="restore"
            onPress={() => handleSortChange(DEFAULT_SORT.field, DEFAULT_SORT.direction)}
            title="Đặt lại mặc định"
          />
        </Menu>

        {/* Notification */}
        <TouchableOpacity style={styles.iconBtn}>
          <View>
            <Feather name="bell" size={20} color={colors.textSecondary} />
            <View style={styles.notifDot} />
          </View>
        </TouchableOpacity>

        {/* Avatar */}
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
  selectionActions: { flexDirection: 'row', gap: 10 }, // Đã thêm dấu phẩy
  topbar: {
    height: 66,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    //gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 250, // Giữ cố định để thanh search không bị nhảy
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
    width: '100%', // Dùng width kết hợp maxWidth
    maxWidth: 800, // Độ rộng bạn muốn
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
});