import { ScrollView, StyleSheet, View, Alert, useWindowDimensions, Text } from 'react-native';
import { useState, useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { colors } from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';

import {
    fetchNotes,
    updateNote,
    trashNote,
    toggleArchiveNote,
    togglePinNote,
} from '../../src/api/noteApi';

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

    // Tải danh sách ghi chú đã lưu trữ
    useEffect(() => {
        clearSelection();
        setSyncing();
        const loadNotes = async () => {
            try {
                const data = await fetchNotes({ view: 'archived' });
                setNotes(data);
                setDone();
            } catch (error) {
                console.error('Lỗi khi tải ghi chú đã lưu trữ:', error);
                setError();
            }
        };
        loadNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Trong Archive: bất kỳ thao tác pin nào đều đẩy thẻ ra All Notes (giống GG Keep)
    const handleUpdate = async (id: string, changes: Partial<NoteCardData>) => {
        const isPinToggle = 'is_pinned' in changes;
        // Capture trước khi setNotes để rollback đúng
        const currentNote = notes.find(n => n.id === id);

        if (isPinToggle) {
            // Optimistic: xoá khỏi Archive ngay
            setNotes(prev => prev.filter(n => n.id !== id));
            try {
                // Set trạng thái pin mới trực tiếp qua updateNote (tránh togglePinNote fail trên archived note)
                await updateNote(id, { is_pinned: changes.is_pinned });
                // Bỏ lưu trữ → thẻ chuyển sang All Notes
                await toggleArchiveNote(id);
            } catch {
                // Rollback: trả thẻ về Archive
                if (currentNote) {
                    setNotes(prev => [currentNote, ...prev]);
                }
                Alert.alert('Lỗi', 'Không thể cập nhật ghi chú. Vui lòng thử lại.');
            }
        } else {
            // Thay đổi khác (màu, tiêu đề...) — cập nhật bình thường, giữ trong Archive
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
        }
    };

    // Xoá vào Thùng rác
    const handleDelete = async (id: string) => {
        try {
            await trashNote(id);
            setNotes(prev => prev.filter(n => n.id !== id));
        } catch {
            Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
        }
    };

    // Huỷ lưu trữ (unarchive) → toggle rồi xoá khỏi danh sách
    const handleUnarchive = async (id: string) => {
        const noteToRestore = notes.find(n => n.id === id);
        setNotes(prev => prev.filter(n => n.id !== id));
        try {
            await toggleArchiveNote(id);
        } catch {
            setNotes(prev => (noteToRestore ? [noteToRestore, ...prev] : prev));
            Alert.alert('Lỗi', 'Không thể huỷ lưu trữ ghi chú. Vui lòng thử lại.');
        }
    };

    // Mở editor xem/sửa ghi chú
    const openEditNote = (note: NoteCardData) => openEditNoteStore(note);
    const closeEditor = () => closeEditorStore();

    // Lưu thay đổi từ editor
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

        // Không tạo note mới từ màn Archive
        if (note.id.startsWith('temp-')) {
            closeEditorStore();
            return;
        }

        try {
            const oldNote = notes.find(n => n.id === note.id);

            // Nếu ghim từ editor trong Archive → unarchive và xoá khỏi list
            if (oldNote && oldNote.is_pinned !== cleanNote.is_pinned && cleanNote.is_pinned === 1) {
                await togglePinNote(cleanNote.id);
                await toggleArchiveNote(cleanNote.id);
                setNotes(prev => prev.filter(n => n.id !== cleanNote.id));
                closeEditorStore();
                return;
            }

            const updatedNote = await updateNote(cleanNote.id, cleanNote);
            setNotes(prev => prev.map(n => n.id === cleanNote.id ? updatedNote : n));
            closeEditorStore();
        } catch {
            Alert.alert('Lỗi', 'Không thể lưu ghi chú. Vui lòng thử lại.');
        }
    };

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
                    // Empty state — giống GG Keep
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
                            onUpdateNote={handleUpdate}
                            onDeleteNote={handleDelete}
                            onArchiveNote={handleUnarchive}
                            selectedIds={selectedIds}
                            onSelectNote={toggleSelect}
                            archiveLabel="Huỷ lưu trữ"
                            archiveIcon="archive-arrow-up-outline"
                        />
                    </View>
                )}
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
        paddingVertical: 24,
        paddingHorizontal: 30,
    },
    inner: {
        width: '100%',
    },
    // Empty state — căn giữa toàn màn hình
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