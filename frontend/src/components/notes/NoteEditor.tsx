import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { NoteCardData, TodoItemData } from './NoteCard';
import { useEffect, useState } from 'react';

interface NoteEditorProps {
  visible: boolean;
  mode: 'text' | 'todo';
  note?: NoteCardData;
  onClose: () => void;
  onSave: (note: NoteCardData) => void;
}

export function NoteEditor({ visible, mode, note, onClose, onSave }: NoteEditorProps) {
  const initialTitle = note?.title ?? '';
  const initialContent = note?.content_text ?? '';
  const initialTodoItems = note?.todo_items?.length ? note.todo_items : [
    { id: `${Date.now()}-1`, title: '', is_completed: false },
  ];

  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [todoItems, setTodoItems] = useState<TodoItemData[]>(initialTodoItems);

  useEffect(() => {
    if (!visible) return;
    setTitle(initialTitle);
    setContent(initialContent);
    setTodoItems(initialTodoItems);
  }, [visible, initialTitle, initialContent, initialTodoItems]);

  const handleToggleTodo = (id: string) => {
    setTodoItems((prev) => prev.map((item) => item.id === id ? { ...item, is_completed: !item.is_completed } : item));
  };

  const handleChangeTodo = (id: string, value: string) => {
    setTodoItems((prev) => prev.map((item) => item.id === id ? { ...item, title: value } : item));
  };

  const handleAddTodo = () => {
    setTodoItems((prev) => [
      ...prev,
      { id: `${Date.now()}-${prev.length + 1}`, title: '', is_completed: false },
    ]);
  };

  const handleRemoveTodo = (id: string) => {
    setTodoItems((prev) => prev.filter((item) => item.id !== id));
  };

  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  const handleSave = () => {
    const cleanedTodoItems = todoItems.filter((item) => item.title.trim().length > 0);
    const updatedNote: NoteCardData = {
      id: note?.id ?? `${Date.now()}`,
      type: mode,
      color: note?.color ?? 'default',
      title: title.trim() || undefined,
      content_text: mode === 'text' ? content.trim() || undefined : undefined,
      todo_items: mode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: mode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: mode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      is_pinned: note?.is_pinned ?? false,
      tags: note?.tags,
      collaborators: note?.collaborators,
      date: note?.date,
    };

    onSave(updatedNote);
    onClose();
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.panel, isCompact ? styles.panelFull : styles.panelPopup]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{note ? 'Chỉnh sửa ghi chú' : `Tạo note ${mode === 'text' ? 'văn bản' : 'To-do list'}`}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Feather name="x" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Tiêu đề ghi chú"
              placeholderTextColor={colors.textPlaceholder}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {mode === 'text' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Viết ghi chú..."
                placeholderTextColor={colors.textPlaceholder}
                style={[styles.input, styles.textarea]}
                multiline
                textAlignVertical="top"
              />
            </View>
          ) : (
            <View style={styles.field}>
              <Text style={styles.label}>Danh sách việc cần làm</Text>
              {todoItems.map((item) => (
                <View key={item.id} style={styles.todoRow}>
                  <TouchableOpacity
                    style={[styles.todoCheckbox, item.is_completed && styles.todoCheckboxChecked]}
                    onPress={() => handleToggleTodo(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.is_completed && <Feather name="check" size={14} color="#fff" />}
                  </TouchableOpacity>
                  <TextInput
                    value={item.title}
                    onChangeText={(value) => handleChangeTodo(item.id, value)}
                    placeholder="Thêm công việc..."
                    placeholderTextColor={colors.textPlaceholder}
                    style={[styles.input, styles.todoInput]}
                  />
                  <TouchableOpacity onPress={() => handleRemoveTodo(item.id)} style={styles.removeBtn} activeOpacity={0.7}>
                    <Feather name="trash-2" size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity onPress={handleAddTodo} style={styles.addTodoBtn} activeOpacity={0.7}>
                <Feather name="plus" size={16} color={colors.primary} />
                <Text style={styles.addTodoText}>Thêm mục mới</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]} activeOpacity={0.7}>
            <Text style={[styles.buttonText, styles.cancelText]}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave} style={[styles.button, styles.saveButton]} activeOpacity={0.7}>
            <Text style={[styles.buttonText, styles.saveText]}>Lưu</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayLight,
  },
  panel: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
  panelPopup: {
    width: '92%',
    maxWidth: 720,
    maxHeight: '85%',
    borderRadius: 24,
    padding: 24,
  },
  panelFull: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 18,
  },
  body: {
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.primarySubtle,
  },
  textarea: {
    minHeight: 160,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todoCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  todoCheckboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  todoInput: {
    flex: 1,
    marginRight: 10,
  },
  removeBtn: {
    padding: 6,
  },
  addTodoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.primarySubtle,
  },
  addTodoText: {
    marginLeft: 8,
    color: colors.primary,
    fontFamily: 'Inter-Medium',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    minWidth: 100,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.bgSurface,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  cancelText: {
    color: colors.textSecondary,
  },
  saveText: {
    color: '#fff',
  },
});
