import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { colors } from '../../constants/colors';

interface TopbarProps {
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}

export function Topbar({ viewMode = 'list', onViewModeChange }: TopbarProps) {
  const [search, setSearch] = useState('');

  return (
    <View style={styles.topbar}>
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
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    backgroundColor: colors.bgSurface,
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 38,
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