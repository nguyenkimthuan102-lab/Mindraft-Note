import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState, useEffect } from 'react';
import { colors } from '../../src/constants/colors';
import { useSyncStore } from '../../src/store/useSyncStore';
import { useSelectionStore } from '../../src/store/useSelectionStore';
import { useNoteStore } from '../../src/store/useNoteStore';
import { NoteList } from '../../src/components/notes/NoteList';
import { useAppStore } from '@/src/store/useAppStore';
import { restoreNote, deleteNotePermanently, emptyTrash } from '../../src/api/noteApi';

export default function TrashScreen() {
    const { theme, viewMode } = useAppStore();
    const { setSyncing, setDone, setError } = useSyncStore();
    const [confirmEmpty, setConfirmEmpty] = useState(false);

    // Ăn dây vào Store dữ liệu chung
    const { notes, loadNotes } = useNoteStore();
    const { clearSelection } = useSelectionStore();

    const isDark = theme === 'dark';
    const dynamicBg = isDark ? '#111827' : colors.bgPage;
    const bannerBg = isDark ? '#1F2937' : '#FFFFFF';
    const bannerBorder = isDark ? '#374151' : colors.borderDefault;
    const bannerText = isDark ? '#9CA3AF' : colors.textTertiary;

    useEffect(() => {
        clearSelection();
        setSyncing();
        loadNotes({ view: 'trash' })
            .then(() => setDone())
            .catch(() => setError());
    }, []);

    // Khôi phục ghi chú về Home
    const handleRestore = async (id: string) => {
        try {
            await restoreNote(id);
            loadNotes({ view: 'trash' });
        } catch (error) {
            console.error('Lỗi khi khôi phục ghi chú:', error);
        }
    };

    // Xóa vĩnh viễn ghi chú khỏi cuộc đời
    const handleDeletePermanently = async (id: string) => {
        try {
            await deleteNotePermanently(id);
            loadNotes({ view: 'trash' });
        } catch (error) {
            console.error('Lỗi khi xóa vĩnh viễn:', error);
        }
    };

    // Dọn sạch sành sanh thùng rác
    const handleEmptyTrash = async () => {
        if (!confirmEmpty) {
            setConfirmEmpty(true);
            setTimeout(() => setConfirmEmpty(false), 3000);
            return;
        }
        try {
            await emptyTrash();
            loadNotes({ view: 'trash' });
        } catch (error) {
            console.error('Lỗi khi dọn thùng rác:', error);
        } finally {
            setConfirmEmpty(false);
        }
    };

    const isGrid = viewMode === 'grid';

    return (
        <View style={[{ flex: 1 }, { backgroundColor: dynamicBg }]}>
            <View style={[styles.banner, { backgroundColor: bannerBg, borderBottomColor: bannerBorder }]}>
                <Text style={[styles.bannerText, { color: bannerText }]}>
                    Ghi chú trong Thùng rác bị xóa sau 7 ngày.
                </Text>
                {notes.length > 0 && (
                    <TouchableOpacity onPress={handleEmptyTrash} activeOpacity={0.7}>
                        <Text style={[styles.emptyBtn, confirmEmpty && styles.emptyBtnConfirm]}>
                            {confirmEmpty ? 'Xác nhận xóa tất cả?' : 'Dọn sạch thùng rác'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={[styles.scroll, { backgroundColor: dynamicBg }]}
                contentContainerStyle={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.inner, isGrid ? { maxWidth: '100%', alignSelf: 'flex-start' } : { maxWidth: 720, alignSelf: 'center' }]}>
                    {notes.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon source="trash-can-outline" size={96} color={isDark ? '#374151' : colors.gray300} />
                            <Text style={[styles.emptyText, { color: isDark ? '#4B5563' : colors.gray400 }]}>
                                Không có bản ghi chú nào trong Thùng rác
                            </Text>
                        </View>
                    ) : (
                        <NoteList
                            notes={notes}
                            onPressNote={() => {}}            // Thùng rác khóa không cho mở Editor
                            onUpdateNote={() => {}}           // Thùng rác khóa không cho sửa màu
                            onDeleteNote={handleDeletePermanently} // Gọi hàm xóa vĩnh viễn
                            onArchiveNote={handleRestore}     // Nút lưu trữ biến hình thành Khôi phục
                            onPinNote={() => {}}              // Khóa tính năng ghim trong trash
                            onTrashNote={handleDeletePermanently}
                            selectedIds={[]}
                            onSelectNote={() => {}}
                        />
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 24, borderBottomWidth: 1 },
    bannerText: { fontFamily: 'Inter-Regular', fontSize: 14, fontStyle: 'italic' },
    emptyBtn: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.primary },
    emptyBtnConfirm: { color: colors.danger },
    scroll: { flex: 1 },
    container: { flexGrow: 1, paddingVertical: 24, paddingHorizontal: 30 },
    inner: { width: '100%' },
    emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120, gap: 16 },
    emptyText: { fontFamily: 'Inter-Regular', fontSize: 18 },
});