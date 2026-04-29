import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { colors } from '../../constants/colors';
import { useLayoutStore } from '../../store/useLayoutStore';
import { useSyncStore } from '../../store/useSyncStore';
import { SyncIndicator } from '../ui/SyncIndicator';

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

const logoIcon = require('../../../assets/images/icon.png');

export function Topbar({ viewMode = 'list', onViewModeChange }: TopbarProps) {
  const [search, setSearch] = useState('');
  const { toggleSidebar } = useLayoutStore();
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '/(main)';
  const isSettings = pathname.includes('settings');
  const router = useRouter();
  const { status: syncStatus } = useSyncStore();

  const getAreaTitle = () => {
    if (isHome) return 'Mindraft Note';
    if (pathname.includes('trash')) return 'Trash';
    if (pathname.includes('archive')) return 'Archive';
    if (pathname.includes('reminders')) return 'Reminders';
    if (pathname.includes('tag')) return pathname.split('/').pop()?.toUpperCase();
    return 'Mindraft Note';
  };

  if (isSettings) return null; // Hoặc render một Topbar tối giản cho Setting

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
          style={[styles.iconBtn, viewMode === 'list' && styles.iconBtnActive]}
          onPress={() => onViewModeChange?.('list')}
        >
          <Feather name="list" size={18} color={viewMode === 'list' ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, viewMode === 'grid' && styles.iconBtnActive]}
          onPress={() => onViewModeChange?.('grid')}
        >
          <Feather name="grid" size={18} color={viewMode === 'grid' ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>

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
});