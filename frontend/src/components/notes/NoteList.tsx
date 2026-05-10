import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNoteStore } from '../../store/useNoteStore'; // Sử dụng store chúng ta vừa cập nhật
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

export function NoteList({ 
  notes, 
  title, 
  onPressNote, 
  onUpdateNote, 
  onDeleteNote, 
  onArchiveNote, 
  selectedIds, 
  onSelectNote 
}: NoteListProps) {

  // Lấy các state từ useNoteStore đã bổ sung
  const { viewMode, sortBy } = useNoteStore();
  
  // Giả định isSidebarOpen nằm ở một store quản lý UI chung hoặc layout, 
  // nếu chưa có bạn có thể tạm thời để fix cứng hoặc bổ sung vào store sau.
  const isSidebarOpen = true; 

  const sortedNotes = useMemo(() => {
    if (sortBy === 'custom') {
      return notes; 
    }

    // Map giá trị từ store sang field dữ liệu thực tế
    const fieldMap: Record<string, string> = {
      updated: 'updatedAt', // hoặc 'updated' tùy data backend
      created: 'createdAt'
    };
    
    const targetField = fieldMap[sortBy] || 'updatedAt';

    return [...notes].sort((a, b) => {
      const aTime = new Date(a[targetField] ?? 0).getTime();
      const bTime = new Date(b[targetField] ?? 0).getTime();
      // Mặc định sắp xếp mới nhất lên đầu (desc) như thiết kế Cài đặt
      return bTime - aTime;
    });
  }, [notes, sortBy]);

  // Tính toán số cột dựa trên viewMode từ Store
  // viewMode === 'list' -> 1 cột
  // viewMode === 'grid' -> 4 hoặc 5 cột tùy sidebar
  const columns = viewMode === 'list' ? 1 : (isSidebarOpen ? 4 : 5);

  if (notes.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {title && <SectionLabel label={title} />}
      <MasonryFlashList
        data={sortedNotes}
        numColumns={columns}
        // Ép render lại khi thay đổi chế độ xem hoặc kiểu sắp xếp
        key={`list-${title}-${columns}-${sortBy}`}
        estimatedItemSize={200}
        scrollEnabled={false} 
        renderItem={({ item }: { item: any }) => (
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