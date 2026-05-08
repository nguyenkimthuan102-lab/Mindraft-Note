import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { NoteCard, NoteCardData } from './NoteCard';
import { colors } from '../../constants/colors';

interface NoteListProps {
  title: string;
  notes: NoteCardData[];
  viewMode?: 'grid' | 'list';
  onPressNote: (note: NoteCardData) => void;
  onUpdateNote?: (id: string, changes: Partial<NoteCardData>) => void;
  onDeleteNote?: (id: string) => void;
  onArchiveNote?: (id: string) => void;
  selectedIds?: string[];
  onSelectNote?: (id: string) => void;
}

export const NoteList = ({ 
  title, 
  notes, 
  viewMode = 'grid', 
  onPressNote,
  ...props 
}: NoteListProps) => {
  return (
    <View style={styles.container}>
      {title ? <Text style={styles.listTitle}>{title}</Text> : null}
      
      <FlatList
        data={notes}
        // Đổi key để FlatList reset lại layout khi chuyển Lưới/Danh sách
        key={viewMode} 
        numColumns={viewMode === 'grid' ? 2 : 1}
        keyExtractor={(item) => item.id}
        scrollEnabled={false} 
        renderItem={({ item }) => (
          <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
            <NoteCard 
              note={item} 
              onPress={() => onPressNote(item)}
              // ✅ Dùng 'as any' để tránh lỗi truyền nhầm viewMode vào NoteCard
              {...(props as any)} 
            />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: '100%', marginBottom: 20 },
  listTitle: { 
    fontSize: 13, 
    fontWeight: '700', 
    color: colors.grayText, 
    marginBottom: 12, 
    marginLeft: 8, 
    textTransform: 'uppercase' 
  },
  gridItem: { flex: 0.5, padding: 6 },
  listItem: { flex: 1, paddingVertical: 4, paddingHorizontal: 6 },
});