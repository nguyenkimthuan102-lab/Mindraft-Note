import { ScrollView, StyleSheet, View, Alert, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';

import { fetchNotes, createNoteText, createNoteTodo, updateNote, trashNote, toggleArchiveNote, togglePinNote } from '../../src/api/noteApi';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const { theme, viewMode } = useAppStore();
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

  const stripHtml = (html: string): string =>
    html
      .replace(/<div><br\s*\/?><\/div>/gi, '\n') // dòng trống
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<div>/gi, '\n')   // ← thêm: mở div = xuống dòng
      .replace(/<\/div>/gi, '')   // đóng div = bỏ (đã xử lý bởi dòng trên)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/^\n/, '')         // bỏ \n thừa ở đầu nếu html bắt đầu bằng <div>
      .replace(/\n{3,}/g, '\n\n')
      .trim();

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

  const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
    // Cập nhật UI ngay lập tức (optimistic update)
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));

    try {
      await updateNote(id, changes);
    } catch {
      // Nếu API lỗi, rollback lại state cũ
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...Object.fromEntries(Object.keys(changes).map(k => [k, n[k as keyof NoteCardData]])) } : n));
      Alert.alert("Lỗi", "Không thể cập nhật ghi chú. Vui lòng thử lại.");
    }
  };

  const handleTogglePin = async (id: string) => {

    // optimistic update
    setNotes(prev =>
      prev.map(n =>
        n.id === id
          ? {
            ...n,
            is_pinned: n.is_pinned ? 0 : 1
          }
          : n
      )
    );

    try {

      await togglePinNote(id);

    } catch {

      // rollback
      setNotes(prev =>
        prev.map(n =>
          n.id === id
            ? {
              ...n,
              is_pinned: n.is_pinned ? 0 : 1
            }
            : n
        )
      );

      Alert.alert(
        "Lỗi",
        "Không thể ghim ghi chú"
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await trashNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      Alert.alert("Lỗi", "Không thể xóa ghi chú. Vui lòng thử lại.");
    }
  };

  const handleArchive = async (id: string) => {
    // Optimistic: xóa khỏi UI ngay
    const noteToRestore = notes.find(n => n.id === id);
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      await toggleArchiveNote(id);
    } catch {
      // Rollback: lấy lại note nếu API lỗi
      setNotes(prev => noteToRestore ? [noteToRestore, ...prev] : prev);
      Alert.alert("Lỗi", "Không thể lưu trữ ghi chú. Vui lòng thử lại.");
    }
  };

  const openCreateText = async () => {
    const tempNote: NoteCardData = {
      id: `temp-${Date.now()}`, // ID tạm để React quản lý component
      type: 'text',
      title: '',
      content_text: '',
      color: 'default',
      // Khởi tạo các giá trị mặc định khác nếu cần
    };
    openEditNoteStore(tempNote);
  };

  const openCreateTodo = async () => {
    const tempNote: NoteCardData = {
      id: `temp-${Date.now()}`,
      type: 'todo',
      title: '',
      todo_items: [],
      color: 'default',
    };
    openEditNoteStore(tempNote);
  };

  const openEditNote = (note: NoteCardData) => {
    openEditNoteStore(note);
  };

  const closeEditor = () => {
    closeEditorStore();
  };

  const handleSaveNote = async (note: NoteCardData) => {
    // Làm sạch HTML trước
    const cleanNote: NoteCardData = {
      ...note,
      content_text: note.content_text ? stripHtml(note.content_text) : '',
    };

    // Dùng cleanNote (đã stripped) để check rỗng, tránh '<br>' bị coi là có nội dung
    const isContentEmpty =
      (!cleanNote.title || cleanNote.title.trim() === '') &&
      (!cleanNote.content_text || cleanNote.content_text.trim() === '') &&
      (!cleanNote.todo_items || cleanNote.todo_items.length === 0);

    if (isContentEmpty) {
      if (note.id.startsWith('temp-')) {
        closeEditorStore();
        return;
      }
      // existing note: falls through to save với content rỗng
    }

    const isNewNote = note.id.startsWith('temp-');

    try {
      if (isNewNote) {
        // POST: Gọi API tạo note đúng theo type
        const createdNote = cleanNote.type === 'text'
          ? await createNoteText(cleanNote)
          : await createNoteTodo(cleanNote);
        setNotes(prev => [createdNote, ...prev.filter(n => n.id !== note.id)]);
      } else {
        const oldNote = notes.find(
          n => n.id === note.id
        );

        // Gọi API pin nếu trạng thái pin đổi
        if (
          oldNote &&
          oldNote.is_pinned !== cleanNote.is_pinned
        ) {
          await togglePinNote(cleanNote.id);
        }


        // PATCH: Gọi API update
        const updatedNote = await updateNote(cleanNote.id, cleanNote);
        setNotes(prev => prev.map(n => n.id === cleanNote.id ? updatedNote : n));
      }
      closeEditorStore();
    } catch (error) {
      Alert.alert("Lỗi", "Không thể lưu ghi chú. Vui lòng thử lại.");
    }
  };

  const pinned = notes.filter(n => n.is_pinned);
  const others = notes.filter(n => !n.is_pinned);

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isGrid = viewMode === 'grid';

  return (
    <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
      <ScrollView
        style={[styles.scroll, { backgroundColor: dynamicBg }]}
        contentContainerStyle={[
          styles.container,
          isMobile && {
            paddingHorizontal: 8,
            paddingVertical: 12,
            paddingBottom: 96 + insets.bottom,
          }
        ]}
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
          {!isMobile && (
            <View style={styles.quickCaptureWrapper}>
              <QuickCapture onCreateText={openCreateText} onCreateTodo={openCreateTodo} />
            </View>
          )}

          <View style={{ position: 'relative' }}>
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
          </View>

          <View style={{ position: 'relative' }}>
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
        </View>
      </ScrollView>

      <NoteEditor
        visible={editorVisible}
        mode={editorMode}
        note={editingNote}
        onClose={closeEditor}
        onSave={handleSaveNote}
      />

      <FloatingActionButton
        onCreateText={openCreateText}
        onCreateTodo={openCreateTodo}
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
