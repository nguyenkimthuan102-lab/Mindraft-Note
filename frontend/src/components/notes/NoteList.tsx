import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
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
  /** Khi true: card hiển thị nút "Bỏ lưu trữ" thay vì "Lưu trữ" */
  isArchived?: boolean;
  /**
   * Khi true (màn Trash): card chỉ hiện 2 nút — Khôi phục & Xóa vĩnh viễn.
   * onArchiveNote = khôi phục, onDeleteNote = xóa vĩnh viễn.
   */
  isTrash?: boolean;
}

export function NoteList({
  notes,
  title,
  onPressNote,
  onUpdateNote,
  onDeleteNote,
  onArchiveNote,
  selectedIds,
  onSelectNote,
  isArchived = false,
  isTrash = false,
}: NoteListProps) {

  const { viewMode, initSettings, sort } = useAppStore();
  const { isSidebarOpen } = useLayoutStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const sortedNotes = useMemo(() => {
    if (sort.field === 'custom') return notes;
    return [...notes].sort((a, b) => {
      const aTime = new Date(a[sort.field] ?? 0).getTime();
      const bTime = new Date(b[sort.field] ?? 0).getTime();
      return sort.direction === 'desc' ? bTime - aTime : aTime - bTime;
    });
  }, [notes, sort]);

  useEffect(() => {
    initSettings();
  }, []);

  const CARD_WIDTH = 256;
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

  if (notes.length === 0) return null;

  const noteIds = notes.map((n: any) => n.id).join(',');

  const renderCard = (item: any, isGrid: boolean) => (
    <NoteCard
      note={item}
      isGridView={isGrid}
      onPress={() => onPressNote(item)}
      onUpdate={onUpdateNote}
      onDelete={onDeleteNote}
      onArchive={onArchiveNote}
      isSelected={selectedIds.includes(item.id)}
      onSelect={() => onSelectNote(item.id)}
      isArchived={isArchived}
      isTrash={isTrash}
    />
  );

  return (
    <View
      style={[
        styles.sectionContainer,
        !isMobile && viewMode === 'grid' && { width: gridWidth, alignSelf: 'center' },
      ]}
    >
      {title ? (
        <View
          style={[
            { paddingHorizontal: isMobile ? 4 : (viewMode === 'list' ? 6 : 8) },
            viewMode === 'list' && styles.listMaxWidth,
          ]}
        >
          <SectionLabel label={title} />
        </View>
      ) : null}

      {viewMode === 'list' ? (
        <StandardFlashList
          data={sortedNotes}
          numColumns={columns}
          key={`list-${title}-${columns}-${sort.field}-${sort.direction}-${noteIds}`}
          estimatedItemSize={200}
          scrollEnabled={false}
          renderItem={({ item }: any) => (
            <View style={[{ padding: isMobile ? 4 : 6 }, styles.listMaxWidth]}>
              {renderCard(item, false)}
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
            <View style={{ padding: isMobile ? 4 : 8 }}>
              {renderCard(item, true)}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: { width: '100%', marginBottom: 20 },
  listMaxWidth: { maxWidth: 700, alignSelf: 'center', width: '100%' },
});