import React, { useState, useEffect } from 'react';
import { 
  Modal, View, TextInput, StyleSheet, TouchableOpacity, 
  Text, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { useNoteStore } from '../../store/useNoteStore';

// ✅ Đường dẫn chuẩn từ components/notes/ ra đến api/
import { createNote, updateNote as updateNoteApi } from '../../api/noteApi';

const COLORS = [
  { name: 'default', value: '#FFFFFF' },
  { name: 'yellow', value: '#FFF9C4' },
  { name: 'blue', value: '#E3F2FD' },
  { name: 'green', value: '#E8F5E9' },
  { name: 'red', value: '#FFEBEE' },
];

export const NoteEditor = () => {
  const { 
    editorVisible, closeEditor, editingNote, editorMode,
    addNote, updateNote 
  } = useNoteStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('default');

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title || '');
      setContent(editingNote.content_text || '');
      setSelectedColor(editingNote.color || 'default');
    } else {
      setTitle('');
      setContent('');
      setSelectedColor('default');
    }
  }, [editingNote, editorVisible]);

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      closeEditor();
      return;
    }

    const noteData = {
      title,
      content_text: content,
      type: editorMode,
      color: selectedColor,
      is_pinned: editingNote?.is_pinned || false,
    };

    try {
      if (editingNote) {
        // Cập nhật Local
        updateNote(editingNote.id, noteData);
        // Cập nhật Server
        await updateNoteApi(editingNote.id, noteData as any);
      } else {
        // Tạo mới trên Server
        const newNote = await createNote(noteData as any);
        if (newNote) {
          // ✅ Ép kiểu 'as any' để bỏ qua lỗi null/undefined từ API
          addNote(newNote as any); 
        }
      }
    } catch (err) {
      console.error("Lỗi lưu ghi chú:", err);
    }
    closeEditor();
  };

  return (
    <Modal visible={editorVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={closeEditor}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={closeEditor} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.black} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveText}>Xong</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={[styles.editorBody, { backgroundColor: COLORS.find(c => c.name === selectedColor)?.value }]}>
          <TextInput
            placeholder="Tiêu đề"
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.grayText}
          />
          <TextInput
            placeholder={editorMode === 'todo' ? "Thêm việc cần làm..." : "Bắt đầu viết..."}
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            multiline
            placeholderTextColor={colors.grayText}
            autoFocus={!editingNote}
          />
        </ScrollView>

        <View style={styles.toolbar}>
          <View style={styles.colorPicker}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c.name}
                onPress={() => setSelectedColor(c.name)}
                style={[
                  styles.colorCircle,
                  { backgroundColor: c.value },
                  selectedColor === c.name && styles.activeColor
                ]}
              />
            ))}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.grayBorder,
  },
  closeBtn: { padding: 4 },
  saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  saveText: { color: colors.white, fontWeight: '700', fontSize: 14 },
  editorBody: { flex: 1, padding: 20 },
  titleInput: { fontSize: 24, fontWeight: '800', color: colors.black, marginBottom: 16 },
  contentInput: { fontSize: 17, color: '#333', lineHeight: 26, minHeight: 300, textAlignVertical: 'top' },
  toolbar: { padding: 16, borderTopWidth: 1, borderTopColor: colors.grayBorder, backgroundColor: '#fff' },
  colorPicker: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  colorCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, borderColor: '#eee' },
  activeColor: { borderWidth: 2, borderColor: colors.primary },
});