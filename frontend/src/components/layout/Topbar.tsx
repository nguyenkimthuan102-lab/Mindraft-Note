import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

export const Topbar = () => {
  return (
    <View style={styles.topbar}>
      {/* Thanh tìm kiếm */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.grayText} />
        <TextInput 
          placeholder="Search notes..." 
          style={styles.searchInput}
          placeholderTextColor={colors.grayText}
        />
      </View>

      {/* Các nút chức năng bên phải */}
      <View style={styles.rightIcons}>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="notifications-outline" size={22} color={colors.grayText} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.profileBtn}>
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person" size={16} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topbar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.grayBorder,
  },
  searchContainer: {
    flex: 1,
    maxWidth: 600,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgPage,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: colors.black,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
  },
  iconBtn: {
    padding: 8,
  },
  profileBtn: {
    marginLeft: 12,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});