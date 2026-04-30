import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions, Image } from 'react-native';
import { Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { colors, cardColorMap } from '../../constants/colors';
import { NoteCardData, TodoItemData } from './NoteCard';
import { useEffect, useState } from 'react';

type TextFormat = 'normal' | 'h1' | 'h2' | 'bold' | 'italic' | 'underline';

type EditorSnapshot = {
  title: string;
  content: string;
  todoItems: TodoItemData[];
  selectedFormat: TextFormat;
  editorBgColor: string;
  reminder: string;
  collaborators: string[];
  labels: string[];
  images: string[];
};

interface NoteEditorProps {
  visible: boolean;
  mode: 'text' | 'todo';
  note?: NoteCardData;
  onClose: () => void;
  onSave: (note: NoteCardData) => void;
}

export function NoteEditor({ visible, mode, note, onClose, onSave }: NoteEditorProps) {
  const { width } = useWindowDimensions();
  const isCompact = width < 720;
  const [isFullEditor, setIsFullEditor] = useState(false);
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content_text ?? '');
  const [todoItems, setTodoItems] = useState<TodoItemData[]>(
    note?.todo_items?.length ? note.todo_items : [{ id: `${Date.now()}-1`, title: '', is_completed: false }],
  );
  const [selectedFormat, setSelectedFormat] = useState<TextFormat>('normal');
  const [editorBgColor, setEditorBgColor] = useState(note?.color ?? 'default');
  const [reminder, setReminder] = useState(note?.reminder ?? '');
  const [collaborators, setCollaborators] = useState<string[]>(note?.collaborators?.map((c) => c.name) ?? []);
  const [labels, setLabels] = useState<string[]>(note?.tags ?? []);
  const [images, setImages] = useState<string[]>(note?.images ?? []);
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [undoStack, setUndoStack] = useState<EditorSnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<EditorSnapshot[]>([]);

  const initialSnapshot: EditorSnapshot = {
    title: note?.title ?? '',
    content: note?.content_text ?? '',
    todoItems: note?.todo_items?.length ? note.todo_items : [{ id: `${Date.now()}-1`, title: '', is_completed: false }],
    selectedFormat: 'normal',
    editorBgColor: note?.color ?? 'default',
    reminder: note?.reminder ?? '',
    collaborators: note?.collaborators?.map((c) => c.name) ?? [],
    labels: note?.tags ?? [],
    images: note?.images ?? [],
  };

  useEffect(() => {
    if (!visible) return;
    setTitle(initialSnapshot.title);
    setContent(initialSnapshot.content);
    setTodoItems(initialSnapshot.todoItems);
    setSelectedFormat(initialSnapshot.selectedFormat);
    setEditorBgColor(initialSnapshot.editorBgColor);
    setReminder(initialSnapshot.reminder);
    setCollaborators(initialSnapshot.collaborators);
    setLabels(initialSnapshot.labels);
    setImages(initialSnapshot.images);
    setUndoStack([]);
    setRedoStack([]);
    setShowFormatOptions(false);
    setShowColorPicker(false);
    setShowMoreMenu(false);
    setIsFullEditor(false);
  }, [visible, note?.tags, note?.color, note?.content_text, note?.reminder, note?.todo_items, note?.collaborators, note?.title]);

  const saveSnapshot = () => {
    setUndoStack((prev) => [
      ...prev,
      {
        title,
        content,
        todoItems,
        selectedFormat,
        editorBgColor,
        reminder,
        collaborators,
        labels,
        images,
      },
    ]);
    setRedoStack([]);
  };

  const updateState = (updater: () => void) => {
    saveSnapshot();
    updater();
  };

  const handleToggleTodo = (id: string) => {
    updateState(() => {
      setTodoItems((prev) => prev.map((item) => item.id === id ? { ...item, is_completed: !item.is_completed } : item));
    });
  };

  const handleChangeTodo = (id: string, value: string) => {
    updateState(() => {
      setTodoItems((prev) => prev.map((item) => item.id === id ? { ...item, title: value } : item));
    });
  };

  const handleAddTodo = () => {
    updateState(() => {
      setTodoItems((prev) => [
        ...prev,
        { id: `${Date.now()}-${prev.length + 1}`, title: '', is_completed: false },
      ]);
    });
  };

  const handleRemoveTodo = (id: string) => {
    updateState(() => {
      setTodoItems((prev) => prev.filter((item) => item.id !== id));
    });
  };

  const handleFormatChange = (format: TextFormat) => {
    saveSnapshot();
    setSelectedFormat(format);
    setShowFormatOptions(false);
  };

  const handleColorSelect = (color: string) => {
    saveSnapshot();
    setEditorBgColor(color);
    setShowColorPicker(false);
  };

  const handleSave = () => {
    const cleanedTodoItems = todoItems.filter((item) => item.title.trim().length > 0);
    onSave({
      ...note,
      id: note?.id ?? `${Date.now()}`,
      type: mode,
      color: editorBgColor,
      title: title.trim() || undefined,
      content_text: mode === 'text' ? content.trim() || undefined : undefined,
      todo_items: mode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: mode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: mode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      is_pinned: note?.is_pinned ?? false,
      tags: labels,
      collaborators: collaborators.map((name) => ({ name })),
      date: note?.date,
      reminder,
      images,
    } as NoteCardData);
    onClose();
  };

  const handleUndo = () => {
    if (!undoStack.length) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRedoStack((prev) => [
      ...prev,
      { title, content, todoItems, selectedFormat, editorBgColor, reminder, collaborators, labels, images },
    ]);
    setTitle(last.title);
    setContent(last.content);
    setTodoItems(last.todoItems);
    setSelectedFormat(last.selectedFormat);
    setEditorBgColor(last.editorBgColor);
    setReminder(last.reminder);
    setCollaborators(last.collaborators);
    setLabels(last.labels);
    setImages(last.images);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((prev) => prev.slice(0, -1));
    setUndoStack((prev) => [
      ...prev,
      { title, content, todoItems, selectedFormat, editorBgColor, reminder, collaborators, labels, images },
    ]);
    setTitle(next.title);
    setContent(next.content);
    setTodoItems(next.todoItems);
    setSelectedFormat(next.selectedFormat);
    setEditorBgColor(next.editorBgColor);
    setReminder(next.reminder);
    setCollaborators(next.collaborators);
    setLabels(next.labels);
    setImages(next.images);
  };

  const handleInsertImage = () => {
    saveSnapshot();
    setImages((prev) => [...prev, 'https://via.placeholder.com/150']);
  };

  const handleAddCollaborator = () => {
    saveSnapshot();
    const placeholder = `User ${collaborators.length + 1}`;
    setCollaborators((prev) => [...prev, placeholder]);
  };

  const handleAddLabel = () => {
    saveSnapshot();
    if (!labels.includes('New label')) {
      setLabels((prev) => [...prev, 'New label']);
    }
    setShowMoreMenu(false);
  };

  const handleArchive = () => {
    const cleanedTodoItems = todoItems.filter((item) => item.title.trim().length > 0);
    onSave({
      ...note,
      id: note?.id ?? `${Date.now()}`,
      type: mode,
      color: editorBgColor,
      title: title.trim() || undefined,
      content_text: mode === 'text' ? content.trim() || undefined : undefined,
      todo_items: mode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: mode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: mode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      is_pinned: note?.is_pinned ?? false,
      tags: labels,
      collaborators: collaborators.map((name) => ({ name })),
      date: note?.date,
      reminder,
      images,
    } as NoteCardData);
    onClose();
  };

  const handleTogglePin = () => {
    const cleanedTodoItems = todoItems.filter((item) => item.title.trim().length > 0);
    onSave({
      ...note,
      id: note?.id ?? `${Date.now()}`,
      type: mode,
      color: editorBgColor,
      title: title.trim() || undefined,
      content_text: mode === 'text' ? content.trim() || undefined : undefined,
      todo_items: mode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: mode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: mode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      is_pinned: !(note?.is_pinned ?? false),
      tags: labels,
      collaborators: collaborators.map((name) => ({ name })),
      date: note?.date,
      reminder,
      images,
    } as NoteCardData);
  };

  const contentStyle = [
    styles.input,
    styles.textarea,
    selectedFormat === 'h1' && styles.textH1,
    selectedFormat === 'h2' && styles.textH2,
    selectedFormat === 'bold' && styles.textBold,
    selectedFormat === 'italic' && styles.textItalic,
    selectedFormat === 'underline' && styles.textUnderline,
  ];

  const editorBgStyle = {
    backgroundColor: cardColorMap[editorBgColor] ?? '#fff',
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.panel, (isCompact || isFullEditor) ? styles.panelFull : styles.panelPopup, editorBgStyle]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>{note ? 'Chỉnh sửa ghi chú' : `Tạo note ${mode === 'text' ? 'văn bản' : 'To-do list'}`}</Text>
            <Text style={styles.subTitle}>Quick Capture</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleTogglePin} style={styles.iconBtn} activeOpacity={0.7}>
              <Feather name={note?.is_pinned ? 'thumbtack' : 'bookmark'} size={18} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsFullEditor((prev) => !prev)} style={styles.iconBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name={isFullEditor ? 'window-minimize' : 'arrow-expand'} size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.field}>
            <Text style={styles.label}>Tiêu đề</Text>
            <TextInput
              value={title}
              onChangeText={(value) => {
                saveSnapshot();
                setTitle(value);
              }}
              placeholder="Tiêu đề ghi chú"
              placeholderTextColor={colors.textPlaceholder}
              style={styles.input}
              returnKeyType="done"
            />
          </View>

          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageRow}>
              {images.map((uri, index) => (
                <Image key={`${uri}-${index}`} source={{ uri }} style={styles.imageThumb} />
              ))}
            </ScrollView>
          )}

          {mode === 'text' ? (
            <View style={styles.field}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                value={content}
                onChangeText={(value) => {
                  saveSnapshot();
                  setContent(value);
                }}
                placeholder="Viết ghi chú..."
                placeholderTextColor={colors.textPlaceholder}
                style={contentStyle}
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

        <View style={styles.metaRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.labelList}>
            {labels.map((labelItem) => (
              <View key={labelItem} style={styles.labelChip}>
                <Text style={styles.labelChipText}>{labelItem}</Text>
              </View>
            ))}
          </ScrollView>
          <Text style={styles.metaText}>{reminder ? `Reminder: ${reminder}` : note?.date ? `Edited ${note.date}` : 'No reminder set'}</Text>
        </View>

        <View style={styles.toolbarRow}>
          <TouchableOpacity onPress={() => setShowFormatOptions((prev) => !prev)} style={styles.toolbarBtn} activeOpacity={0.7}>
            <MaterialIcons name="format-size" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowColorPicker((prev) => !prev)} style={styles.toolbarBtn} activeOpacity={0.7}>
            <MaterialIcons name="format-color-fill" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            saveSnapshot();
            setReminder('Tomorrow 9:00');
          }} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Feather name="bell" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddCollaborator} style={styles.toolbarBtn} activeOpacity={0.7}>
            <MaterialIcons name="person-add" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleInsertImage} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Feather name="image" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleArchive} style={styles.toolbarBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="archive-arrow-down-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowMoreMenu((prev) => !prev)} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Feather name="more-vertical" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUndo} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Feather name="rotate-ccw" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRedo} style={styles.toolbarBtn} activeOpacity={0.7}>
            <Feather name="rotate-cw" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {showFormatOptions && (
          <View style={styles.optionPanel}>
            {['h1', 'h2', 'normal', 'bold', 'italic', 'underline'].map((option) => (
              <TouchableOpacity key={option} style={styles.optionItem} onPress={() => handleFormatChange(option as TextFormat)} activeOpacity={0.7}>
                <Text style={styles.optionText}>{option === 'h1' ? 'Heading 1' : option === 'h2' ? 'Heading 2' : option === 'normal' ? 'Normal' : option === 'bold' ? 'Bold' : option === 'italic' ? 'Italic' : 'Underline'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showColorPicker && (
          <View style={styles.optionPanel}>
            {['default', 'yellow', 'green', 'blue', 'pink', 'orange'].map((colorKey) => (
              <TouchableOpacity key={colorKey} style={styles.colorOption} onPress={() => handleColorSelect(colorKey)} activeOpacity={0.7}>
                <View style={[styles.colorDotSmall, { backgroundColor: cardColorMap[colorKey] ?? '#fff' }]} />
                <Text style={styles.optionText}>{colorKey}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {showMoreMenu && (
          <View style={styles.moreMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowMoreMenu(false)} activeOpacity={0.7}>
              <Text style={styles.optionText}>Xóa ghi chú</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleAddLabel} activeOpacity={0.7}>
              <Text style={styles.optionText}>Gắn/chỉnh sửa nhãn</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowMoreMenu(false)} activeOpacity={0.7}>
              <Text style={styles.optionText}>Tạo bản sao</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowMoreMenu(false)} activeOpacity={0.7}>
              <Text style={styles.optionText}>Tạo danh sách to-do</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={() => setShowMoreMenu(false)} activeOpacity={0.7}>
              <Text style={styles.optionText}>Xem lịch sử bản ghi</Text>
            </TouchableOpacity>
          </View>
        )}

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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: colors.textPrimary,
  },
  subTitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    marginLeft: 8,
  },
  closeBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    marginLeft: 8,
  },
  body: {
    flex: 1,
  },
  field: {
    marginBottom: 18,
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
  textH1: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
  },
  textH2: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
  },
  textBold: {
    fontWeight: '700',
  },
  textItalic: {
    fontStyle: 'italic',
  },
  textUnderline: {
    textDecorationLine: 'underline',
  },
  imageRow: {
    marginBottom: 16,
  },
  imageThumb: {
    width: 100,
    height: 70,
    borderRadius: 14,
    marginRight: 12,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  labelList: {
    flexDirection: 'row',
    gap: 8,
  },
  labelChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.bgSurface,
  },
  labelChipText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  metaText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  toolbarBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
  },
  optionPanel: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  optionItem: {
    paddingVertical: 10,
  },
  optionText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  colorDotSmall: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  moreMenu: {
    position: 'absolute',
    right: 24,
    bottom: 110,
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 10,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 15,
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
