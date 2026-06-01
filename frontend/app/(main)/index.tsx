import { ScrollView, StyleSheet, View, Alert, useWindowDimensions } from 'react-native';
import { useState, useEffect } from 'react';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { QuickCapture } from '../../src/components/notes/QuickCapture';
import { FloatingActionButton } from '../../src/components/ui/FloatingActionButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NoteCardData } from '@/src/components/notes/NoteCard';

import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';


export default function HomeScreen() {
  // ── XÓA: router, isCreating, setIsCreating — không dùng ở màn Home ──────
  const { theme, viewMode } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();

  const {
    notes,
    loadNotes,
    editorVisible,
    editorMode,
    editingNote,
    openCreateText,
    openCreateTodo,
    openEditNote,
    trashNoteAction,
    archiveNoteAction,
    saveNoteAction,
  } = useNoteStore();

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  // ── XÓA: stripHtml — không dùng ở màn Home (chỉ dùng trong editor) ──────

  useEffect(() => {
    clearSelection();
    setSyncing();
    loadNotes('active')
      .then(() => setDone())
      .catch((error) => {
        console.error('Lỗi khi tải danh sách ghi chú:', error);
        setError();
      });
  }, [clearSelection, setSyncing, setDone, setError, loadNotes]);

  const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;
    try {
      await saveNoteAction({ ...noteToUpdate, ...changes });
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật ghi chú. Vui lòng thử lại.");
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
              onDeleteNote={trashNoteAction}
              onArchiveNote={archiveNoteAction}
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
              onDeleteNote={trashNoteAction}
              onArchiveNote={archiveNoteAction}
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