import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { useNoteStore } from '../../store/useNoteStore';
import { createTag, renameTag, deleteTag } from '../../api/tagApi';

interface EditLabelsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function EditLabelsModal({ visible, onClose }: EditLabelsModalProps) {
    const { theme, tags } = useAppStore();
    const { loadTagsFromServer } = useNoteStore();
    const isDark = theme === 'dark';

    const [newLabelName, setNewLabelName] = useState('');
    const [createError, setCreateError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleCreate = async () => {
        const trimmed = newLabelName.trim();
        if (!trimmed) return;

        // ✅ FIX 1: Kiểm tra nhãn đã tồn tại (giống GG Keep)
        const isDuplicate = tags.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
        if (isDuplicate) {
            setCreateError('Nhãn đã tồn tại');
            return;
        }

        setCreateError('');
        await createTag(trimmed);
        setNewLabelName('');
        await loadTagsFromServer();
    };

    const handleRename = async (id: string) => {
        if (!editValue.trim()) return;
        await renameTag(id, editValue.trim());
        setEditingId(null);
        // ✅ Cập nhật toàn bộ hệ thống: Sidebar + NoteStore
        await loadTagsFromServer();
    };

    const handleDelete = async (id: string) => {
        await deleteTag(id);
        // ✅ Cập nhật toàn bộ hệ thống: Sidebar + NoteStore
        await loadTagsFromServer();
    };

    const dc = {
        bg: isDark ? '#202124' : '#fff',
        text: isDark ? '#e8eaed' : '#3c4043',
        border: isDark ? '#5f6368' : '#dadce0',
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <TouchableOpacity style={[styles.container, { backgroundColor: dc.bg }]} activeOpacity={1}>
                    <Text style={[styles.header, { color: dc.text }]}>Chỉnh sửa nhãn</Text>

                    {/* Tạo mới */}
                    <View style={[styles.row, { borderBottomWidth: 1, borderBottomColor: dc.border }]}>
                        <MaterialCommunityIcons
                            name={newLabelName ? 'close' : 'plus'}
                            size={22}
                            color={dc.text}
                            onPress={() => { setNewLabelName(''); setCreateError(''); }}
                        />
                        <TextInput
                            style={[styles.input, { color: dc.text }]}
                            placeholder="Tạo nhãn mới"
                            placeholderTextColor="#9ca3af"
                            value={newLabelName}
                            onChangeText={(text) => {
                                setNewLabelName(text);
                                if (createError) setCreateError(''); // xóa lỗi khi gõ lại
                            }}
                            onSubmitEditing={handleCreate}
                        />
                        {newLabelName.length > 0 && (
                            <TouchableOpacity onPress={handleCreate}>
                                <MaterialCommunityIcons name="check" size={22} color={dc.text} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Thông báo lỗi nhãn đã tồn tại */}
                    {createError ? (
                        <Text style={styles.errorText}>{createError}</Text>
                    ) : null}

                    <ScrollView
                        style={{ maxHeight: 300 }}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 4 }}
                    >
                        {tags.map((tag) => {
                            const isEditing = editingId === tag.id;
                            return (
                                <View key={tag.id} style={[styles.row, isEditing && { backgroundColor: isDark ? '#1a2332' : '#f8faff' }]}>
                                    {/* Left icon: label-outline (bình thường) / close (khi đang edit) */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (isEditing) {
                                                // Hủy edit
                                                setEditingId(null);
                                                setEditValue('');
                                            } else {
                                                handleDelete(tag.id);
                                            }
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                        <MaterialCommunityIcons
                                            name={isEditing ? 'close' : 'trash-can-outline'}
                                            size={22}
                                            color={isEditing ? dc.text : (isDark ? '#6b7280' : '#9ca3af')}
                                        />
                                    </TouchableOpacity>

                                    {/* Input */}
                                    <TextInput
                                        style={[
                                            styles.input,
                                            { color: dc.text },
                                            isEditing && {
                                                borderBottomWidth: 1.5,
                                                borderBottomColor: colors.primary,
                                            },
                                        ]}
                                        value={isEditing ? editValue : tag.name}
                                        onChangeText={setEditValue}
                                        editable={isEditing}
                                        onFocus={() => {
                                            setEditingId(tag.id);
                                            setEditValue(tag.name);
                                        }}
                                        onSubmitEditing={() => handleRename(tag.id)}
                                    />

                                    {/* Right icon: pencil nổi bật (bình thường) / check màu xanh (khi edit) */}
                                    <TouchableOpacity
                                        onPress={() => {
                                            if (isEditing) {
                                                handleRename(tag.id);
                                            } else {
                                                // ✅ FIX BUG: set cả editingId VÀ editValue khi click pencil
                                                setEditingId(tag.id);
                                                setEditValue(tag.name);
                                            }
                                        }}
                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                        style={[
                                            styles.pencilBtn,
                                            isEditing && { backgroundColor: colors.primary + '18' },
                                        ]}
                                    >
                                        <MaterialCommunityIcons
                                            name={isEditing ? 'check' : 'pencil'}
                                            size={isEditing ? 20 : 18}
                                            color={isEditing ? colors.primary : (isDark ? '#9ca3af' : '#6b7280')}
                                        />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={async () => {
                            // ✅ Lưu pending rename trước khi đóng
                            if (editingId && editValue.trim()) {
                                await handleRename(editingId);
                            } else if (newLabelName.trim()) {
                                await handleCreate();
                            }
                            onClose();
                        }}>
                            <Text style={[styles.doneText, { color: dc.text }]}>Xong</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: 300,
        borderRadius: 8,
        padding: 8,
        elevation: 24,
    },
    header: {
        fontSize: 16,
        fontFamily: 'Inter-Medium',
        padding: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 8,
        height: 48,
        gap: 10,
    },
    input: {
        flex: 1,
        fontSize: 14,
        fontFamily: 'Inter-Regular',
        ...Platform.select({ web: { outlineStyle: 'none' } as any }),
    },
    pencilBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    errorText: {
        fontSize: 12,
        fontFamily: 'Inter-Regular',
        color: '#ef4444',
        paddingHorizontal: 16,
        paddingBottom: 6,
        marginTop: -2,
    },
    footer: {
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#dadce0',
        marginTop: 8,
        padding: 8,
        alignItems: 'flex-end',
    },
    doneText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        paddingHorizontal: 8,
    },
});