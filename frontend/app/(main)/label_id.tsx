/**
 * app/(main)/label/[id].tsx
 * Màn hình hiển thị notes được lọc theo label — Google Keep style
 * Route: /(main)/label/:id
 */
import { ScrollView, StyleSheet, View, Alert, useWindowDimensions, Text } from 'react-native';
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

export default function LabelScreen() {
  // ── Lấy tag id từ route params ──────────────────────────────────────────────
  const { id: tagId } = useLocalSearchParams<{ id: string }>();

  // ── Store ───────────────────────────────────────────────────────────────────
  const { theme, viewMode, tags } = useAppStore();
  const { selectedIds, toggleSelect } = useSelectionStore();
  const {
    notes,
    editorVisible,
    editorMode,
    editingNote,
    openEditNote,
    openCreateText,
    openCreateTodo,
    trashNoteAction,
    archiveNoteAction,
    saveNoteAction
  } = useNoteStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  // Tên label hiện tại để hiển thị (lấy từ store)
  const currentTag = tags.find(t => t.id === tagId);

  const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate) return;
    try {
      await saveNoteAction({ ...noteToUpdate, ...changes });
    } catch {
      Alert.alert("Lỗi", "Không thể cập nhật ghi chú. Vui lòng thử lại.");
    }
  };


  const labelNotes = notes.filter(note => 
    !note.is_archived && 
    !note.is_trashed &&
    note.labels?.some(l => typeof l === 'string' ? l === tagId : (l as any).id === tagId)
  );

  const pinned = labelNotes.filter(n => n.is_pinned === 1);
  const others = labelNotes.filter(n => n.is_pinned !== 1);

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
            </>
          )}
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