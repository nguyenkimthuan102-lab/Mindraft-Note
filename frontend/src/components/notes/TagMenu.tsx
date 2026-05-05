import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface TagMenuProps {
  noteTags: string[];
  allTags: string[];
  onToggleTag: (tag: string) => void;
  onCreateTag: (tag: string) => void;
}

export function TagMenu({ noteTags, allTags, onToggleTag, onCreateTag }: TagMenuProps) {
  const [search, setSearch] = useState('');

  const filteredTags = useMemo(() => 
    allTags.filter(t => t.toLowerCase().includes(search.toLowerCase())),
    [search, allTags]
  );

  const showCreateOption = search.trim().length > 0 && !allTags.includes(search.trim());

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ghi chú nhãn</Text>
      <View style={styles.searchRow}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Nhập tên nhãn"
          style={styles.input}
          autoFocus
          onSubmitEditing={() => {
            if (showCreateOption) {
              onCreateTag(search.trim());
              setSearch('');
            }
          }}
        />
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
      </View>

      <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
        {filteredTags.map((tag) => (
          <TouchableOpacity key={tag} style={styles.tagItem} onPress={() => onToggleTag(tag)}>
            <MaterialCommunityIcons 
              name={noteTags.includes(tag) ? "checkbox-marked" : "checkbox-blank-outline"} 
              size={20} color={colors.textSecondary} 
            />
            <Text style={styles.tagText}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {showCreateOption && (
        <TouchableOpacity 
          style={styles.createBtn} 
          onPress={() => { onCreateTag(search.trim()); setSearch(''); }}
        >
          <MaterialCommunityIcons name="plus" size={20} color={colors.textSecondary} />
          <Text style={styles.createText}>Tạo "{search.trim()}"</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', borderRadius: 8, width: 220, paddingVertical: 8, elevation: 5,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 14, paddingHorizontal: 16, paddingVertical: 8, color: colors.textPrimary, fontWeight: '500' },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  input: { flex: 1, fontSize: 13, height: 35, outlineStyle: 'none' } as any,
  list: { maxHeight: 180 },
  tagItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  tagText: { fontSize: 13, color: colors.textSecondary },
  createBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: '#eee', gap: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }) },
  createText: { fontSize: 13, fontWeight: '600' },
});