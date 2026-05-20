import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';
import { unarchiveNote } from '../../src/api/noteApi';

export default function ArchiveScreen() {
    const { theme, viewMode } = useAppStore();
    const { setSyncing, setDone, setError } = useSyncStore();
    
    // Móc dây trực tiếp vào Store chung, dẹp tiệm useState local
    const {
        notes,
        loadNotes,
        quickUpdate,
        trashNote,
        togglePin,
        editorVisible,
        editorMode,
        editingNote,
        openEditNote,
        closeEditor,
    } = useNoteStore();

    const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

    const isDark = theme === 'dark';
    const dynamicBg = isDark ? '#111827' : colors.bgPage;

    // Gọi API lấy đúng kho lưu trữ khi mở màn hình
    useEffect(() => {
        clearSelection();
        setSyncing();
        loadNotes({ view: 'archived' })
            .then(() => setDone())
            .catch(() => setError());
    }, []);

    // Bấm nút bỏ lưu trữ -> gọi API xong ra lệnh cho Store kéo lại danh sách mới
    const handleUnarchive = async (id: string) => {
        try {
            await unarchiveNote(id);
            loadNotes({ view: 'archived' });
        } catch (error) {
            console.error('Lỗi khi bỏ lưu trữ ghi chú:', error);
        }
    };

    const isGrid = viewMode === 'grid';

    return (
        <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
            <ScrollView
                style={[styles.scroll, { backgroundColor: dynamicBg }]}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.inner, isGrid ? { maxWidth: '100%', alignSelf: 'flex-start' } : { maxWidth: 720, alignSelf: 'center' }]}>
                    {notes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon source="archive-outline" size={96} color={isDark ? '#374151' : colors.gray300} />
                            <Text style={[styles.emptyText, { color: isDark ? '#4B5563' : colors.gray400 }]}>
                                Không có ghi chú nào trong kho lưu trữ
                            </Text>
                        </View>
                    ) : (
                        <NoteList
                            notes={notes}
                            onPressNote={openEditNote}
                            onUpdateNote={quickUpdate}
                            onDeleteNote={trashNote}
                            onArchiveNote={handleUnarchive}
                            onPinNote={togglePin}
                            onTrashNote={trashNote}
                            selectedIds={selectedIds}
                            onSelectNote={toggleSelect}
                        />
                    )}
                </View>
            </ScrollView>

            <NoteEditor
                visible={editorVisible}
                mode={editorMode}
                note={editingNote}
                onClose={closeEditor}
                onSave={() => loadNotes({ view: 'archived' })}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: { flex: 1 },
    container: { flexGrow: 1, paddingVertical: 24, paddingHorizontal: 30 },
    inner: { width: '100%' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120, gap: 16 },
    emptyText: { fontFamily: 'Inter-Regular', fontSize: 18, color: colors.gray400 },
});