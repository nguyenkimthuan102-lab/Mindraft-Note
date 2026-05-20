import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';

import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';

export default function HomeScreen() {
  const { theme, viewMode } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  
  // 1. Móc nối trực tiếp toàn bộ dữ liệu và hàm xử lý chuẩn từ useNoteStore
  const { 
    notes, 
    loadNotes, 
    togglePin, 
    archiveNote, 
    trashNote, 
    quickUpdate,
    editorVisible,
    editorMode,
    editingNote,
    openCreateText,
    openCreateTodo,
    openEditNote,
    closeEditor
  } = useNoteStore();

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  // 2. Tự động kích hoạt gọi API của Store khi vừa mở App
  useEffect(() => {
    clearSelection();
    setSyncing();
    
    loadNotes({ view: 'active' })
      .then(() => setDone())
      .catch((error) => {
        console.error('Lỗi khi tải danh sách ghi chú từ Store:', error);
        setError();
      });
  }, []);

  // 3. Phân loại Note Đã ghim / Khác trực tiếp từ Store dữ liệu chung
  const pinned = notes.filter(n => n.is_pinned);
  const others = notes.filter(n => !n.is_pinned);

  const isGrid = viewMode === 'grid';

  return (
    <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: dynamicBg }]}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.inner,
          isGrid
            ? { maxWidth: '100%', alignSelf: 'flex-start' }
            : { maxWidth: 720, alignSelf: 'center' }
        ]}>
          <View style={styles.quickCaptureWrapper}>
            <QuickCapture onCreateText={openCreateText} onCreateTodo={openCreateTodo} />
          </View>

          {/* 4. Đút thẳng các hàm hành động của Store xuống NoteList trung gian */}
          <NoteList
            title="Đã ghim"
            notes={pinned}
            onPressNote={openEditNote}
            onUpdateNote={quickUpdate}
            onDeleteNote={trashNote}
            onArchiveNote={archiveNote}
            onPinNote={togglePin}
            onTrashNote={trashNote}
            selectedIds={selectedIds}
            onSelectNote={toggleSelect}
          />

          <NoteList
            title="Khác"
            notes={others}
            onPressNote={openEditNote}
            onUpdateNote={quickUpdate}
            onDeleteNote={trashNote}
            onArchiveNote={archiveNote}
            onPinNote={togglePin}
            onTrashNote={trashNote}
            selectedIds={selectedIds}
            onSelectNote={toggleSelect}
          />
        </View>
      </ScrollView>

      <NoteEditor
        visible={editorVisible}
        mode={editorMode}
        note={editingNote}
        onClose={closeEditor}
        onSave={() => {
          // Khi lưu thành công từ Editor, ra lệnh cho Store kéo lại danh sách mới
          loadNotes({ view: 'active' });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.bgPage,
  },
  container: {
    flexGrow: 1,
    paddingVertical: 24,
    paddingHorizontal: 30,
  },
  inner: {
    width: '100%',
  },
  quickCaptureWrapper: {
    width: '100%',
    maxWidth: 720,
    marginBottom: 30,
    alignSelf: 'center',
  },
});