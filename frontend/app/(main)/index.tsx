import { ScrollView, StyleSheet, View } from 'react-native';
import { useState, useEffect } from 'react';
import { NoteCard, NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';

import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';

import { fetchNotes } from '../../src/api/noteApi';


export default function HomeScreen() {
  const { theme, viewMode, isSidebarOpen } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const [notes, setNotes] = useState<NoteCardData[]>([]);
  const {
    editorVisible,
    editorMode,
    editingNote,
    openCreateText: openCreateTextStore,
    openCreateTodo: openCreateTodoStore,
    openEditNote: openEditNoteStore,
    closeEditor: closeEditorStore,
  } = useNoteStore();

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  useEffect(() => {
    clearSelection();
    setSyncing();
    const loadNotes = async () => {
      try {
        // Chỉ lấy note active trên màn Home
        const data = await fetchNotes({ view: 'active' }); 
        setNotes(data);
        setDone(); // Tắt loading
      } catch (error) {
        console.error('Lỗi khi tải danh sách ghi chú:', error);
        setError(); // Xử lý UI báo lỗi
      }
    };
    loadNotes();
  }, []);

  const handleUpdate = (id: string, changes: Partial<NoteCardData>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
  };

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleArchive = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const openCreateText = () => {
    openCreateTextStore();
  };

  const openCreateTodo = () => {
    openCreateTodoStore();
  };

  const openEditNote = (note: NoteCardData) => {
    openEditNoteStore(note);
  };

  const closeEditor = () => {
    closeEditorStore();
  };

  const handleSaveNote = (note: NoteCardData) => {
    setNotes((prev) => {
      const exists = prev.some((item) => item.id === note.id);
      if (exists) {
        return prev.map((item) => (item.id === note.id ? { ...item, ...note } : item));
      }
      return [note, ...prev];
    });
  };

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
          // CẬP NHẬT: Xóa tính toán gridMaxWidth phức tạp đi. 
          // Cho phép vùng chứa mở rộng 100% để bám lề, kích thước thẻ đã được NoteList quản lý.
          // isGrid ? { maxWidth: '100%' } : { maxWidth: 720 }

          // FIX: Grid neo lề trái cố định (alignSelf: flex-start), không giãn theo container.
          // List vẫn căn giữa như cũ (maxWidth: 720, alignSelf: center).
          // Đảm bảo khoảng cách từ sidebar/lề trái không đổi khi sidebar mở/đóng.
          isGrid
            ? { maxWidth: '100%', alignSelf: 'flex-start' }
            : { maxWidth: 720, alignSelf: 'center' }
        ]}>
          <View style={styles.quickCaptureWrapper}>
            <QuickCapture onCreateText={openCreateText} onCreateTodo={openCreateTodo} />
          </View>

          <NoteList
            title="Đã ghim"
            notes={pinned}
            onPressNote={openEditNote}
            onUpdateNote={handleUpdate}
            onDeleteNote={handleDelete}
            onArchiveNote={handleArchive}
            selectedIds={selectedIds}
            onSelectNote={toggleSelect}
          />

          <NoteList
            title="Khác"
            notes={others}
            onPressNote={openEditNote}
            onUpdateNote={handleUpdate}
            onDeleteNote={handleDelete}
            onArchiveNote={handleArchive}
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
        onSave={handleSaveNote}
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