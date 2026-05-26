import {
    ScrollView, StyleSheet, View, Alert, Text,
    useWindowDimensions, TouchableOpacity,
} from 'react-native';
import { useState, useEffect } from 'react';
import { NoteCardData } from '../../src/components/notes/NoteCard';
import { colors } from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from 'react-native-paper';

import { useAppStore } from '@/src/store/useAppStore';
import { useSyncStore } from '../../src/store/useSyncStore';

import { fetchNotes, restoreNote, deleteNotePermanently } from '../../src/api/noteApi';
import { TrashNoteCard } from '../../src/components/notes/TrashNoteCard';
import { NoteEditor } from '../../src/components/notes/NoteEditor';
import { useNoteStore } from '../../src/store/useNoteStore';

export default function TrashScreen() {
    const { theme, viewMode } = useAppStore();
    const { setSyncing, setDone, setError } = useSyncStore();
    const [notes, setNotes] = useState<NoteCardData[]>([]);

    const isDark = theme === 'dark';
    const dynamicBg = isDark ? '#111827' : colors.bgPage;

    const {
        editorVisible,
        editorMode,
        editingNote,
        openEditNote: openEditNoteStore,
        closeEditor: closeEditorStore,
    } = useNoteStore();

    // Mở xem ghi chú (read-only — không cho save trong trash)
    const handlePressNote = (note: NoteCardData) => openEditNoteStore(note);
    const handleCloseEditor = () => closeEditorStore();
    // onSave chỉ đóng editor, không ghi gì — trash là read-only
    const handleSaveNote = (_note: NoteCardData) => closeEditorStore();

    useEffect(() => {
        setSyncing();
        const loadNotes = async () => {
            try {
                const data = await fetchNotes({ view: 'trash' });
                setNotes(data);
                setDone();
            } catch {
                setError();
            }
        };
        loadNotes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Xóa vĩnh viễn 1 thẻ — xóa ngay không cần confirm
    const handleDeletePermanently = async (id: string) => {
        const noteToRestore = notes.find(n => n.id === id);
        setNotes(prev => prev.filter(n => n.id !== id));
        try {
            await deleteNotePermanently(id);
        } catch {
            setNotes(prev => (noteToRestore ? [noteToRestore, ...prev] : prev));
            Alert.alert('Lỗi', 'Không thể xóa ghi chú. Vui lòng thử lại.');
        }
    };

    // Dọn sạch toàn bộ thùng rác
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
                        const backup = [...notes];
                        setNotes([]);
                        try {
                            await Promise.all(backup.map(n => deleteNotePermanently(n.id)));
                        } catch {
                            setNotes(backup);
                            Alert.alert('Lỗi', 'Không thể dọn sạch thùng rác. Vui lòng thử lại.');
                        }
                    },
                },
            ]
        );
    };

    // Khôi phục 1 thẻ về Active
    const handleRestore = async (id: string) => {
        const noteToRestore = notes.find(n => n.id === id);
        setNotes(prev => prev.filter(n => n.id !== id));
        try {
            await restoreNote(id);
        } catch {
            setNotes(prev => (noteToRestore ? [noteToRestore, ...prev] : prev));
            Alert.alert('Lỗi', 'Không thể khôi phục ghi chú. Vui lòng thử lại.');
        }
    };

    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const isMobile = width < 720;
    const isGrid = viewMode === 'grid';

    const isEmpty = notes.length === 0;

    return (
        <>
            <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
                {/* Banner thông báo — căn giữa, nút Dọn sạch chỉ hiện khi có thẻ */}
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
                        // Empty state
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
                                // Grid layout
                                <View style={styles.gridWrapper}>
                                    {notes.map(note => (
                                        <View key={note.id} style={styles.gridItem}>
                                            <TrashNoteCard
                                                note={note}
                                                onDelete={handleDeletePermanently}
                                                onRestore={handleRestore}
                                                onPress={handlePressNote}
                                            />
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                // List layout
                                <View>
                                    {notes.map(note => (
                                        <View key={note.id} style={styles.listItem}>
                                            <TrashNoteCard
                                                note={note}
                                                onDelete={handleDeletePermanently}
                                                onRestore={handleRestore}
                                                onPress={handlePressNote}
                                            />
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>

            {/* NoteEditor — read-only (onSave chỉ đóng, không ghi vào DB) */}
            <NoteEditor
                visible={editorVisible}
                mode={editorMode}
                note={editingNote}
                onClose={handleCloseEditor}
                onSave={handleSaveNote}
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
    // Empty state
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