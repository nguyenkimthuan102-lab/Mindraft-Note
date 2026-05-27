/**
 * app/(main)/label/[id].tsx
 * Màn hình hiển thị notes được lọc theo label — Google Keep style
 * Route: /(main)/label/:id
 */
import { ScrollView, StyleSheet, View, Alert, useWindowDimensions, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';

import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { NoteList } from '../../src/components/notes/NoteList';
import { colors } from '../../src/constants/colors';
import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import {
  fetchNotes, createNoteText, createNoteTodo,
  updateNote, trashNote, toggleArchiveNote, togglePinNote,
} from '../../src/api/noteApi';

export default function LabelScreen() {
  // ── Lấy tag id từ route params ──────────────────────────────────────────────
  const { id: tagId } = useLocalSearchParams<{ id: string }>();

  // ── Store ───────────────────────────────────────────────────────────────────
  const { theme, viewMode, tags } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();
  const {
    editorVisible, editorMode, editingNote,
    openEditNote: openEditNoteStore, closeEditor: closeEditorStore,
  } = useNoteStore();

  const [notes, setNotes] = useState<NoteCardData[]>([]);

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  // Tên label hiện tại để hiển thị (lấy từ store)
  const currentTag = tags.find(t => t.id === tagId);

  // ── Load notes theo tag_id ──────────────────────────────────────────────────
  useEffect(() => {
    if (!tagId) return;
    clearSelection();
    setSyncing();
    const load = async () => {
      try {
        // API Contract 3.1: GET /notes?view=active&tag_id=uuid
        const data = await fetchNotes({ view: 'active', tag_id: tagId });
        setNotes(data);
        setDone();
      } catch (err) {
        console.error('Lỗi khi lọc note theo nhãn:', err);
        setError();
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagId]);

  // ── Handlers — giữ nguyên logic từ index.tsx ────────────────────────────────

  const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
    try {
      await updateNote(id, changes);
    } catch {
      setNotes(prev =>
        prev.map(n =>
          n.id === id
            ? { ...n, ...Object.fromEntries(Object.keys(changes).map(k => [k, n[k as keyof NoteCardData]])) }
            : n
        )
      );
      Alert.alert('Lỗi', 'Không thể cập nhật ghi chú. Vui lòng thử lại.');
    }
  };

  const handleTogglePin = async (id: string) => {
    setNotes(prev =>
      prev.map(n => n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n)
    );
    try {
      await togglePinNote(id);
    } catch {
      setNotes(prev =>
        prev.map(n => n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n)
      );
      Alert.alert('Lỗi', 'Không thể ghim ghi chú.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await trashNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
    }
  };

  const handleArchive = async (id: string) => {
    const noteToRestore = notes.find(n => n.id === id);
    const isPinned = noteToRestore?.is_pinned === 1;
    setNotes(prev => prev.filter(n => n.id !== id));
    try {
      if (isPinned) await togglePinNote(id);
      await toggleArchiveNote(id);
    } catch {
      setNotes(prev => noteToRestore ? [noteToRestore, ...prev] : prev);
      Alert.alert('Lỗi', 'Không thể lưu trữ ghi chú. Vui lòng thử lại.');
    }
  };

  const openCreateText = () => {
    openEditNoteStore({
      id: `temp-${Date.now()}`,
      type: 'text',
      title: '',
      content_text: '',
      color: 'default',
      // Gắn tag hiện tại vào note mới tạo (nếu có)
      tags: currentTag ? [currentTag] : [],
    });
  };

  const openCreateTodo = () => {
    openEditNoteStore({
      id: `temp-${Date.now()}`,
      type: 'todo',
      title: '',
      todo_items: [],
      color: 'default',
      tags: currentTag ? [currentTag] : [],
    });
  };

  const openEditNote = (note: NoteCardData) => openEditNoteStore(note);
  const closeEditor = () => closeEditorStore();

  const handleSaveNote = async (note: NoteCardData) => {
    const deepStripHtml = (html: string) => {
      if (!html) return '';
      return html
        .replace(/<[^>]*>?/gm, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .trim();
    };

    const strippedText = note.content_text ? deepStripHtml(note.content_text) : '';
    const cleanNote: NoteCardData = {
      ...note,
      content_text: strippedText === '' ? '' : note.content_text,
    };

    const isContentEmpty =
      (!cleanNote.title || cleanNote.title.trim() === '') &&
      (!cleanNote.content_text || cleanNote.content_text.trim() === '') &&
      (!cleanNote.todo_items || cleanNote.todo_items.length === 0);

    if (isContentEmpty && note.id.startsWith('temp-')) {
      closeEditorStore();
      return;
    }

    const isNewNote = note.id.startsWith('temp-');
    try {
      if (isNewNote) {
        const createdNote = cleanNote.type === 'text'
          ? await createNoteText(cleanNote)
          : await createNoteTodo(cleanNote);
        setNotes(prev => [createdNote, ...prev.filter(n => n.id !== note.id)]);
      } else {
        const oldNote = notes.find(n => n.id === note.id);
        if (oldNote && oldNote.is_pinned !== cleanNote.is_pinned) {
          await togglePinNote(cleanNote.id);
        }
        const updatedNote = await updateNote(cleanNote.id, cleanNote);
        setNotes(prev => prev.map(n => n.id === cleanNote.id ? updatedNote : n));
      }
      closeEditorStore();
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
    }
  };

  const pinned = notes.filter(n => n.is_pinned === 1);
  const others  = notes.filter(n => n.is_pinned !== 1);

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
          { flexGrow: 1 },
          isMobile && {
            paddingHorizontal: 8,
            paddingVertical: 12,
            paddingBottom: 96 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[
          styles.inner,
          isGrid
            ? { maxWidth: '100%', alignSelf: 'flex-start' }
            : { maxWidth: 720, alignSelf: 'center' },
        ]}>
          {/* ── Empty state ── */}
          {notes.length === 0 ? (
            <View style={styles.emptyWrapper}>
              <View style={[styles.emptyIconBox, isDark && { backgroundColor: '#1F2937' }]}>
                <Icon
                  source="label-outline"
                  size={72}
                  color={isDark ? '#4B5563' : '#D1D5DB'}
                />
              </View>
              <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                Không có ghi chú nào với nhãn{currentTag ? ` "${currentTag.name}"` : ''}
              </Text>
            </View>
          ) : (
            <>
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
            </>
          )}
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
  scroll: { flex: 1, backgroundColor: colors.bgPage },
  container: { paddingVertical: 24, paddingHorizontal: 30 },
  inner: { width: '100%' },
  emptyWrapper: {
    flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 20,
  },
  emptyIconBox: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular', fontSize: 16, textAlign: 'center', maxWidth: 280, lineHeight: 24,
  },
});