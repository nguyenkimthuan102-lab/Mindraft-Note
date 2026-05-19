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

const MOCK_NOTES: NoteCardData[] = [
  {
    id: '1',
    type: 'text',
    color: 'yellow',
    title: 'Ghi chú...',
    content_text: 'CA Grow\n\nThứ hai, 18:00\n\nLocation: Offline. Similar team leads for each initiative before end of month.',
    is_pinned: true,
    tags: ['work', 'planning'],
    collaborators: [{ name: 'Alice' }, { name: 'Bob' }],
  },
  {
    id: '2',
    type: 'todo',
    color: 'default',
    title: 'Shopping List',
    is_pinned: true,
    tags: ['personal'],
    date: '25/4/2026',
    todo_items: [
      { id: 't1', title: 'Milk & eggs', is_completed: false },
      { id: 't2', title: 'Bread', is_completed: false },
      { id: 't3', title: 'Coffee beans', is_completed: false },
      { id: 't4', title: 'Butter', is_completed: false },
      { id: 't5', title: 'Orange juice', is_completed: true },
      { id: 't6', title: 'Yogurt', is_completed: true },
    ],
    todo_total: 6,
    todo_completed: 2,
  },
  {
    id: '3',
    type: 'text',
    color: 'blue',
    title: 'Project Ideas',
    content_text: 'Some thoughts on the upcoming Q3 product roadmap and feature prioritization.',
    tags: ['work', 'ideas'],
  },
  {
    id: '4',
    type: 'todo',
    color: 'green',
    title: 'Weekly Tasks',
    tags: ['personal'],
    date: '28/4/2026',
    todo_items: [
      { id: 'w1', title: 'Review PR #42', is_completed: true },
      { id: 'w2', title: 'Update documentation', is_completed: false },
      { id: 'w3', title: 'Team sync meeting', is_completed: false },
    ],
    todo_total: 3,
    todo_completed: 1,
  },
  {
    id: '5',
    type: 'text',
    color: 'purple',
    title: 'YOLOv8 License Plate',
    content_text: 'Cần review lại dataset trên Roboflow cho chuẩn.\n\nChạy thử pipeline train khoảng 50 epochs xem model nhận diện các biển số bị mờ ở góc có tốt hơn không. Nhớ check kỹ phần Confusion Matrix.',
    tags: ['project', 'machine-learning'],
  },
  {
    id: '6',
    type: 'todo',
    color: 'red',
    title: 'Kế hoạch học tập',
    is_pinned: true,
    tags: ['academic', 'huce'],
    date: '20/5/2026',
    todo_items: [
      { id: 'k1', title: 'Đăng ký học các môn mới', is_completed: false },
      { id: 'k2', title: 'Ôn tập thuật toán Apriori & K-means', is_completed: true },
      { id: 'k3', title: 'Cấu hình lại 3-node Hadoop cluster', is_completed: true },
      { id: 'k4', title: 'Push code Mindraft Note lên GitHub', is_completed: false },
    ],
    todo_total: 4,
    todo_completed: 2,
  },
];

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
    const load = async () => {
      try {
        await new Promise(res => setTimeout(res, 1000));
        setNotes(MOCK_NOTES);
        setDone();
      } catch {
        setError();
      }
    };
    load();
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