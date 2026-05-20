import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';
import { fetchNotes, unarchiveNote } from '../../src/api/noteApi';

export default function ArchiveScreen() {
    const { theme, viewMode } = useAppStore();
    const { setSyncing, setDone, setError } = useSyncStore();
    const [notes, setNotes] = useState<NoteCardData[]>([]);

    const {
        editorVisible,
        editorMode,
        editingNote,
        openEditNote: openEditNoteStore,
        closeEditor: closeEditorStore,
    } = useNoteStore();

    const { selectedIds, toggleSelect, clearSelection } = useSelectionStore();

    const isDark = theme === 'dark';
    const dynamicBg = isDark ? '#111827' : colors.bgPage;
    const textColor = isDark ? '#F9FAFB' : colors.textTertiary;

    useEffect(() => {
        clearSelection();
        setSyncing();
        const loadNotes = async () => {
            try {
                const data = await fetchNotes({ view: 'archived' });
                setNotes(data);
                setDone();
            } catch (error) {
                console.error('Lỗi khi tải ghi chú lưu trữ:', error);
                setError();
            }
        };
        loadNotes();
    }, []);

    const handleUpdate = (id: string, changes: Partial<NoteCardData>) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, ...changes } : n));
    };

    const handleDelete = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    // Khi người dùng nhấn nút "Bỏ lưu trữ" trên card:
    // gọi API unarchive rồi xóa khỏi danh sách lưu trữ
    const handleUnarchive = async (id: string) => {
        try {
            await unarchiveNote(id);
        } catch (error) {
            console.error('Lỗi khi bỏ lưu trữ ghi chú:', error);
        } finally {
            // Dù thành công hay lỗi, vẫn xóa khỏi UI lưu trữ
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    const openEditNote = (note: NoteCardData) => openEditNoteStore(note);

    const closeEditor = () => closeEditorStore();

    // Khi chỉnh sửa note trong archive, chỉ cập nhật nội dung (không thêm mới)
    const handleSaveNote = (note: NoteCardData) => {
        setNotes(prev =>
            prev.map(item => item.id === note.id ? { ...item, ...note } : item)
        );
    };

    const isGrid = viewMode === 'grid';

    return (
        <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
            <ScrollView
                style={[styles.scroll, { backgroundColor: dynamicBg }]}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View
                    style={[
                        styles.inner,
                        isGrid
                            ? { maxWidth: '100%', alignSelf: 'flex-start' }
                            : { maxWidth: 720, alignSelf: 'center' },
                    ]}
                >
                    {notes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon
                                source="archive-outline"
                                size={96}
                                color={isDark ? '#374151' : colors.gray300}
                            />
                            <Text style={[styles.emptyText, { color: isDark ? '#4B5563' : colors.gray400 }]}>
                                Không có ghi chú nào trong kho lưu trữ
                            </Text>
                        </View>
                    ) : (
                        <NoteList
                            notes={notes}
                            onPressNote={openEditNote}
                            onUpdateNote={handleUpdate}
                            onDeleteNote={handleDelete}
                            onArchiveNote={handleUnarchive}
                            selectedIds={selectedIds}
                            onSelectNote={toggleSelect}
                            isArchived={true}
                        />
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
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
    },
    container: {
        flexGrow: 1,
        paddingVertical: 24,
        paddingHorizontal: 30,
    },
    inner: {
        width: '100%',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 120,
        gap: 16,
    },
    emptyText: {
        fontFamily: 'Inter-Regular',
        fontSize: 18,
        color: colors.gray400,
    },
});