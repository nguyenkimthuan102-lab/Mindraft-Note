import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { NoteCardData, TodoItemData } from './NoteCard';
import { useEffect, useState, useRef } from 'react';

const isWeb = Platform.OS === 'web';
const WebDiv = 'div' as any;

const cardColorMap: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
  green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
  pink: '#FDCFE8', brown: '#F0E6DA',
};

const NOTE_COLORS = [
  { key: 'default', bg: '#FFFFFF' }, { key: 'red', bg: '#FADADD' },
  { key: 'orange', bg: '#FEEFC3' }, { key: 'yellow', bg: '#FEF7CD' },
  { key: 'green', bg: '#E2F3E8' }, { key: 'teal', bg: '#D0F4EE' },
  { key: 'blue', bg: '#D3E3FD' }, { key: 'purple', bg: '#E8DEFC' },
  { key: 'pink', bg: '#FDCFE8' }, { key: 'brown', bg: '#F0E6DA' },
];

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

// Tooltip wrapper
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  if (!isWeb) return <>{children}</>;
  return (
    <View 
      style={{ position: 'relative' }}
      {...{ onMouseEnter: () => setShow(true), onMouseLeave: () => setShow(false) } as any}
    >
      {children}
      {show && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      )}
    </View>
  );
}

function ToolbarBtn({ icon, onPress, label, isActive, isFormatActive }: { icon: string, onPress: () => void, label: string, isActive?: boolean, isFormatActive?: boolean }) {
  return (
    <Tooltip label={label}>
      <TouchableOpacity onPress={onPress} style={[
        styles.toolbarIcon, 
        isActive && styles.toolbarIconActive,
        isFormatActive && { backgroundColor: 'rgba(0, 0, 0, 0.08)' }
      ]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={isActive ? colors.primary : colors.textSecondary} />
      </TouchableOpacity>
    </Tooltip>
  );
}

function MenuBtn({ label, onPress }: { label: string, onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function NoteEditor({ visible, mode, note, onClose, onSave }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content_text ?? '');
  const [todoItems, setTodoItems] = useState<TodoItemData[]>(note?.todo_items?.length ? note.todo_items : [
    { id: `${Date.now()}-1`, title: '', is_completed: false },
  ]);
  const [isPinned, setIsPinned] = useState(note?.is_pinned ?? false);
  const [noteColor, setNoteColor] = useState(note?.color ?? 'default');
  
  // UI states
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showFormattingBar, setShowFormattingBar] = useState(false);
  const [editorMode, setEditorMode] = useState(mode);
  const [isContentEmpty, setIsContentEmpty] = useState(!note?.content_text);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    block: 'div',
  });

  const contentRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) return;
    setTitle(note?.title ?? '');
    setContent(note?.content_text ?? '');
    setTodoItems(note?.todo_items?.length ? note.todo_items : [
      { id: `${Date.now()}-1`, title: '', is_completed: false },
    ]);
    setIsPinned(note?.is_pinned ?? false);
    setNoteColor(note?.color ?? 'default');
    
    setEditorMode(mode);
    setShowColorPicker(false);
    setShowMoreMenu(false);
    setShowFormattingBar(false);
    setIsContentEmpty(!note?.content_text);
  }, [visible, note, mode]);

  const { width } = useWindowDimensions();
  const isCompact = width < 720;

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


  const handleToggleMode = () => {
    if (editorMode === 'text') {
      const plainText = isWeb && contentRef.current ? contentRef.current.innerText : content;
      const lines = (plainText || '').split('\n').filter((l: string) => l.trim() !== '');
      if (lines.length > 0) {
        setTodoItems(lines.map((l: string, i: number) => ({ id: `${Date.now()}-${i}`, title: l, is_completed: false })));
      } else {
        setTodoItems([{ id: `${Date.now()}-1`, title: '', is_completed: false }]);
      }
      setEditorMode('todo');
    } else {
      const text = todoItems.filter(t => t.title.trim()).map(t => t.title).join('\n');
      setContent(text);
      setIsContentEmpty(!text.trim());
      setEditorMode('text');
    }
    setShowMoreMenu(false);
  };

  const updateFormattingState = () => {
    if (!isWeb) return;
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      block: document.queryCommandValue('formatBlock') || 'div',
    });
  };

  const handleFormat = (command: string, val?: string) => {
    if (isWeb) {
      document.execCommand(command, false, val);
      if (contentRef.current) contentRef.current.focus();
      updateFormattingState();
    } else {
      alert('Định dạng văn bản hiện chỉ hỗ trợ trên Web.');
    }
  };

  const handleUndo = () => { if (isWeb) document.execCommand('undo'); };
  const handleRedo = () => { if (isWeb) document.execCommand('redo'); };

  const handleSaveAndClose = () => {
    let currentContent = content;
    if (editorMode === 'text') {
      currentContent = isWeb && contentRef.current ? contentRef.current.innerHTML : content;
    }

    const cleanedTodoItems = todoItems.filter((item) => item.title.trim().length > 0);
    const hasContent = title.trim() || (editorMode === 'text' ? currentContent.trim().replace(/<[^>]*>?/gm, '') : cleanedTodoItems.length > 0);
    
    if (!hasContent) {
      onClose();
      return;
    }

    const updatedNote: NoteCardData = {
      ...note,
      id: note?.id ?? `${Date.now()}`,
      type: editorMode,
      color: noteColor,
      title: title.trim() || undefined,
      content_text: editorMode === 'text' ? currentContent.trim() || undefined : undefined,
      todo_items: editorMode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: editorMode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: editorMode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      is_pinned: isPinned,
    };

    onSave(updatedNote);
    onClose();
  };


  if (!visible) return null;

  const bg = cardColorMap[noteColor] ?? cardColorMap.default;

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleSaveAndClose} />
      <View style={[styles.panel, isCompact ? styles.panelFull : styles.panelPopup, { backgroundColor: bg }]}>
        
        {/* Header */}
        <View style={styles.headerRow}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.titleInput}
            returnKeyType="done"
          />
          <Tooltip label={isPinned ? "Bỏ ghim ghi chú" : "Ghim ghi chú"}>
            <TouchableOpacity onPress={() => setIsPinned(!isPinned)} style={styles.iconBtn}>
              <MaterialCommunityIcons 
                name={isPinned ? "pin" : "pin-outline"} 
                size={24} 
                color={isPinned ? colors.primary : colors.textSecondary} 
              />
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Body */}
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          {editorMode === 'text' ? (
            <View style={{ position: 'relative' }}>
              {isWeb ? (
                <>
                  {isContentEmpty && (
                    <Text style={[styles.contentInput, { position: 'absolute', top: 0, opacity: 0.5, pointerEvents: 'none' }]}>
                      Tạo ghi chú...
                    </Text>
                  )}
                  <WebDiv
                    ref={contentRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: content ? content.replace(/\n/g, '<br>') : '' }}
                    onInput={(e: any) => setIsContentEmpty(!e.currentTarget.textContent?.trim())}
                    onKeyUp={updateFormattingState}
                    onMouseUp={updateFormattingState}
                    onFocus={updateFormattingState}
                    style={{
                      outline: 'none',
                      minHeight: 120,
                      paddingBottom: 20,
                      fontFamily: 'Inter-Regular',
                      fontSize: 16,
                      color: colors.textSecondary,
                      lineHeight: 1.5,
                      cursor: 'text',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  />
                </>
              ) : (
                <View style={{ position: 'relative' }}>
                  <Text style={[styles.contentInput, styles.textarea, { opacity: 0, paddingBottom: 20 }]}>
                    {content ? content + ' \n' : ' '}
                  </Text>
                  <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Tạo ghi chú..."
                    placeholderTextColor={colors.textPlaceholder}
                    style={[styles.contentInput, styles.textarea, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
                    multiline
                    textAlignVertical="top"
                    scrollEnabled={false}
                    autoFocus={!note?.content_text}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.todoList}>
              {todoItems.map((item) => (
                <View key={item.id} style={styles.todoRow}>
                  <TouchableOpacity
                    style={[styles.todoCheckbox, item.is_completed && styles.todoCheckboxChecked]}
                    onPress={() => handleToggleTodo(item.id)}
                    activeOpacity={0.7}
                  >
                    {item.is_completed && <MaterialCommunityIcons name="check" size={16} color="#fff" />}
                  </TouchableOpacity>
                  <TextInput
                    value={item.title}
                    onChangeText={(value) => handleChangeTodo(item.id, value)}
                    placeholder="Mục danh sách"
                    placeholderTextColor={colors.textPlaceholder}
                    style={[styles.todoInput, item.is_completed && styles.todoInputChecked]}
                    multiline
                  />
                  <TouchableOpacity onPress={() => handleRemoveTodo(item.id)} style={styles.removeBtn}>
                    <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={[styles.todoRow, styles.addTodoRow]}>
                 <TouchableOpacity style={styles.addTodoBtn} onPress={handleAddTodo}>
                    <MaterialCommunityIcons name="plus" size={20} color={colors.textSecondary} />
                 </TouchableOpacity>
                 <TextInput
                    placeholder="Mục danh sách"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.todoInput}
                    onFocus={handleAddTodo}
                 />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Formatting Bar */}
        {showFormattingBar && editorMode === 'text' && (
          <View style={styles.formattingBar}>
            <ToolbarBtn icon="format-header-1" onPress={() => handleFormat('formatBlock', 'H1')} label="Tiêu đề 1" isFormatActive={activeFormats.block.toLowerCase() === 'h1'} />
            <ToolbarBtn icon="format-header-2" onPress={() => handleFormat('formatBlock', 'H2')} label="Tiêu đề 2" isFormatActive={activeFormats.block.toLowerCase() === 'h2'} />
            <ToolbarBtn icon="format-paragraph" onPress={() => handleFormat('formatBlock', 'DIV')} label="Văn bản thường" isFormatActive={activeFormats.block.toLowerCase() === 'div' || activeFormats.block.toLowerCase() === 'p'} />
            <View style={styles.divider} />
            <ToolbarBtn icon="format-bold" onPress={() => handleFormat('bold')} label="In đậm" isFormatActive={activeFormats.bold} />
            <ToolbarBtn icon="format-italic" onPress={() => handleFormat('italic')} label="In nghiêng" isFormatActive={activeFormats.italic} />
            <ToolbarBtn icon="format-underline" onPress={() => handleFormat('underline')} label="Gạch chân" isFormatActive={activeFormats.underline} />
            <ToolbarBtn icon="format-strikethrough-variant" onPress={() => handleFormat('strikeThrough')} label="Gạch ngang" isFormatActive={activeFormats.strikeThrough} />
            <View style={styles.divider} />
            <ToolbarBtn icon="format-clear" onPress={() => handleFormat('removeFormat')} label="Xóa định dạng" />
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.toolbarLeft}>
            <ToolbarBtn icon="bell-plus-outline" onPress={() => alert('Nhắc nhở sẽ được lưu qua API')} label="Nhắc nhở" />
            <ToolbarBtn icon="account-plus-outline" onPress={() => alert('Cộng tác viên sẽ được gọi API')} label="Cộng tác viên" />
            <ToolbarBtn icon="palette-outline" onPress={() => { setShowColorPicker(!showColorPicker); setShowMoreMenu(false); }} label="Tùy chọn nền" />
            <ToolbarBtn icon="image-outline" onPress={() => alert('Thêm hình ảnh sẽ xử lý upload file')} label="Thêm hình ảnh" />
            <ToolbarBtn icon="archive-arrow-down-outline" onPress={() => alert('Ghi chú đã được lưu trữ (Cần API)')} label="Lưu trữ" />
            
            <View style={{ position: 'relative', zIndex: 300 }}>
              <ToolbarBtn icon="dots-vertical" onPress={() => { setShowMoreMenu(!showMoreMenu); setShowColorPicker(false); }} label="Thêm tùy chọn" />
              {showMoreMenu && (
                <View style={styles.moreMenu}>
                  <MenuBtn onPress={() => { alert('Xóa ghi chú (Cần API)'); setShowMoreMenu(false); }} label="Xóa ghi chú" />
                  <MenuBtn onPress={() => { alert('Thêm nhãn (Cần API)'); setShowMoreMenu(false); }} label="Thêm nhãn" />
                  <MenuBtn onPress={() => { alert('Tạo bản sao (Cần API)'); setShowMoreMenu(false); }} label="Tạo bản sao" />
                  <MenuBtn onPress={handleToggleMode} label={editorMode === 'text' ? "Hiển thị hộp kiểm" : "Ẩn hộp kiểm"} />
                  <MenuBtn onPress={() => { alert('Lịch sử phiên bản (Cần API)'); setShowMoreMenu(false); }} label="Lịch sử phiên bản" />
                </View>
              )}
            </View>

            {editorMode === 'text' && (
              <ToolbarBtn icon="format-text" onPress={() => setShowFormattingBar(!showFormattingBar)} isActive={showFormattingBar} label="Tùy chọn định dạng" />
            )}
          </View>

          <View style={styles.toolbarRight}>
            <Tooltip label={note?.date ? `Đã tạo ${note.date}` : "Đã tạo lúc nãy"}>
              <Text style={styles.editedTimeText}>
                {note?.date ? `Đã chỉnh sửa ${note.date}` : "Đã chỉnh sửa lúc nãy"}
              </Text>
            </Tooltip>
            <ToolbarBtn icon="undo" onPress={handleUndo} label="Hoàn tác" />
            <ToolbarBtn icon="redo" onPress={handleRedo} label="Làm lại" />
            <TouchableOpacity onPress={handleSaveAndClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Picker Popover */}
        {showColorPicker && (
          <View style={styles.colorPicker}>
            {NOTE_COLORS.map((c) => (
              <TouchableOpacity
                key={c.key}
                style={[styles.colorDot, { backgroundColor: c.bg }, noteColor === c.key && styles.colorDotSelected]}
                onPress={() => { setNoteColor(c.key); setShowColorPicker(false); }}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(32, 33, 36, 0.6)',
  },
  panel: {
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    position: 'relative',
  },
  panelPopup: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '85%',
    borderRadius: 8,
  },
  panelFull: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 12,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleInput: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 20,
    color: colors.textPrimary,
    outlineStyle: 'none',
  } as any,
  iconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  body: {
    paddingHorizontal: 20,
    maxHeight: '75%',
  },
  contentInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    outlineStyle: 'none',
  } as any,
  textarea: {
    minHeight: 120,
    paddingBottom: 20,
  },
  todoList: {
    paddingBottom: 16,
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
    alignItems: 'flex-start',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  addTodoRow: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    paddingTop: 12,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    borderRadius: 2,
    marginTop: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoCheckboxChecked: {
    borderColor: colors.textTertiary,
  },
  todoInput: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
    minHeight: 24,
    outlineStyle: 'none',
  } as any,
  todoInputChecked: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  addTodoBtn: {
    marginRight: 12,
    marginTop: 2,
  },
  formattingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderDefault,
    marginHorizontal: 8,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  toolbarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolbarIcon: {
    padding: 8,
    borderRadius: 20,
  },
  toolbarIconActive: {
    backgroundColor: colors.primarySubtle,
  },
  moreMenu: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  menuItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  closeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: colors.textPrimary,
  },
  colorPicker: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    width: 260,
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    zIndex: 200,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  colorDotSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 999,
    marginBottom: 4,
    ...Platform.select({ web: { transform: 'translateX(-50%)' } as any }),
  },
  tooltipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#fff',
    ...Platform.select({ web: { whiteSpace: 'nowrap' } as any }),
  },
  editedTimeText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary || '#80868b',
    marginRight: 8,
    ...Platform.select({ web: { cursor: 'default' } as any }),
  },
});

