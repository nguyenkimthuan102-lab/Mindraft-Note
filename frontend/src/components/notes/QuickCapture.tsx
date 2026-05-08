import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useNoteStore } from '../../store/useNoteStore';

export const QuickCapture = () => {
  const { openCreateText, openCreateTodo } = useNoteStore();

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput 
          placeholder="Take a quick note..."
          style={styles.input}
          placeholderTextColor={colors.grayText}
        />
        <View style={styles.actionIcons}>
          <TouchableOpacity onPress={openCreateTodo} style={styles.iconBtn}>
            <Ionicons name="checkbox-outline" size={20} color={colors.grayText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="image-outline" size={20} color={colors.grayText} />
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity onPress={openCreateText} style={styles.plusBtn}>
        <Ionicons name="add" size={26} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    height: 48,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.grayBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.black,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  plusBtn: {
    width: 48,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2, // Tạo bóng đổ nhẹ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }
});