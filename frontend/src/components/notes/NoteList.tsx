import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { NoteCard } from './NoteCard';
import { SectionLabel } from '../ui/SectionLabel';

// @ts-ignore
import * as FlashListModule from "@shopify/flash-list";

const MasonryFlashList = FlashListModule.MasonryFlashList || FlashListModule.FlashList;

interface NoteListProps {
  notes: any[];
  title?: string;
  onPressNote: (note: any) => void;
  onUpdateNote: (id: string, changes: any) => void;
  onDeleteNote: (id: string) => void;
  onArchiveNote: (id: string) => void;
  selectedIds: string[];
  onSelectNote: (id: string) => void;
}

export function NoteList({ notes, title, onPressNote, onUpdateNote, onDeleteNote, onArchiveNote, selectedIds, onSelectNote }: NoteListProps) {

  const { viewMode, isSidebarOpen, initSettings, sort } = useAppStore();

const sortedNotes = useMemo(() => {
  if (sort.field === 'custom') {
    return notes; 
  }
  const dir = sort.direction === 'desc' ? -1 : 1;
  return [...notes].sort((a, b) => {
    const aTime = new Date(a[sort.field] ?? 0).getTime();
    const bTime = new Date(b[sort.field] ?? 0).getTime();
    return sort.direction === 'desc' ? bTime - aTime : aTime - bTime;
  });
}, [notes, sort]);

  useEffect(() => {
    initSettings(); // Lấy settings từ server khi mount màn hình
  }, []);

  // Tính toán số cột cho Desktop
  const columns = viewMode === 'list' ? 1 : (isSidebarOpen ? 4 : 5);

  if (notes.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {title && <SectionLabel label={title} />}
      <MasonryFlashList
        data={notes}
        numColumns={columns}
        // KEY QUAN TRỌNG: Phải thay đổi khi columns hoặc title đổi để ép render lại
        key={`list-${title}-${columns}-${sort.field}-${sort.direction}`}
        estimatedItemSize={200}
        scrollEnabled={false} // Quan trọng: Để ScrollView của index.tsx quản lý việc cuộn
        renderItem={({ item }) => (
          <View style={[
            styles.cardWrapper,
            viewMode === 'list' && styles.listMaxWidth
          ]}>
            <NoteCard
              note={item}
              isGridView={viewMode === 'grid'}
              onPress={() => onPressNote(item)}
              onUpdate={onUpdateNote}
              onDelete={onDeleteNote}
              onArchive={onArchiveNote}
              isSelected={selectedIds.includes(item.id)}
              onSelect={() => onSelectNote(item.id)}
            />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { width: '100%', marginBottom: 20 },
  cardWrapper: { padding: 8 },
  listMaxWidth: { maxWidth: 700, alignSelf: 'center', width: '100%' },
});