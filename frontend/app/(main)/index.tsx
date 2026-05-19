import { ScrollView, StyleSheet, View, useWindowDimensions, TouchableOpacity, Text } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { NoteCard, NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';

import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore'; // Import store
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
];

export default function HomeScreen() {
  // THÊM: Lấy theme từ useAppStore
  const { theme } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const [notes, setNotes] = useState<NoteCardData[]>([]);
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
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

  // THÊM: Xác định màu sắc động
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

  useEffect(() => {
    useSelectionStore.getState().setHandlers({
      batchUpdate: (changes) => {
        const ids = useSelectionStore.getState().selectedIds;
        setNotes(prev => prev.map(n => ids.includes(n.id) ? { ...n, ...changes } : n));
        clearSelection();
      },
      batchDelete: () => {
        const ids = useSelectionStore.getState().selectedIds;
        setNotes(prev => prev.filter(n => !ids.includes(n.id)));
        clearSelection();
      },
      batchArchive: () => {
        const ids = useSelectionStore.getState().selectedIds;
        setNotes(prev => prev.filter(n => !ids.includes(n.id)));
        clearSelection(); // Should probably clear selection after archiving too
      }
    });
  }, []);

  const handleDelete = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  const handleArchive = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    // TODO: apiRequest(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify({ is_archived: true }) })
  };

  const openCreateText = () => {
    openCreateTextStore();
  };

  const openCreateTodo = () => {
    openCreateTodoStore();
  };

  const openEditNote = (note: NoteCardData) => {
    if (selectedIds.length > 0) {
      toggleSelect(note.id);
    } else {
      openEditNoteStore(note);
    }
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

  return (
    // THÊM: Style mảng để gán màu nền động
    <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
      <ScrollView
        // THÊM: Style mảng để gán màu nền động
        style={[styles.scroll, { backgroundColor: dynamicBg }]}
        contentContainerStyle={[
          styles.container,
          isMobile && { paddingTop: 12, paddingHorizontal: 8, paddingBottom: 100 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {!isMobile && (
            <View style={{ maxWidth: 700, width: '100%', alignSelf: 'center', marginBottom: 24 }}>
              <QuickCapture onCreateText={openCreateText} onCreateTodo={openCreateTodo} />
            </View>
          )}

          {/* 2. Thay thế render cũ bằng NoteList mới - THÊM: truyền viewMode */}
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

      {isMobile && (
        <>
          {fabMenuVisible && (
            <>
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={() => setFabMenuVisible(false)}
              />
              <View style={[styles.fabMenu, isDark && { backgroundColor: '#1F2937' }]}>
                <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabMenuVisible(false); openCreateTodo(); }}>
                  <Icon source="checkbox-marked-outline" size={20} color={isDark ? '#F9FAFB' : colors.textPrimary} />
                  <Text style={[styles.fabMenuText, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>Danh sách việc cần làm</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabMenuVisible(false); openCreateText(); }}>
                  <Icon source="text-box-outline" size={20} color={isDark ? '#F9FAFB' : colors.textPrimary} />
                  <Text style={[styles.fabMenuText, { color: isDark ? '#F9FAFB' : colors.textPrimary }]}>Văn bản</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary }]}
            onPress={() => setFabMenuVisible(!fabMenuVisible)}
            activeOpacity={0.8}
          >
            <Icon source={fabMenuVisible ? "close" : "plus"} size={28} color="#FFF" />
          </TouchableOpacity>
        </>
      )}
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
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    //width: '100%',
  },
  inner: {
    width: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabMenu: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    paddingVertical: 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minWidth: 180,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  fabMenuText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
  },
});