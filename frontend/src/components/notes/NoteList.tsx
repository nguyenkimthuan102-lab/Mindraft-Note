import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useAppStore } from '../../store/useAppStore';
import { useLayoutStore } from '../../store/useLayoutStore';
import { NoteCard } from './NoteCard';
import { SectionLabel } from '../ui/SectionLabel';

// @ts-ignore
import * as FlashListModule from "@shopify/flash-list";

const MasonryFlashList = FlashListModule.MasonryFlashList || FlashListModule.FlashList;
const StandardFlashList = FlashListModule.FlashList;

interface NoteListProps {
  notes: any[];
  title?: string;
  onPressNote: (note: any) => void;
  onUpdateNote: (id: string, changes: any) => void;
  onDeleteNote: (id: string) => void;
  onArchiveNote: (id: string) => void;
  selectedIds: string[];
  onSelectNote: (id: string) => void;
  // THÊM: tuỳ chỉnh nhãn nút archive cho từng màn hình
  archiveLabel?: string;
  archiveIcon?: string;
}

export function NoteList({ notes, title, onPressNote, onUpdateNote, onDeleteNote, onArchiveNote, selectedIds, onSelectNote, archiveLabel, archiveIcon }: NoteListProps) {

  const { viewMode, initSettings, sort } = useAppStore();
  const { isSidebarOpen } = useLayoutStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const sortedNotes = useMemo(() => {
    if (sort.field === 'custom') {
      return notes;
    }
    return [...notes].sort((a, b) => {
      const aTime = new Date(a[sort.field] ?? 0).getTime();
      const bTime = new Date(b[sort.field] ?? 0).getTime();
      return sort.direction === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [notes, sort]);

  useEffect(() => {
    initSettings(); // Lấy settings từ server khi mount màn hình
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tính toán số cột
  const CARD_WIDTH = 256; // 240px card + 16px padding
  const availableWidth = width - (!isMobile && isSidebarOpen ? 250 : 0) - 32;

  let columns = 1;
  let gridWidth: number | '100%' = '100%';

  if (isMobile) {
    columns = viewMode === 'list' ? 1 : 2;
  } else {
    if (viewMode === 'list') {
      columns = 1;
    } else {
      columns = Math.max(1, Math.floor(availableWidth / CARD_WIDTH));
      gridWidth = columns * CARD_WIDTH;
    }
  }

  const isListMode = viewMode === 'list';

  if (sortedNotes.length === 0) return null;

  // FIX DUPLICATE: Them note IDs vao key buoc FlashList re-render
  // khi danh sach thay doi do pin/unpin, delete, archive.
  const noteIds = sortedNotes.map((n: any) => n.id).join(',');

  return (
    <View style={[styles.sectionContainer, !isMobile && !isListMode && { width: gridWidth, alignSelf: 'center' }]}>
      {title && (
        <View style={[
          { paddingHorizontal: isMobile ? 4 : (!isListMode ? 6 : 8) },
          isListMode && styles.listMaxWidth
        ]}>
          <SectionLabel label={title} />
        </View>
      )}
      {isListMode ? (
        <StandardFlashList
          data={sortedNotes}
          numColumns={columns}
          key={`list-${title}-${columns}-${sort.field}-${sort.direction}-${noteIds}`}
          estimatedItemSize={200}
          scrollEnabled={false}
          renderItem={({ item }: any) => (
            <View style={[
              { paddingHorizontal: isMobile ? 4 : 6, paddingTop: 12, paddingBottom: isMobile ? 2 : 3, overflow: 'visible' },
              styles.listMaxWidth
            ]}>
              <NoteCard
                note={item}
                isGridView={false}
                onPress={() => onPressNote(item)}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
                onArchive={onArchiveNote}
                isSelected={selectedIds.includes(item.id)}
                onSelect={() => onSelectNote(item.id)}
                archiveLabel={archiveLabel}
                archiveIcon={archiveIcon}
              />
            </View>
          )}
        />
      ) : (
        <MasonryFlashList
          data={sortedNotes}
          numColumns={columns}
          key={`grid-${title}-${columns}-${sort.field}-${sort.direction}-${noteIds}`}
          estimatedItemSize={200}
          scrollEnabled={false}
          renderItem={({ item }: any) => (
            <View style={{ paddingHorizontal: isMobile ? 4 : 5, paddingTop: 12, paddingBottom: isMobile ? 2 : 3, overflow: 'visible' }}>
              <NoteCard
                note={item}
                isGridView={true}
                onPress={() => onPressNote(item)}
                onUpdate={onUpdateNote}
                onDelete={onDeleteNote}
                onArchive={onArchiveNote}
                isSelected={selectedIds.includes(item.id)}
                onSelect={() => onSelectNote(item.id)}
                archiveLabel={archiveLabel}
                archiveIcon={archiveIcon}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    width: '100%',
    marginBottom: 20,
    position: 'relative',
    ...Platform.select({ web: { zIndex: 0 } as any }),
  },
  listMaxWidth: { maxWidth: 700, alignSelf: 'center', width: '100%' },
});