import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';
import { createTag, renameTag, deleteTag } from '../../api/tagApi';

interface EditLabelsModalProps {
    visible: boolean;
    onClose: () => void;
}

export function EditLabelsModal({ visible, onClose }: EditLabelsModalProps) {
    const { theme, tags, fetchTags } = useAppStore();
    const isDark = theme === 'dark';

    const [newLabelName, setNewLabelName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const handleCreate = async () => {
        if (!newLabelName.trim()) return;
        await createTag(newLabelName.trim());
        setNewLabelName('');
        fetchTags();
    };

    const handleRename = async (id: string) => {
        if (!editValue.trim()) return;
        await renameTag(id, editValue.trim());
        setEditingId(null);
        fetchTags();
    };

    const handleDelete = async (id: string) => {
        await deleteTag(id);
        fetchTags();
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
                        <MaterialCommunityIcons name={newLabelName ? "close" : "plus"} size={22} color={dc.text} onPress={() => setNewLabelName('')} />
                        <TextInput
                            style={[styles.input, { color: dc.text }]}
                            placeholder="Tạo nhãn mới"
                            placeholderTextColor="#9ca3af"
                            value={newLabelName}
                            onChangeText={setNewLabelName}
                            onSubmitEditing={handleCreate}
                        />
                        {newLabelName.length > 0 && (
                            <TouchableOpacity onPress={handleCreate}><MaterialCommunityIcons name="check" size={22} color={dc.text} /></TouchableOpacity>
                        )}
                    </View>

                    <ScrollView style={{ maxHeight: 300 }}>
                        {tags.map(tag => (
                            <View key={tag.id} style={styles.row}>
                                <TouchableOpacity onPress={() => handleDelete(tag.id)}>
                                    <MaterialCommunityIcons name="trash-can-outline" size={22} color={dc.text} />
                                </TouchableOpacity>
                                <TextInput
                                    style={[styles.input, { color: dc.text, borderBottomWidth: editingId === tag.id ? 1 : 0, borderBottomColor: colors.primary }]}
                                    value={editingId === tag.id ? editValue : tag.name}
                                    onChangeText={setEditValue}
                                    onFocus={() => { setEditingId(tag.id); setEditValue(tag.name); }}
                                    onSubmitEditing={() => handleRename(tag.id)}
                                />
                                <TouchableOpacity onPress={() => editingId === tag.id ? handleRename(tag.id) : setEditingId(tag.id)}>
                                    <MaterialCommunityIcons name={editingId === tag.id ? "check" : "pencil"} size={20} color={dc.text} />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity onPress={onClose}><Text style={[styles.doneText, { color: dc.text }]}>Xong</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    container: { width: 300, borderRadius: 8, padding: 8, elevation: 24 },
    header: { fontSize: 16, fontFamily: 'Inter-Medium', padding: 12 },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 48, gap: 12 },
    input: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', ...Platform.select({ web: { outlineStyle: 'none' } as any }) },
    footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#dadce0', marginTop: 8, padding: 8, alignItems: 'flex-end' },
    doneText: { fontFamily: 'Inter-SemiBold', fontSize: 14, paddingHorizontal: 8 }
});