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
import { addTagToNote } from '../../src/api/tagApi';
import type { Tag } from '../../src/api/tagApi';

export default function HomeScreen() {
  // ── XÓA: router, isCreating, setIsCreating — không dùng ở màn Home ──────
  const { theme, viewMode } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();
  const [notes, setNotes] = useState<NoteCardData[]>([]);
  const {
    editorVisible,
    editorMode,
    editingNote,
    openEditNote: openEditNoteStore,
    closeEditor: closeEditorStore,
    tagIdByName,
    allTagObjects,
  } = useNoteStore();

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  // ── XÓA: stripHtml — không dùng ở màn Home (chỉ dùng trong editor) ──────

  useEffect(() => {
    clearSelection();
    setSyncing();
    const loadNotes = async () => {
      try {
        const data = await fetchNotes({ view: 'active' });
        setNotes(data);
        setDone();
      } catch (error) {
        console.error('Lỗi khi tải danh sách ghi chú:', error);
        setError();
      }
    };
    loadNotes();
    // ── FIX: thêm dependencies còn thiếu vào mảng deps ───────────────────
  }, [clearSelection, setSyncing, setDone, setError]);

  const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));

    try {
      await updateNote(id, changes);
    } catch {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, ...Object.fromEntries(Object.keys(changes).map(k => [k, n[k as keyof NoteCardData]])) } : n));
      Alert.alert("Lỗi", "Không thể cập nhật ghi chú. Vui lòng thử lại.");
    }
  };

  const handleTogglePin = async (id: string) => {
    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n
      )
    );

    try {
      await togglePinNote(id);
    } catch {
      setNotes(prev =>
        prev.map(n =>
          n.id === id ? { ...n, is_pinned: n.is_pinned ? 0 : 1 } : n
        )
      );
      Alert.alert("Lỗi", "Không thể ghim ghi chú");
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
    const noteToArchive = notes.find(n => n.id === id);
    const isPinned = noteToArchive?.is_pinned === 1; // THÊM: kiểm tra ghim
    setNotes(prev => prev.filter(n => n.id !== id));

    try {
      // THÊM: nếu đang ghim → bỏ ghim trước (giống GG Keep: lưu trữ tự unpin)
      if (isPinned) {
        await togglePinNote(id);
      }
      await toggleArchiveNote(id);
    } catch {
      setNotes(prev => noteToArchive ? [noteToArchive, ...prev] : prev);
      Alert.alert("Lỗi", "Không thể lưu trữ ghi chú. Vui lòng thử lại.");
    }
  };

  // ── handleRestoreNote: dùng ở màn Archive, export ra ngoài nếu cần ───────
  const handleRestoreNote = async (id: string) => {
    const noteToRestore = notes.find(n => n.id === id);

    setNotes(prev =>
      prev.map(n =>
        n.id === id ? { ...n, is_archived: 0, is_pinned: 0 } : n
      )
    );

    try {
      if (noteToRestore?.is_pinned === 1) {
        await togglePinNote(id);
      }
      await toggleArchiveNote(id);
    } catch {
      setNotes(prev =>
        prev.map(n =>
          n.id === id
            ? {
              ...n,
              is_archived: noteToRestore?.is_archived ?? 1,
              is_pinned: noteToRestore?.is_pinned ?? 0,
            }
            : n
        )
      );
      Alert.alert("Lỗi", "Không thể khôi phục ghi chú. Vui lòng thử lại.");
    }
  };

  const openCreateText = async () => {
    const tempNote: NoteCardData = {
      id: `temp-${Date.now()}`,
      type: 'text',
      title: '',
      content_text: '',
      color: 'default',
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

    if (isContentEmpty) {
      if (note.id.startsWith('temp-')) {
        closeEditorStore();
        return;
      }
    }

    const isNewNote = note.id.startsWith('temp-');

    try {
      if (isNewNote) {
        const createdNote = cleanNote.type === 'text'
          ? await createNoteText(cleanNote)
          : await createNoteTodo(cleanNote);

        // ✅ FIX Bug 4: gắn tags vào note mới vừa tạo
        const desiredTagNames: string[] = cleanNote.labels ?? [];
        if (desiredTagNames.length > 0) {
          await Promise.all(
            desiredTagNames.map(name => {
              const tagId = tagIdByName[name];
              return tagId ? addTagToNote(createdNote.id, tagId) : Promise.resolve();
            })
          );
          // Gắn tags vào createdNote để hiển thị ngay trên card
          const addedTags = desiredTagNames
            .map(name => allTagObjects.find((t: Tag) => t.name === name))
            .filter(Boolean) as Tag[];
          setNotes(prev => [{ ...createdNote, tags: addedTags }, ...prev.filter(n => n.id !== note.id)]);
        } else {
          setNotes(prev => [createdNote, ...prev.filter(n => n.id !== note.id)]);
        }
      } else {
        const oldNote = notes.find(n => n.id === note.id);
        if (oldNote && oldNote.is_pinned !== cleanNote.is_pinned) {
          await togglePinNote(cleanNote.id);
        }
        const updatedNote = await updateNote(cleanNote.id, cleanNote);
        // Giữ tags đã được sync bởi NoteEditor
        const tagsFromEditor = cleanNote.tags && cleanNote.tags.length > 0
          ? cleanNote.tags
          : updatedNote.tags;
        setNotes(prev => prev.map(n =>
          n.id === cleanNote.id ? { ...updatedNote, tags: tagsFromEditor } : n
        ));
      }
      closeEditorStore();
    } catch {
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