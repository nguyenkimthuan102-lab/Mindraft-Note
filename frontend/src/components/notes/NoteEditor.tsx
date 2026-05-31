import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, useWindowDimensions, Platform, Keyboard, BackHandler
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { NoteCardData, TodoItemData } from './NoteCard';
import { useEffect, useState, useRef } from 'react';
import { useNoteStore, mapApiTodoItems } from '../../store/useNoteStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TagMenu } from './TagMenu';
import { exportToTxt, exportToPdf, exportToDocx } from '../../utils/exportNote';
import api from '../../api/axiosClient';
import { useReminderStore } from '@/src/store/useReminderStore';
import { useLocalNotification } from '@/src/hooks/useLocalNotification';
import { NoteImageUploader } from './NoteImageUploader';
import { addTagToNote, removeTagFromNote, Tag } from '../../api/tagApi';
import { useRouter } from 'expo-router';

const isWeb = Platform.OS === 'web';
const WebDiv = 'div' as any;

// ── XÓA: contentRef và mobileContentRef đặt ở top-level vi phạm Rules of Hooks
// Các ref này đã được khai báo lại đúng chỗ bên trong component NoteEditor bên dưới

const cardColorMap: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
  green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
  pink: '#FDCFE8', brown: '#F0E6DA',
};

const NOTE_COLORS = [
  { key: 'default', bg: '#FFFFFF' }, { key: 'red',    bg: '#FADADD' },
  { key: 'orange',  bg: '#FEEFC3' }, { key: 'yellow', bg: '#FEF7CD' },
  { key: 'green',   bg: '#E2F3E8' }, { key: 'teal',   bg: '#D0F4EE' },
  { key: 'blue',    bg: '#D3E3FD' }, { key: 'purple', bg: '#E8DEFC' },
  { key: 'pink',    bg: '#FDCFE8' }, { key: 'brown',  bg: '#F0E6DA' },
];

// ── XÓA: EditorSnapshot không dùng tới ─────────────────────────────────────

interface NoteEditorProps {
  visible: boolean;
  mode: 'text' | 'todo';
  note?: NoteCardData;
  inline?: boolean;
  readOnly?: boolean;
}

function isServerTodoId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

function isRealNoteId(noteId?: string): boolean {
  return !!noteId && !noteId.startsWith('temp-');
}

