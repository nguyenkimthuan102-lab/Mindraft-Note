import {
  ScrollView, StyleSheet, View, Alert, Text,
  useWindowDimensions, TouchableOpacity,
} from 'react-native';
import { useEffect } from 'react';
import { colors } from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { TrashNoteCard } from '../../src/components/notes/TrashNoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';

export default function TrashScreen() {
  const { theme, viewMode } = useAppStore();
  const { setSyncing, setDone, setError } = useSyncStore();

  const {
    notes,
    loadNotes,
    editorVisible,
    editorMode,
    editingNote,
    openEditNote,
    restoreNoteAction,
    deleteNotePermanentlyAction,
    emptyTrashAction,
  } = useNoteStore();

  const isDark = theme === 'dark';
  const dynamicBg = isDark ? '#111827' : colors.bgPage;

  useEffect(() => {
    setSyncing();
    loadNotes('trash')
      .then(() => setDone())
      .catch(() => setError());
  }, [setSyncing, setDone, setError, loadNotes]);

  const handleEmptyTrash = () => {
    if (notes.length === 0) return;
    Alert.alert(
      'Dọn sạch thùng rác',
      'Tất cả ghi chú trong Thùng rác sẽ bị xóa vĩnh viễn. Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Dọn sạch',
          style: 'destructive',
          onPress: async () => {
            try {
              await emptyTrashAction();
            } catch {
              Alert.alert('Lỗi', 'Không thể dọn sạch thùng rác. Vui lòng thử lại.');
            }
          },
        },
      ]
    );
  };

  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const isGrid = viewMode === 'grid';
  const isEmpty = notes.length === 0;

  return (
    <>
      <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
        <View style={styles.bannerRow}>
          <Text style={[styles.bannerText, { color: isDark ? '#9CA3AF' : '#5F6368' }]}>
            Ghi chú trong Thùng rác bị xóa sau 10 ngày.
          </Text>
          {!isEmpty && (
            <TouchableOpacity onPress={handleEmptyTrash} activeOpacity={0.7}>
              <Text style={[styles.emptyBtn, { color: isDark ? '#60A5FA' : colors.primary }]}>
                Dọn sạch thùng rác
              </Text>
            </TouchableOpacity>
          )}
        </View>

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
          {isEmpty ? (
            <View style={styles.emptyWrapper}>
              <View style={[styles.emptyIconContainer, isDark && { backgroundColor: '#1F2937' }]}>
                <Icon
                  source="trash-can-outline"
                  size={80}
                  color={isDark ? '#4B5563' : '#D1D5DB'}
                />
              </View>
              <Text style={[styles.emptyText, { color: isDark ? '#6B7280' : '#9CA3AF' }]}>
                Không có bản ghi chú nào trong Thùng rác
              </Text>
            </View>
          ) : (
            <View style={[
              styles.inner,
              isGrid
                ? { maxWidth: '100%', alignSelf: 'flex-start' }
                : { maxWidth: 720, alignSelf: 'center' },
            ]}>
              {isGrid ? (
                <View style={styles.gridWrapper}>
                  {notes.map(note => (
                    <View key={note.id} style={styles.gridItem}>
                      <TrashNoteCard
                        note={note}
                        onDelete={deleteNotePermanentlyAction}
                        onRestore={restoreNoteAction}
                        onPress={openEditNote}
                      />
                    </View>
                  ))}
                </View>
              ) : (
                <View>
                  {notes.map(note => (
                    <View key={note.id} style={styles.listItem}>
                      <TrashNoteCard
                        note={note}
                        onDelete={deleteNotePermanentlyAction}
                        onRestore={restoreNoteAction}
                        onPress={openEditNote}
                      />
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>

      {/*
        readOnly=true: NoteEditor sẽ bỏ qua saveNoteAction khi đóng.
        Trash là read-only — chỉ xem, không cho sửa.
        Xem thêm hướng dẫn thêm prop readOnly vào NoteEditor bên dưới.
      */}
      <NoteEditor
        visible={editorVisible}
        mode={editorMode}
        note={editingNote}
        readOnly
      />
    </>
  );
}

const styles = StyleSheet.create({
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    gap: 12,
  },
  bannerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#5F6368',
    fontStyle: 'italic',
  },
  emptyBtn: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
  },
  container: {
    paddingVertical: 24,
    paddingHorizontal: 30,
  },
  inner: {
    width: '100%',
  },
  gridWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: 240,
  },
  listItem: {
    marginBottom: 10,
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
    fontSize: 17,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 26,
  },
});