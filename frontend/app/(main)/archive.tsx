import { ScrollView, StyleSheet, View, useWindowDimensions, Text } from 'react-native';
import { useEffect } from 'react';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { colors } from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';

export default function ArchiveScreen() {
  const { theme, viewMode } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();

  const {
    notes,
    loadNotes,
    editorVisible,
    editorMode,
    editingNote,
    openEditNote,
    archiveNoteAction,
    trashNoteAction,
    saveNoteAction,
  } = useNoteStore();

  const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  useEffect(() => {
    clearSelection();
    setSyncing();
    loadNotes('archived')
      .then(() => setDone())
      .catch((error) => {
        console.error('Lỗi khi tải ghi chú đã lưu trữ:', error);
        setError();
      });
  }, [clearSelection, setSyncing, setDone, setError, loadNotes]);

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
            paddingBottom: 40 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <View style={[styles.emptyIconContainer, isDark && { backgroundColor: '#1F2937' }]}>
              <Icon
                source="archive-arrow-down-outline"
                size={80}
                color={isDark ? '#4B5563' : '#D1D5DB'}
              />
            </View>
            <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
              Bản ghi chú mà bạn đã lưu trữ sẽ xuất hiện tại đây
            </Text>
          </View>
        ) : (
          <View
            style={[
              styles.inner,
              isGrid
                ? { maxWidth: '100%', alignSelf: 'flex-start' }
                : { maxWidth: 720, alignSelf: 'center' },
            ]}
          >
            <NoteList
              title="Lưu trữ"
              notes={notes}
              onPressNote={openEditNote}
              // handleUpdate không cần thiết trong Archive:
              // - Đổi màu/tiêu đề → user mở editor rồi save (saveNoteAction lo)
              // - Toggle pin → archiveNoteAction tự unarchive (logic trong saveNoteAction)
              onUpdateNote={async () => {}}
              onDeleteNote={trashNoteAction}
              onArchiveNote={archiveNoteAction}   // unarchive: archiveNoteAction toggle ngược lại
              selectedIds={selectedIds}
              onSelectNote={toggleSelect}
              archiveLabel="Huỷ lưu trữ"
              archiveIcon="archive-arrow-up-outline"
            />
          </View>
        )}
      </ScrollView>

      {/*
        NoteEditor đã tích hợp store:
        - Đóng: gọi closeEditor() từ store
        - Lưu: gọi saveNoteAction() từ store
        - Trường hợp ghim trong Archive: saveNoteAction tự detect is_archived=1 → unarchive
      */}
      <NoteEditor
        visible={editorVisible}
        mode={editorMode}
        note={editingNote}
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
    paddingVertical: 24,
    paddingHorizontal: 30,
  },
  inner: {
    width: '100%',
  },
  emptyWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 480,
    gap: 20,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 22,
    color: '#9CA3AF',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
  },
});