function Tooltip({ label, children, position = 'top' }: { label: string; children: React.ReactNode; position?: 'top' | 'bottom' }) {
  const [show, setShow] = useState(false);
  if (!isWeb) return <>{children}</>;
  return (
    <View
      style={{ position: 'relative', zIndex: show ? 1000 : 1 }}
      {...{ onMouseEnter: () => setShow(true), onMouseLeave: () => setShow(false) } as any}
    >
      {children}
      {show && (
        <View style={[styles.tooltip, position === 'bottom' && styles.tooltipBottom]}>
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

function MenuBtn({ label, onPress, disabled }: { label: string, onPress: () => void, disabled?: boolean }) {
  return (
    <TouchableOpacity
      onPress={(e) => {
        e.stopPropagation();
        if (!disabled) onPress();
      }}
      style={[styles.menuItem, disabled && { opacity: 0.5 }]}
      disabled={disabled}
    >
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function NoteEditor({ visible, mode, note, inline, readOnly }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content_text ?? '');

  const {
    allTags, addTagToSystem, saveNoteAction,
    closeEditor, archiveNoteAction, trashNoteAction,
    clearCompletedTodosAction,
    notes, // FIX: subscribe to notes so we can sync local state after store updates
  } = useNoteStore();

  const { createReminderAction } = useReminderStore();
  const { scheduleReminderNotification } = useLocalNotification();

  const [htmlConfig, setHtmlConfig] = useState({ __html: (note?.content_text ?? '').replace(/\n/g, '<br>') });

  const [todoItems, setTodoItems] = useState<TodoItemData[]>(
    note?.todo_items?.length
      ? note.todo_items
      : [{ id: `temp-${Date.now()}-1`, title: '', is_completed: false, subtasks: [] }],
  );

  const [todoContents, setTodoContents] = useState<Record<string, string>>({});
  const [openTodoMenuId, setOpenTodoMenuId] = useState<string | null>(null);

  const [isPinned, setIsPinned] = useState<0 | 1>(note?.is_pinned ?? 0);
  const [noteColor, setNoteColor] = useState(note?.color ?? 'default');
  const insets = useSafeAreaInsets();

  const [showColorPicker,   setShowColorPicker]   = useState(false);
  const [showMoreMenu,      setShowMoreMenu]      = useState(false);
  const [showFormattingBar, setShowFormattingBar] = useState(false);
  const [editorMode,        setEditorMode]        = useState(mode);
  const [isContentEmpty,    setIsContentEmpty]    = useState(!note?.content_text);
  const [activeFormats, setActiveFormats] = useState({
    bold: false, italic: false, underline: false, strikeThrough: false, block: 'div',
  });
  const [showTagMenu,    setShowTagMenu]    = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Reminder states
  const [showReminderPicker, setShowReminderPicker] = useState(false);
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const todoIdMapRef   = useRef<Record<string, string>>({});

  // FIX: When the store's version of this note changes (e.g. after
  // clearCompletedTodosAction updates it), sync the local todoItems so the
  // editor immediately reflects the deletion without needing a re-open.
  useEffect(() => {
    if (!note?.id || !visible) return;
    const storeNote = notes.find(n => n.id === note.id);
    if (!storeNote?.todo_items) return;
    setTodoItems(
      storeNote.todo_items.length > 0
        ? storeNote.todo_items
        : [{ id: `temp-${Date.now()}-1`, title: '', is_completed: false, subtasks: [] }]
    );
  }, [notes, note?.id, visible]);

  useEffect(() => {
    if (!visible) return;

    const isTodoMode = mode === 'todo' || note?.type === 'todo';
    const hasRealId  = isRealNoteId(note?.id);

    if (isTodoMode && hasRealId) {
      api.get(`/notes/${note!.id}/todos/`)
        .then(({ data }) => {
          const freshItems = mapApiTodoItems(data.results);

          const contentMap: Record<string, string> = {};
          (data.results || []).forEach((root: any) => {
            if (root.content) contentMap[root.id] = root.content;
            (root.children || []).forEach((child: any) => {
              if (child.content) contentMap[child.id] = child.content;
            });
          });
          setTodoContents(contentMap);

          setTodoItems(
            freshItems.length > 0
              ? freshItems
              : [{ id: `temp-${Date.now()}-1`, title: '', is_completed: false, subtasks: [] }],
          );
        })
        .catch((err) => {
          console.warn('[NoteEditor] Không tải được danh sách todo:', err);
        });
    }
  }, [visible, note?.id, mode]);

  // Callback ref để trigger file picker của NoteImageUploader từ toolbar
  const imagePickerTriggerRef = useRef<(() => void) | null>(null);

  const [noteTags, setNoteTags] = useState<string[]>(note?.labels ?? []);
  const { allTags, addTagToSystem, allTagObjects, tagIdByName, loadTagsFromServer } = useNoteStore();
  const router = useRouter();

  // ✅ FIX Bugs 2 & 4: đọc từ note.tags (Tag[]) thay vì note.labels
  const [noteTags, setNoteTags] = useState<string[]>(
    note?.tags?.map(t => t.name) ?? note?.labels ?? []
  );
  // Lưu tags gốc lúc mở editor để tính diff khi save
  const originalTagsRef = useRef<Tag[]>(note?.tags ?? []);

  // ── Refs khai báo đúng bên trong component ────────────────────────────────
  const contentRef = useRef<any>(null);
  const mobileContentRef = useRef<any>(null);
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;

    // ✅ FIX: Load tags từ server mỗi khi editor mở để TagMenu có dữ liệu
    loadTagsFromServer();

    setTitle(note?.title ?? '');
    setContent(note?.content_text ?? '');
    setHtmlConfig({ __html: (note?.content_text ?? '').replace(/\n/g, '<br>') });
    setTodoItems(
      note?.todo_items?.length
        ? note.todo_items
        : [{ id: `temp-${Date.now()}-1`, title: '', is_completed: false, subtasks: [] }],
    );
    setIsPinned(note?.is_pinned ?? 0);
    setNoteColor(note?.color ?? 'default');
    // ✅ FIX Bug 2 & 4: reset tags từ note.tags (Tag[]) khi mở note khác
    const currentTags = note?.tags ?? [];
    setNoteTags(currentTags.map(t => t.name));
    originalTagsRef.current = currentTags;

    setEditorMode(mode);
    setShowColorPicker(false);
    setShowMoreMenu(false);
    setShowFormattingBar(false);
    setIsContentEmpty(!note?.content_text);
    setOpenTodoMenuId(null);
    todoIdMapRef.current = {};

    if (!note?.content_text) {
      const timer = setTimeout(() => {
        if (isWeb) {
          const el = document.getElementById('web-content-editor');
          if (el) {
            if (el.innerHTML === '<br>') el.innerHTML = '';
            el.focus();
            if (typeof window !== 'undefined' && window.getSelection) {
              const range = document.createRange();
              const sel = window.getSelection();
              range.selectNodeContents(el);
              range.collapse(false);
              sel?.removeAllRanges();
              sel?.addRange(range);
            }
          }
        } else if (mobileContentRef.current) {
          mobileContentRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [visible, note?.id, mode]);

  const { width } = useWindowDimensions();
  const isCompact = width < 720;

  const handleToggleTodo = (id: string, parentId?: string) => {
    if (parentId) {
      setTodoItems((prev) => prev.map((item) =>
        item.id === parentId
          ? { ...item, subtasks: (item.subtasks || []).map(sub => sub.id === id ? { ...sub, is_completed: !sub.is_completed } : sub) }
          : item
      ));
    } else {
      setTodoItems((prev) => prev.map((item) =>
        item.id === id ? { ...item, is_completed: !item.is_completed } : item
      ));
    }

    if (isRealNoteId(note?.id) && isServerTodoId(id)) {
      api.put(`/notes/${note!.id}/todos/${id}/toggle/`)
        .catch((err) => {
          console.warn('[NoteEditor] toggle API lỗi:', err);
          if (parentId) {
            setTodoItems((prev) => prev.map((item) =>
              item.id === parentId
                ? { ...item, subtasks: (item.subtasks || []).map(sub => sub.id === id ? { ...sub, is_completed: !sub.is_completed } : sub) }
                : item
            ));
          } else {
            setTodoItems((prev) => prev.map((item) =>
              item.id === id ? { ...item, is_completed: !item.is_completed } : item
            ));
          }
        });
    }
  };

  const handleChangeTodo = (
    id: string,
    value: string,
    field: 'title' | 'content' = 'title',
    parentId?: string,
  ) => {
    if (field === 'title') {
      if (parentId) {
        setTodoItems((prev) => prev.map((item) =>
          item.id === parentId
            ? { ...item, subtasks: (item.subtasks || []).map(sub => sub.id === id ? { ...sub, title: value } : sub) }
            : item
        ));
      } else {
        setTodoItems((prev) => prev.map((item) =>
          item.id === id ? { ...item, title: value } : item
        ));
      }
    } else {
      setTodoContents((prev) => {
        const next = { ...prev, [id]: value };
        const resolvedId = todoIdMapRef.current[id];
        if (resolvedId && resolvedId !== id) {
          next[resolvedId] = value;
        }
        const tempId = Object.keys(todoIdMapRef.current).find(key => todoIdMapRef.current[key] === id);
        if (tempId) {
          next[tempId] = value;
        }
        return next;
      });
    }

    const currentNoteId = note?.id && !note.id.startsWith('temp-')
      ? note.id
      : useNoteStore.getState().notes.find(n => n.title === title)?.id;

    if (currentNoteId) {
      const timerKey = `${id}-${field}`;
      if (debounceTimers.current[timerKey]) clearTimeout(debounceTimers.current[timerKey]);
      debounceTimers.current[timerKey] = setTimeout(() => {
        const resolvedId = todoIdMapRef.current[id] ?? id;

        if (isServerTodoId(resolvedId)) {
          const payload = field === 'title' ? { title: value } : { content: value };
          api.put(`/notes/${currentNoteId}/todos/${resolvedId}/`, payload)
            .catch((err) => console.warn(`[NoteEditor] update ${field} API lỗi:`, err));
        }
        delete debounceTimers.current[timerKey];
      }, 800);
    }
  };

  const handleAddTodo = (parentId?: string) => {
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const currentSubCount = todoItems.reduce((acc, item) => acc + (item.subtasks?.length || 0), 0);
    const computedPosition = parentId
      ? `b${String(currentSubCount).padStart(4, '0')}`
      : `a${String(todoItems.length).padStart(4, '0')}`;

    if (parentId) {
      setTodoItems((prev) => prev.map((item) =>
        item.id === parentId
          ? { ...item, subtasks: [...(item.subtasks || []), { id: tempId, title: '', is_completed: false, content: '' }] }
          : item
      ));
    } else {
      setTodoItems((prev) => [...prev, { id: tempId, title: '', is_completed: false, content: '', subtasks: [] }]);
    }

    const currentNoteId = note?.id && !note.id.startsWith('temp-') ? note.id : useNoteStore.getState().notes.find(n => n.title === title)?.id;

    if (currentNoteId) {
      const payload: Record<string, any> = { title: '', position: computedPosition, repeat_type: 'none' };
      if (parentId && isServerTodoId(parentId)) payload.parent = parentId;

      api.post(`/notes/${currentNoteId}/todos/`, payload)
        .then(({ data: created }) => {
          const oldTempId = tempId;
          todoIdMapRef.current[oldTempId] = created.id;

          setTodoContents((prev) => {
            const next = { ...prev };
            if (next[oldTempId] !== undefined) {
              next[created.id] = next[oldTempId];
            }
            return next;
          });

          if (parentId) {
            setTodoItems((prev) => prev.map((item) =>
              item.id === parentId
                ? {
                    ...item,
                    subtasks: (item.subtasks || []).map(sub =>
                      sub.id === oldTempId
                        ? { ...sub, id: created.id, content: '' }
                        : sub
                    )
                  }
                : item
            ));
          } else {
            setTodoItems((prev) => prev.map((item) => item.id === oldTempId ? { ...item, id: created.id, content: '', subtasks: [] } : item));
          }
        })
        .catch((err) => {
          console.warn('[NoteEditor] create todo API lỗi:', err);
          if (parentId) {
            setTodoItems((prev) => prev.map((item) =>
              item.id === parentId
                ? { ...item, subtasks: (item.subtasks || []).filter(sub => sub.id !== tempId) }
                : item
            ));
          } else {
            setTodoItems((prev) => prev.filter((item) => item.id !== tempId));
          }
        });
    }
  };

  const handleRemoveTodo = (id: string, parentId?: string) => {
    const snapshot = JSON.parse(JSON.stringify(todoItems));

    setTodoItems((prev) => {
      if (parentId) {
        return prev.map(item =>
          item.id === parentId
            ? { ...item, subtasks: (item.subtasks || []).filter(s => s.id !== id) }
            : item
        );
      }
      return prev.filter(item => item.id !== id);
    });

    ['title', 'content'].forEach(f => {
      const key = `${id}-${f}`;
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
        delete debounceTimers.current[key];
      }
    });
    setTodoContents(prev => { const next = { ...prev }; delete next[id]; return next; });
    setOpenTodoMenuId(null);

    const currentNoteId = note?.id && !note.id.startsWith('temp-') ? note.id : useNoteStore.getState().notes.find(n => n.title === title)?.id;
    if (currentNoteId && isServerTodoId(id)) {
      api.delete(`/notes/${currentNoteId}/todos/${id}/`)
        .catch(err => {
          console.warn('[NoteEditor] delete todo API lỗi:', err);
          setTodoItems(snapshot);
        });
    }
  };

  const handleToggleMode = async () => {
    let newType: 'text' | 'todo';
    if (editorMode === 'text') {
      const plainText = isWeb && contentRef.current ? contentRef.current.innerText : content;
      const lines = (plainText || '').split('\n').filter((l: string) => l.trim() !== '');

      const newItems = lines.length > 0
        ? lines.map((l: string, i: number) => ({ id: `temp-${Date.now()}-${i}`, title: l, is_completed: false, subtasks: [] }))
        : [{ id: `temp-${Date.now()}-1`, title: '', is_completed: false, subtasks: [] }];

      setTodoItems(newItems);
      setEditorMode('todo');
      newType = 'todo';

      if (isRealNoteId(note?.id)) {
        const syncNote: NoteCardData = {
          ...note,
          id: note!.id,
          type: 'todo',
          todo_items: newItems,
          title: title.trim() || undefined,
          color: noteColor,
          labels: noteTags,
        };
        const result = await saveNoteAction(syncNote, todoContents);
        if (result && result.note?.todo_items) {
          setTodoItems(result.note.todo_items);
        }
        if (result && result.contentsMap) {
          setTodoContents(result.contentsMap);
        }
      }
    } else {
      const text = todoItems.filter(t => t.title.trim()).map(t => t.title).join('\n');
      setContent(text);
      setIsContentEmpty(!text.trim());
      setEditorMode('text');
      newType = 'text';

      if (isRealNoteId(note?.id)) {
        const syncNote: NoteCardData = {
          ...note,
          id: note!.id,
          type: 'text',
          content_text: text,
          title: title.trim() || undefined,
          color: noteColor,
          labels: noteTags,
        };
        saveNoteAction(syncNote, todoContents)
          .catch((err: any) => console.warn('[NoteEditor] sync type text API lỗi:', err));
      }
    }
    setShowMoreMenu(false);
  };

  const closePopups = () => {
    setShowColorPicker(false);
    setShowMoreMenu(false);
    setShowTagMenu(false);
    setShowExportMenu(false);
    setOpenTodoMenuId(null);
    setShowReminderPicker(false);
  };

  const updateFormattingState = () => {
    if (!isWeb) return;
    setActiveFormats({
      bold:          document.queryCommandState('bold'),
      italic:        document.queryCommandState('italic'),
      underline:     document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
      block:         document.queryCommandValue('formatBlock') || 'div',
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

  const handleToggleTag = (tag: string) => {
    setNoteTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleCreateTag = async (tag: string) => {
    await addTagToSystem(tag);
    handleToggleTag(tag);
  };

  const handleExport = async (format: 'txt' | 'pdf' | 'docx') => {
    let currentContent = content;
    if (editorMode === 'text') {
      currentContent = isWeb && contentRef.current ? contentRef.current.innerHTML : content;
    }
    const exportNoteData: NoteCardData = {
      ...note,
      color: noteColor,
      id:            note?.id ?? `${Date.now()}`,
      title:         title.trim() || undefined,
      content_text: editorMode === 'text' ? currentContent?.trim() || undefined : undefined,
      todo_items:    editorMode === 'todo' ? todoItems : undefined,
      type:          editorMode,
    };
    setShowExportMenu(false);
    setShowMoreMenu(false);
    if (format === 'txt')       await exportToTxt(exportNoteData);
    else if (format === 'pdf')  await exportToPdf(exportNoteData);
    else if (format === 'docx') await exportToDocx(exportNoteData);
  };

  const handleSaveReminder = async () => {
    if (!reminderDate || !reminderTime) {
      alert('Vui lòng chọn đầy đủ ngày và giờ.');
      return;
    }

    const remind_at = new Date(`${reminderDate}T${reminderTime}:00`).toISOString();

    if (new Date(remind_at) < new Date()) {
      alert('Không thể đặt nhắc nhở vào thời gian đã qua.');
      return;
    }

    try {
      await createReminderAction(
        {
          note: note?.id ?? '',
          remind_at,
          repeat_type: 'none',
          note_title: title.trim() || undefined,
          note_color: noteColor,
        },
        async (created) => {
          const titleFallback = `Ghi chú #${created.note.slice(0, 8)}`;
          await scheduleReminderNotification(created, titleFallback);
        }
      );
      setShowReminderPicker(false);
    } catch {
      alert('Không thể tạo nhắc nhở. Vui lòng thử lại.');
    }
  };

  const handleClearReminder = () => {
    setReminderDate('');
    setReminderTime('');
    setShowReminderPicker(false);
  };

  const handleSaveAndClose = async () => {
    Keyboard.dismiss();

    Object.keys(debounceTimers.current).forEach((key) => {
      if (debounceTimers.current[key]) {
        clearTimeout(debounceTimers.current[key]);
      }
    });
    debounceTimers.current = {};

    let currentContent = content;
    if (readOnly) { closeEditor(); return; }
    if (editorMode === 'text') {
      currentContent = isWeb && contentRef.current ? contentRef.current.innerHTML : content;
    }

    const cleanedTodoItems = todoItems
      .filter(item => item.title.trim() !== '' || (item.subtasks && item.subtasks.length > 0))
      .map((item) => ({
        ...item,
        subtasks: (item.subtasks || []).filter(sub => sub.title.trim() !== ''),
      }));

    const strippedCheck = currentContent
      ? currentContent
          .replace(/<[^>]*>?/gm, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/[\u200B-\u200D\uFEFF]/g, '')
          .trim()
      : '';

    const hasContent = title.trim() ||
      (editorMode === 'text' ? strippedCheck.length > 0 : cleanedTodoItems.length > 0);

    if (editorMode === 'text' && !strippedCheck) {
      currentContent = '';
      if (isWeb && contentRef.current) {
        contentRef.current.innerHTML = '';
      }
    }

    const updatedNote: NoteCardData = {
      ...note,
      id: note?.id ?? `${Date.now()}`,
      type: editorMode,
      color: noteColor,
      title: title.trim() || undefined,
      content_text: editorMode === 'text' ? (strippedCheck ? currentContent.trim() : '') : undefined,
      todo_items: editorMode === 'todo' ? cleanedTodoItems : undefined,
      todo_total: editorMode === 'todo' ? cleanedTodoItems.length : undefined,
      todo_completed: editorMode === 'todo' ? cleanedTodoItems.filter((item) => item.is_completed).length : undefined,
      labels: noteTags,       // desired tag names (dùng cho parent khi tạo note mới)
      tags: note?.tags ?? [], // giữ tags gốc để parent biết trạng thái cũ
      is_pinned: isPinned,
    };

    // ✅ FIX Bug 2 & 4: Sync tag changes qua API ngay với note đã tồn tại
    const isExistingNote = note?.id && !note.id.startsWith('temp-');
    if (isExistingNote && note?.id) {
      const originalTagNames = originalTagsRef.current.map(t => t.name);
      const toAdd = noteTags.filter(name => !originalTagNames.includes(name));
      const toRemove = originalTagNames.filter(name => !noteTags.includes(name));
      try {
        await Promise.all([
          ...toAdd.map(name => {
            const tagId = tagIdByName[name];
            return tagId ? addTagToNote(note.id, tagId) : Promise.resolve();
          }),
          ...toRemove.map(name => {
            const tag = originalTagsRef.current.find(t => t.name === name);
            return tag ? removeTagFromNote(note.id, tag.id) : Promise.resolve();
          }),
        ]);
        // Cập nhật updatedNote.tags với danh sách tags mới (để hiển thị đúng trên card)
        const newTags = noteTags
          .map(name => allTagObjects.find(t => t.name === name))
          .filter(Boolean) as Tag[];
        updatedNote.tags = newTags;
      } catch {
        // Nếu API lỗi vẫn tiếp tục save nội dung
      }
    }

    if (!hasContent) {
      if (note?.id && !note.id.startsWith('temp-')) await saveNoteAction(updatedNote);
      closeEditor();
      return;
    }

    const result = await saveNoteAction(updatedNote, todoContents);
    if (result && result.contentsMap) {
      setTodoContents(result.contentsMap);
    }
    closeEditor();
  };

  // ── Format command constants — tránh ESLint no-unescaped-entities trong JSX ─
  const FMT_BOLD = 'bold';
  const FMT_ITALIC = 'italic';
  const FMT_UNDERLINE = 'underline';
  const FMT_STRIKE = 'strikeThrough';
  const FMT_REMOVE = 'removeFormat';
  const FMT_H1 = 'H1';
  const FMT_H2 = 'H2';
  const FMT_DIV = 'DIV';
  // ──────────────────────────────────────────────────────────────────────────

  const handleSaveAndCloseRef = useRef(handleSaveAndClose);
  useEffect(() => { handleSaveAndCloseRef.current = handleSaveAndClose; }, [handleSaveAndClose]);

  useEffect(() => {
    if (!visible) return;
    const onBackPress = () => { handleSaveAndCloseRef.current(); return true; };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [visible]);

  if (!visible) return null;
  const bg = cardColorMap[noteColor] ?? cardColorMap.default;
  const hasReminder = !!(reminderDate && reminderTime);
  const isSavedNote = !!(note?.id && !note.id.startsWith('temp-'));
  // ── Biến này dùng trong JSX để tránh ESLint báo 'text' là text string ────
  const isTextMode = editorMode === 'text';
  // ──────────────────────────────────────────────────────────────────────────



  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleSaveAndClose} />
      <View style={[
        styles.panel,
        isCompact ? styles.panelFull : styles.panelPopup,
        isCompact && { paddingTop: insets.top, paddingBottom: insets.bottom },
        { backgroundColor: bg },
      ]}>

        {/* ── Header ── */}
        <View style={[styles.headerRow, { paddingLeft: isCompact ? 12 : 20 }]}>
          {isCompact && (
            <Tooltip label="Quay lại và lưu" position="bottom">
              <TouchableOpacity onPress={handleSaveAndClose} style={styles.backBtn}>
                <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </Tooltip>
          )}
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề"
            placeholderTextColor={colors.textPlaceholder}
            style={styles.titleInput}
            returnKeyType="done"
            onFocus={closePopups}
          />
          <Tooltip label={isPinned ? 'Bỏ ghim ghi chú' : 'Ghim ghi chú'} position="bottom">
            <TouchableOpacity onPress={() => setIsPinned(isPinned === 1 ? 0 : 1)} style={styles.iconBtn}>
              <MaterialCommunityIcons
                name={isPinned ? 'pin' : 'pin-outline'}
                size={24}
                color={isPinned ? colors.primary : colors.textSecondary}
              />
            </TouchableOpacity>
          </Tooltip>
        </View>

        {/* Image Uploader — chỉ hiện khi note đã được lưu */}
        {isSavedNote && (
          <NoteImageUploader
            noteId={note!.id}
            isDark={false}
            triggerRef={imagePickerTriggerRef}
          />
        )}

        {/* Body */}
        <ScrollView
          style={styles.body}
          showsVerticalScrollIndicator={false}
          onTouchStart={closePopups}
          {...Platform.select({ web: { onClickCapture: closePopups } } as any)}
        >
          {isTextMode ? (
            <View style={{ position: 'relative' }}>
              {isWeb ? (
                <>
                  {isContentEmpty && (
                    <Text style={[styles.contentInput, { position: 'absolute', top: 0, opacity: 0.5, pointerEvents: 'none' }]}>
                      Tạo ghi chú...
                    </Text>
                  )}
                  <WebDiv
                    key={`editor-${note?.id ?? 'note-new'}-${visible}`}
                    id="web-content-editor"
                    ref={contentRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={htmlConfig}
                    onInput={(e: any) => {
                      setContent(e.currentTarget.innerHTML);
                      setIsContentEmpty(!e.currentTarget.textContent?.trim());
                    }}
                    onKeyUp={updateFormattingState}
                    onMouseUp={updateFormattingState}
                    onFocus={() => { updateFormattingState(); closePopups(); }}
                    style={{
                      outline: 'none', minHeight: 120, paddingBottom: 20,
                      fontFamily: 'Inter-Regular', fontSize: 16,
                      color: colors.textSecondary, lineHeight: 1.5,
                      cursor: 'text', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}
                  />
                </>
              ) : (
                <View style={{ position: 'relative' }}>
                  <Text style={[styles.contentInput, styles.textarea, { opacity: 0, paddingBottom: 20 }]}>
                    {content ? content + ' \n' : ' '}
                  </Text>
                  <TextInput
                    ref={mobileContentRef}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Tạo ghi chú..."
                    placeholderTextColor={colors.textPlaceholder}
                    style={[styles.contentInput, styles.textarea, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }]}
                    multiline textAlignVertical="top"
                    scrollEnabled={false} autoCorrect={false} spellCheck={false}
                    onFocus={closePopups}
                  />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.todoList}>
              {todoItems.map((item) => {
                const isMenuOpen = openTodoMenuId === item.id;

                return (
                  <View
                    key={item.id}
                    style={{
                      position: 'relative',
                      zIndex: isMenuOpen ? 999999 : 1
                    }}
                  >
                    {/* ── Khối Todo Cha Lớn ── */}
                    <View style={styles.todoItemWrapper}>
                      <TouchableOpacity
                        style={[styles.todoCircle, item.is_completed && styles.todoCircleChecked]}
                        onPress={() => handleToggleTodo(item.id)}
                        activeOpacity={0.7}
                      >
                        {item.is_completed && (
                          <MaterialCommunityIcons name="check" size={14} color="#fff" />
                        )}
                      </TouchableOpacity>

                      <View style={styles.todoTextBlock}>
                        <TextInput
                          value={item.title}
                          onChangeText={(v) => handleChangeTodo(item.id, v, 'title')}
                          placeholder="Thêm việc cần làm"
                          placeholderTextColor={colors.textPlaceholder}
                          style={[
                            styles.todoTitleInput,
                            item.is_completed && styles.todoTitleInputChecked,
                          ]}
                          multiline
                          onFocus={closePopups}
                        />
                        <TextInput
                          value={todoContents[item.id] ?? ''}
                          onChangeText={(v) => handleChangeTodo(item.id, v, 'content')}
                          placeholder="Chi tiết"
                          placeholderTextColor={colors.textPlaceholder}
                          style={styles.todoContentInput}
                          multiline
                          onFocus={closePopups}
                        />
                      </View>

                      <View style={{ position: 'static' }}>
                        <TouchableOpacity
                          onPress={(e: any) => {
                            e.stopPropagation();
                            setOpenTodoMenuId(isMenuOpen ? null : item.id);
                          }}
                          style={[styles.todoMoreBtn, { zIndex: isMenuOpen ? 9999999 : 2 }]}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="dots-vertical" size={18} color={colors.textTertiary} />
                        </TouchableOpacity>

                        {isMenuOpen && (
                          <View style={[styles.todoItemMenu, { position: 'absolute', right: 12, top: 32, zIndex: 1000000 }]}>
                            <MenuBtn
                              label="Thêm mục con"
                              onPress={() => { handleAddTodo(item.id); setOpenTodoMenuId(null); }}
                            />
                            <MenuBtn
                              label="Xóa mục này"
                              onPress={() => { handleRemoveTodo(item.id); setOpenTodoMenuId(null); }}
                            />
                          </View>
                        )}
                      </View>
                    </View>

                    {/* ── Khối Render Các Mục Con (Subtasks) Thụt Lề ── */}
                    {item.subtasks?.map((subItem) => (
                      <View
                        key={subItem.id}
                        pointerEvents={isMenuOpen ? 'none' : 'auto'}
                        style={[
                          styles.todoItemWrapper,
                          styles.subtaskIndent,
                          { zIndex: isMenuOpen ? 1 : 2, opacity: isMenuOpen ? 0.4 : 1 }
                        ]}
                      >
                        <View style={styles.subtaskLine} />
                        <TouchableOpacity
                          style={[styles.todoCircle, styles.todoCircleSub, subItem.is_completed && styles.todoCircleChecked]}
                          onPress={() => handleToggleTodo(subItem.id, item.id)}
                          activeOpacity={0.7}
                        >
                          {subItem.is_completed && (
                            <MaterialCommunityIcons name="check" size={12} color="#fff" />
                          )}
                        </TouchableOpacity>

                        <View style={styles.todoTextBlock}>
                          <TextInput
                            value={subItem.title}
                            onChangeText={(v) => handleChangeTodo(subItem.id, v, 'title', item.id)}
                            placeholder="Mục con"
                            placeholderTextColor={colors.textPlaceholder}
                            style={[
                              styles.todoTitleInput,
                              styles.todoTitleInputSub,
                              subItem.is_completed && styles.todoTitleInputChecked,
                            ]}
                            multiline
                            onFocus={closePopups}
                          />
                          <TextInput
                            value={todoContents[subItem.id] ?? ''}
                            onChangeText={(v) => handleChangeTodo(subItem.id, v, 'content', item.id)}
                            placeholder="Chi tiết"
                            placeholderTextColor={colors.textPlaceholder}
                            style={[styles.todoContentInput, { fontSize: 12 }]}
                            multiline
                            onFocus={closePopups}
                          />
                        </View>

                        <TouchableOpacity
                          onPress={() => handleRemoveTodo(subItem.id, item.id)}
                          style={styles.todoMoreBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialCommunityIcons name="close" size={16} color={colors.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                );
              })}

              <TouchableOpacity style={styles.addTodoBtn} onPress={() => handleAddTodo()} activeOpacity={0.7}>
                <MaterialCommunityIcons name="plus" size={20} color={colors.textSecondary} />
                <Text style={styles.addTodoBtnText}>Thêm việc cần làm</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* ── Tag chips: body tap → navigate, × → remove (Bug 3 fix) ─────── */}
        {noteTags.length > 0 && (
          <View style={styles.tagChipsRow}>
            {noteTags.map(tag => {
              const tagObj = allTagObjects.find(t => t.name === tag);
              return (
                <View key={tag} style={styles.tagChip}>
                  {/* Tap chip body → lưu & navigate sang trang nhãn */}
                  <TouchableOpacity
                    style={styles.tagChipBody}
                    onPress={() => {
                      if (tagObj) {
                        handleSaveAndClose();
                        router.push(`/(main)/label/${tagObj.id}` as any);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="label-outline" size={12} color={colors.textSecondary} />
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </TouchableOpacity>
                  {/* × → xóa nhãn khỏi note */}
                  <TouchableOpacity
                    onPress={() => handleToggleTag(tag)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <MaterialCommunityIcons name="close" size={12} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        {/* ──────────────────────────────────────────────────────────────────── */}

        {/* Formatting Bar */}
        {showFormattingBar && isTextMode && (
          <View style={styles.formattingBar}>
            <ToolbarBtn icon="format-header-1" onPress={() => handleFormat('formatBlock', FMT_H1)} label="Tiêu đề 1" isFormatActive={activeFormats.block.toLowerCase() === 'h1'} />
            <ToolbarBtn icon="format-header-2" onPress={() => handleFormat('formatBlock', FMT_H2)} label="Tiêu đề 2" isFormatActive={activeFormats.block.toLowerCase() === 'h2'} />
            <ToolbarBtn icon="format-paragraph" onPress={() => handleFormat('formatBlock', FMT_DIV)} label="Văn bản thường" isFormatActive={activeFormats.block.toLowerCase() === 'div' || activeFormats.block.toLowerCase() === 'p'} />
            <View style={styles.divider} />
            <ToolbarBtn icon="format-bold" onPress={() => handleFormat(FMT_BOLD)} label="In đậm" isFormatActive={activeFormats.bold} />
            <ToolbarBtn icon="format-italic" onPress={() => handleFormat(FMT_ITALIC)} label="In nghiêng" isFormatActive={activeFormats.italic} />
            <ToolbarBtn icon="format-underline" onPress={() => handleFormat(FMT_UNDERLINE)} label="Gạch chân" isFormatActive={activeFormats.underline} />
            <ToolbarBtn icon="format-strikethrough-variant" onPress={() => handleFormat(FMT_STRIKE)} label="Gạch ngang" isFormatActive={activeFormats.strikeThrough} />
            <View style={styles.divider} />
            <ToolbarBtn icon="format-clear" onPress={() => handleFormat(FMT_REMOVE)} label="Xóa định dạng" />
          </View>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <View style={styles.toolbarLeft}>

            {/* ===== NÚT NHẮC NHỞ + POPOVER ===== */}
            <View style={{ position: 'relative', zIndex: 300 }}>
              <ToolbarBtn
                icon="bell-plus-outline"
                onPress={() => {
                  setShowReminderPicker(!showReminderPicker);
                  setShowColorPicker(false);
                  setShowMoreMenu(false);
                  setShowTagMenu(false);
                  setShowExportMenu(false);
                }}
                isActive={hasReminder}
                label="Nhắc nhở"
              />

              {showReminderPicker && (
                <View style={styles.reminderPopover}>
                  {/* Header popover */}
                  <View style={styles.reminderHeader}>
                    <MaterialCommunityIcons name="bell-outline" size={16} color={colors.primary} />
                    <Text style={styles.reminderTitle}>Đặt nhắc nhở</Text>
                  </View>

                  {/* Ngày */}
                  <Text style={styles.reminderLabel}>Ngày</Text>
                  {isWeb ? (
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e: any) => setReminderDate(e.target.value)}
                      style={{
                        marginBottom: 10,
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: `1px solid ${colors.borderDefault}`,
                        fontSize: 13,
                        fontFamily: 'Inter-Regular',
                        color: colors.textPrimary,
                        width: '100%',
                        boxSizing: 'border-box',
                        outline: 'none',
                      } as any}
                    />
                  ) : (
                    <TextInput
                      value={reminderDate}
                      onChangeText={setReminderDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.textPlaceholder}
                      style={styles.reminderInput}
                    />
                  )}

                  {/* Giờ */}
                  <Text style={styles.reminderLabel}>Giờ</Text>
                  {isWeb ? (
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e: any) => setReminderTime(e.target.value)}
                      style={{
                        marginBottom: 12,
                        padding: '6px 8px',
                        borderRadius: 4,
                        border: `1px solid ${colors.borderDefault}`,
                        fontSize: 13,
                        fontFamily: 'Inter-Regular',
                        color: colors.textPrimary,
                        width: '100%',
                        boxSizing: 'border-box',
                        outline: 'none',
                      } as any}
                    />
                  ) : (
                    <TextInput
                      value={reminderTime}
                      onChangeText={setReminderTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.textPlaceholder}
                      style={styles.reminderInput}
                    />
                  )}

                  {/* Preview reminder đã đặt */}
                  {hasReminder && (
                    <View style={styles.reminderPreview}>
                      <MaterialCommunityIcons name="bell-ring-outline" size={13} color={colors.primary} />
                      <Text style={styles.reminderPreviewText}>
                        {reminderDate} lúc {reminderTime}
                      </Text>
                    </View>
                  )}

                  {/* Buttons */}
                  <View style={styles.reminderBtnRow}>
                    <TouchableOpacity style={styles.reminderSaveBtn} onPress={handleSaveReminder}>
                      <Text style={styles.reminderSaveBtnText}>Lưu</Text>
                    </TouchableOpacity>
                    {hasReminder && (
                      <TouchableOpacity style={styles.reminderClearBtn} onPress={handleClearReminder}>
                        <Text style={styles.reminderClearBtnText}>Xóa</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.reminderCancelBtn} onPress={() => setShowReminderPicker(false)}>
                      <Text style={styles.reminderCancelBtnText}>Đóng</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
            {/* ===== KẾT THÚC NÚT NHẮC NHỞ ===== */}

            <ToolbarBtn icon="account-plus-outline" onPress={() => { alert('Cộng tác viên sẽ được gọi API'); closePopups(); }} label="Cộng tác viên" />
            <ToolbarBtn icon="palette-outline" onPress={() => { setShowColorPicker(!showColorPicker); setShowMoreMenu(false); setShowTagMenu(false); setShowReminderPicker(false); }} label="Tùy chọn nền" />

            {/* ===== NÚT THÊM HÌNH ẢNH ===== */}
            <ToolbarBtn
              icon="image-outline"
              onPress={() => {
                closePopups();
                if (!isSavedNote) {
                  alert('Hãy lưu ghi chú trước khi thêm ảnh.');
                  return;
                }
                imagePickerTriggerRef.current?.();
              }}
              label="Thêm hình ảnh"
            />
            {/* ===== KẾT THÚC NÚT THÊM HÌNH ẢNH ===== */}

            <ToolbarBtn
              icon="archive-arrow-down-outline"
              onPress={async () => {
                if (note?.id && !note.id.startsWith('temp-')) {
                  await archiveNoteAction(note.id);
                  closeEditor();
                } else {
                  alert('Không thể lưu trữ ghi chú chưa được lưu');
                }
              }}
              label="Lưu trữ"
            />

            <View style={{ position: 'relative', zIndex: 300 }}>
              <ToolbarBtn
                icon="dots-vertical"
                onPress={() => { setShowMoreMenu(!showMoreMenu); setShowColorPicker(false); setShowExportMenu(false); }}
                label="Thêm tùy chọn"
              />
              {showMoreMenu && (
                <View style={styles.moreMenu}>
                  <MenuBtn
                    onPress={async () => {
                      if (note?.id && !note.id.startsWith('temp-')) {
                        await trashNoteAction(note.id);
                        closeEditor();
                      }
                      setShowMoreMenu(false);
                    }}
                    label="Xóa ghi chú"
                    disabled={!note?.id && !title.trim() && (isTextMode ? isContentEmpty : todoItems.filter(t => t.title.trim()).length === 0)}
                  />

                  <View style={{ position: 'relative', zIndex: 310 }}>
                    <MenuBtn onPress={() => setShowTagMenu(!showTagMenu)} label="Thêm nhãn" />
                    {showTagMenu && (
                      <View style={styles.tagMenuPopover}>
                        <TagMenu
                          noteTags={noteTags}
                          allTags={allTags}
                          onToggleTag={handleToggleTag}
                          onCreateTag={handleCreateTag}
                        />
                      </View>
                    )}
                  </View>

                  <View style={{ position: 'relative', zIndex: 310 }}>
                    <MenuBtn onPress={() => { setShowExportMenu(!showExportMenu); setShowTagMenu(false); }} label="Xuất file" />
                    {showExportMenu && (
                      <View style={styles.exportMenuPopover}>
                        <MenuBtn onPress={() => handleExport('txt')}  label="Xuất ra .TXT" />
                        <MenuBtn onPress={() => handleExport('pdf')}  label="Xuất ra .PDF" />
                        <MenuBtn onPress={() => handleExport('docx')} label="Xuất ra .DOCX" />
                      </View>
                    )}
                  </View>

                  <MenuBtn
                    onPress={() => { alert('Tạo bản sao (Cần API)'); setShowMoreMenu(false); }}
                    label="Tạo bản sao"
                    disabled={!note?.id && !title.trim() && (isTextMode ? isContentEmpty : todoItems.filter(t => t.title.trim()).length === 0)}
                  />
                  <MenuBtn onPress={handleToggleMode} label={editorMode === 'text' ? 'Hiển thị hộp kiểm' : 'Ẩn hộp kiểm'} />

                  {/* FIX: clearCompletedTodosAction now uses a single bulk API call.
                      After it resolves, the store update triggers the useEffect above
                      which syncs local todoItems — no manual setTodoItems needed here. */}
                  {editorMode === 'todo' && isRealNoteId(note?.id) && (
                    <MenuBtn
                      onPress={async () => {
                        setShowMoreMenu(false);
                        await clearCompletedTodosAction(note!.id);
                      }}
                      label="Xóa các mục đã hoàn thành"
                    />
                  )}

                  <MenuBtn
                    onPress={() => { alert('Lịch sử phiên bản (Cần API)'); setShowMoreMenu(false); }}
                    label="Lịch sử phiên bản"
                    disabled={!note?.id && !title.trim() && (isTextMode ? isContentEmpty : todoItems.filter(t => t.title.trim()).length === 0)}
                  />
                </View>
              )}
            </View>

            {editorMode === 'text' && (
              <ToolbarBtn
                icon="format-text"
                onPress={() => { setShowFormattingBar(!showFormattingBar); closePopups(); }}
                isActive={showFormattingBar}
                label="Tùy chọn định dạng"
              />
            )}
          </View>

          <View style={styles.toolbarRight}>
            <Tooltip label={note?.date ? `Đã tạo ${note.date}` : 'Đã tạo lúc nãy'}>
              <Text style={styles.editedTimeText}>
                {note?.date ? `Đã chỉnh sửa ${note.date}` : 'Đã chỉnh sửa lúc nãy'}
              </Text>
            </Tooltip>
            <ToolbarBtn icon="undo" onPress={handleUndo} label="Hoàn tác" />
            <ToolbarBtn icon="redo" onPress={handleRedo} label="Làm lại" />
            <TouchableOpacity onPress={handleSaveAndClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Picker */}
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
  // ===== REMINDER STYLES =====
  reminderPopover: {
    position: 'absolute',
    bottom: 44,
    left: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 14,
    minWidth: 220,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    zIndex: 500,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  reminderTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: colors.textPrimary,
  },
  reminderLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderInput: {
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
    marginBottom: 10,
    fontFamily: 'Inter-Regular',
    color: colors.textPrimary,
    outlineStyle: 'none',
  } as any,
  reminderPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.primarySubtle ?? '#e8f0fe',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginBottom: 10,
  },
  reminderPreviewText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.primary,
  },
  reminderBtnRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  reminderSaveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 4,
  },
  reminderSaveBtnText: {
    color: '#fff',
    fontFamily: 'Inter-Medium',
    fontSize: 13,
  },
  reminderClearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e53935',
  },
  reminderClearBtnText: {
    color: '#e53935',
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  reminderCancelBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  reminderCancelBtnText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  // ===== END REMINDER STYLES =====

  exportMenuPopover: {
    position: 'absolute',
    left: isWeb ? '100%' : 0,
    bottom: isWeb ? 0 : 80,
    marginLeft: 8,
    zIndex: 1000,
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    minWidth: 150,
  },
  inlineContainer: {
    position: 'relative',
    width: '100%',
    maxHeight: 500,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    borderRadius: 8,
    elevation: 0,
    shadowOpacity: 0,
    marginBottom: 16,
  },
  tagMenuPopover: {
    position: 'absolute',
    left: isWeb ? '100%' : 0,
    bottom: isWeb ? 0 : 40,
    marginLeft: 8,
    zIndex: 1000,
  },
  // ── Tag chips trong editor ────────────────────────────────────────────────
  tagChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderDefault,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingRight: 8,
    overflow: 'hidden',
  },
  tagChipBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingLeft: 10,
    paddingRight: 4,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  tagChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  // ──────────────────────────────────────────────────────────────────────────
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
  backBtn: {
    marginRight: 4,
    padding: 8,
    borderRadius: 20,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
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
  todoItemWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    position: 'relative',
  },
  todoCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textTertiary,
    marginTop: 2,
    marginRight: 14,
    flexShrink: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoCircleChecked: {
    backgroundColor: colors.textTertiary,
    borderColor: colors.textTertiary,
  },
  todoCircleSub: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  todoTextBlock: {
    flex: 1,
    flexDirection: 'column',
  },
  todoTitleInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPrimary,
    paddingVertical: 0,
    minHeight: 22,
    outlineStyle: 'none',
  } as any,
  todoTitleInputChecked: {
    textDecorationLine: 'line-through',
    color: colors.textTertiary,
  },
  todoTitleInputSub: {
    fontSize: 14,
  },
  todoContentInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
    paddingVertical: 0,
    minHeight: 18,
    marginTop: 2,
    outlineStyle: 'none',
  } as any,
  todoMoreBtn: {
    padding: 4,
    marginLeft: 6,
    marginTop: 2,
    borderRadius: 12,
    zIndex: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  todoItemMenu: {
    position: 'absolute',
    right: 0,
    top: 28,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    zIndex: 999999,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    zIndex: 999999,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  subtaskIndent: {
    paddingLeft: 36,
    borderBottomColor: 'transparent',
  },
  subtaskLine: {
    position: 'absolute',
    left: 46,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: colors.borderDefault,
  },
  addTodoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  addTodoBtnText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  removeBtn: {
    padding: 4,
    marginLeft: 8,
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
  labelList:      { flexDirection: 'row', gap: 8 },
  labelChip:      { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.bgSurface },
  labelChipText:  { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 13 },
  metaText:       { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  toolbarRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  toolbarBtn:     { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgSurface },
  optionPanel:    { backgroundColor: colors.bgSurface, borderRadius: 16, padding: 12, marginBottom: 12 },
  optionItem:     { paddingVertical: 10 },
  optionText:     { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 15 },
  colorOption:    { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  colorDotSmall:  { width: 18, height: 18, borderRadius: 6, borderWidth: 1, borderColor: colors.borderDefault },
  imageRow:       { marginBottom: 16 },
  imageThumb:     { width: 100, height: 70, borderRadius: 14, marginRight: 12 },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  toolbarLeft:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolbarRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  toolbarIcon:  { padding: 8, borderRadius: 20 },
  toolbarIconActive: { backgroundColor: colors.primarySubtle },
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
  menuItemText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary },
  closeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginLeft: 8,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  closeText: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.textPrimary },
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
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1, borderColor: colors.borderDefault,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  colorDotSelected: { borderColor: colors.primary, borderWidth: 2 },
  tooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    zIndex: 9999,
    marginBottom: 4,
    whiteSpace: 'nowrap',
    ...Platform.select({ web: { transform: 'translateX(-50%)' } as any }),
  } as any,
  tooltipBottom: { bottom: 'auto', top: '100%', marginBottom: 0, marginTop: 4 } as any,
  tooltipText: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: '#fff',
    ...Platform.select({ web: { whiteSpace: 'nowrap' } as any }),
  },
  editedTimeText: {
    fontFamily: 'Inter-Regular', fontSize: 12,
    color: colors.textTertiary || '#80868b',
    marginRight: 8,
    ...Platform.select({ web: { cursor: 'default' } as any }),
  },
});