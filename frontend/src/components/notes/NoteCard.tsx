import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Dimensions, useWindowDimensions } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState, useRef, useEffect } from 'react';
import { TagChip } from '../ui/TagChip';
import { colors } from '../../constants/colors';
import { HoverBtn } from '../ui/HoverBtn';
// THÊM: Import AppStore để lấy trạng thái theme
import { useAppStore } from '../../store/useAppStore';
import { useSelectionStore } from '../../store/useSelectionStore';

// Bảng màu cho Chế độ Sáng (Giữ nguyên của bạn)
const cardColorMap: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
  green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
  pink: '#FDCFE8', brown: '#F0E6DA',
};

// THÊM: Bảng màu cho Chế độ Tối (Màu trầm hơn, êm mắt hơn)
const darkCardColorMap: Record<string, string> = {
  default: '#1F2937', red: '#4C1D1D', orange: '#452A10', yellow: '#453510',
  green: '#064E3B', teal: '#103E3E', blue: '#1E3A8A', purple: '#2E1065',
  pink: '#4C1D35', brown: '#2D251F',
};

const NOTE_COLORS = [
  { key: 'default', bg: '#FFFFFF' }, { key: 'red', bg: '#FADADD' },
  { key: 'orange', bg: '#FEEFC3' }, { key: 'yellow', bg: '#FEF7CD' },
  { key: 'green', bg: '#E2F3E8' }, { key: 'teal', bg: '#D0F4EE' },
  { key: 'blue', bg: '#D3E3FD' }, { key: 'purple', bg: '#E8DEFC' },
  { key: 'pink', bg: '#FDCFE8' }, { key: 'brown', bg: '#F0E6DA' },
];

export interface TodoItemData {
  id: string; title: string; is_completed: boolean; subtasks?: TodoItemData[];
}

export interface NoteCardData {
  id: string; type: 'text' | 'todo'; color: string;
  title?: string; content_text?: string; is_pinned?: 0 | 1; is_archived?: 0 | 1; is_trashed?: 0 | 1;
  tags?: string[]; collaborators?: { name: string }[];
  todo_items?: TodoItemData[]; todo_total?: number;
  todo_completed?: number; date?: string; reminder?: string;
  images?: string[];
  labels?: string[];
}

interface NoteCardProps {
  note: NoteCardData;
  onPress?: () => void;
  onUpdate?: (id: string, changes: Partial<NoteCardData>) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  isSelected: boolean;
  onSelect: () => void;
  isGridView?: boolean;
  // THÊM: cho phép tuỳ chỉnh nút archive (dùng cho màn Archive để hiển thị "Huỷ lưu trữ")
  archiveLabel?: string;
  archiveIcon?: string;
}

function Avatars({ names, isDark }: { names: string[]; isDark: boolean }) {
  const shown = names.slice(0, 3);
  const extra = names.length - 3;
  return (
    <View style={styles.avatars}>
      {shown.map((name, i) => (
        <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i, borderColor: isDark ? '#1F2937' : '#fff' }]}>
          <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -6, borderColor: isDark ? '#1F2937' : '#fff' }]}>
          <Text style={styles.avatarExtraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

function ColorPicker({ onSelect, onClose, isDark }: { onSelect: (color: string) => void; onClose: () => void; isDark: boolean }) {
  return (
    <View style={[styles.colorPicker, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
      {NOTE_COLORS.map((c) => (
        <HoverBtn
          key={c.key}
          size={24}
          borderRadius={12}
          hoverBorder
          style={[{ backgroundColor: isDark ? (darkCardColorMap[c.key] || darkCardColorMap.default) : c.bg }]}
          onPress={() => { onSelect(c.key); onClose(); }}
          label={c.key.charAt(0).toUpperCase() + c.key.slice(1)}
        />
      ))}
    </View>
  );
}

function DotMenu({ isTodo, onAction, onClose, isDark }: {
  isTodo: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const baseItems = [
    { key: 'tag', label: 'Thêm tag' },
    { key: 'duplicate', label: 'Tạo bản sao' },
    { key: 'history', label: 'Xem lịch sử phiên bản' },
    { key: 'delete', label: 'Xóa ghi chú', danger: true },
  ];
  const todoItems = [
    { key: 'sort', label: 'Sắp xếp theo' },
    { key: 'clear_done', label: 'Xóa tất cả việc đã hoàn thành' },
  ];
  const items = isTodo ? [...baseItems.slice(0, 1), ...todoItems, ...baseItems.slice(1)] : baseItems;

  return (
    <View style={[styles.dotMenu, isDark && { backgroundColor: '#1F2937', borderColor: '#374151' }]}>
      {items.map((item) => (
        <HoverBtn
          key={item.key}
          style={styles.dotMenuItem}
          onPress={() => { onAction(item.key); onClose(); }}
          fullWidth
          borderRadius={0}
        >
          <Text style={[styles.dotMenuText, isDark && { color: '#F9FAFB' }, (item as any).danger && { color: colors.danger }]}>
            {item.label}
          </Text>
        </HoverBtn>
      ))}
    </View>
  );
}

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [showBelow, setShowBelow] = useState(false);
  const ref = useRef<any>(null);

  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View ref={ref} style={{ position: 'relative' }}
      {...{
        onMouseEnter: () => {
          ref.current?.measureInWindow((_x: number, y: number) => {
            setShowBelow(y < 100); // gần đỉnh → hiện bên dưới
            setShow(true);
          });
        },
        onMouseLeave: () => setShow(false)
      }}
    >
      {children}
      {show && (
        <View style={[
          styles.tooltip,
          showBelow
            ? { bottom: undefined, top: '100%', marginBottom: 0, marginTop: 4 }
            : { top: undefined, bottom: '100%' },
        ]}>
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      )}
    </View>
  );
}

function ActionBtn({ icon, label, onPress, color }: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <Tooltip label={label}>
      <HoverBtn
        onPress={onPress}
        style={styles.actionBtn}
      >
        <Icon source={icon} size={18} color={color || colors.textSecondary} />
      </HoverBtn>
    </Tooltip>
  );
}

// Strip HTML tags để hiển thị plain text trên card
const stripHtml = (html: string): string =>
  html
    .replace(/<div><br\s*\/?><\/div>/gi, '\n') // dòng trống
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<div>/gi, '\n')   // ← thêm: mở div = xuống dòng
    .replace(/<\/div>/gi, '')   // đóng div = bỏ (đã xử lý bởi dòng trên)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/^\n/, '')         // bỏ \n thừa ở đầu nếu html bắt đầu bằng <div>
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export function NoteCard({ note, isSelected, onSelect, isGridView, onPress, onUpdate, onDelete, onArchive, archiveLabel = 'Lưu trữ', archiveIcon = 'archive-arrow-down-outline' }: NoteCardProps) {
  const { theme } = useAppStore(); // Lấy theme hệ thống
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  const { selectedIds } = useSelectionStore();
  const isSelectionMode = selectedIds.length > 0;

  const [hovered, setHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);

  const [localNote, setLocalNote] = useState(note);

  useEffect(() => {
    setLocalNote(note);
  }, [note]);

  const [dotMenuPos, setDotMenuPos] = useState({ x: 0, y: 0 });
  const dotBtnRef = useRef<View>(null);

  // MÀU SẮC ĐỘNG THEO THEME
  const dynamicColors = {
    textPrimary: isDark ? '#F9FAFB' : colors.textPrimary,
    textSecondary: isDark ? '#9CA3AF' : colors.textSecondary,
    textTertiary: isDark ? '#6B7280' : colors.textTertiary,
    border: isDark ? '#374151' : colors.borderDefault,
  };

  const update = (changes: Partial<NoteCardData>) => {
    setLocalNote(prev => ({ ...prev, ...changes }));
    onUpdate?.(note.id, changes);
  };

  const handleDotAction = (action: string) => {
    if (action === 'delete') onDelete?.(note.id);
  };

  // Logic chọn bảng màu bg
  const bg = isDark
    ? (darkCardColorMap[localNote.color] ?? darkCardColorMap.default)
    : (cardColorMap[localNote.color] ?? cardColorMap.default);

  const isTodo = localNote.type === 'todo';
  const incompleteItems = localNote.todo_items?.filter(t => !t.is_completed) ?? [];
  const completedCount = localNote.todo_items?.filter(t => t.is_completed).length ?? 0;
  const hiddenIncomplete = Math.max(0, incompleteItems.length - 3);
  const visibleItems = incompleteItems.slice(0, 3);

  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => { setHovered(false); setShowColorPicker(false); setShowDotMenu(false); },
  } : {};

  return (
    <View style={[styles.cardOuter, { marginBottom: isMobile ? 4 : 6 }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: bg, borderColor: dynamicColors.border },
          hovered && styles.cardHovered,
          isSelected && { borderColor: colors.primary, borderWidth: 2 },
          { zIndex: hovered ? 100 : 1, marginBottom: isMobile ? 4 : 6 },
        ]}
        {...hoverProps}
      >
        {(hovered || localNote.is_pinned === 1) && (
          <View style={[styles.pinCorner, { opacity: (hovered || localNote.is_pinned === 1) ? 1 : 0 }]}>
            <HoverBtn
              onPress={() => update({ is_pinned: localNote.is_pinned === 1 ? 0 : 1 })}
              label={localNote.is_pinned === 1 ? "Bỏ ghim" : "Ghim"}
            >
              <Icon
                source={localNote.is_pinned === 1 ? 'pin' : 'pin-outline'}
                size={18}
                color={localNote.is_pinned === 1 ? colors.primary : dynamicColors.textTertiary}
              />
            </HoverBtn>
          </View>
        )}

        <TouchableOpacity
          style={styles.cardContent}
          onPress={isMobile && isSelectionMode ? onSelect : onPress}
          onLongPress={isMobile ? onSelect : undefined}
          delayLongPress={350}
          activeOpacity={0.9}
        >
          {localNote.title ? (
            <Text style={[styles.title, { color: dynamicColors.textPrimary }]} numberOfLines={2}>{localNote.title}</Text>
          ) : null}

          {!isTodo && localNote.content_text ? (
            <Text style={[styles.content, { color: dynamicColors.textSecondary }]} numberOfLines={4}>
              {stripHtml(localNote.content_text)}
            </Text>
          ) : null}

          {isTodo && (
            <View style={styles.todoList}>
              {visibleItems.map((item) => (
                <View key={item.id} style={styles.todoRow}>
                  <View style={[styles.checkbox, isDark && { borderColor: '#4B5563' }, item.is_completed && styles.checkboxDone]}>
                    {item.is_completed && <Icon source="check" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.todoText, { color: dynamicColors.textSecondary }, item.is_completed && styles.todoTextDone]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
              ))}
              {hiddenIncomplete > 0 && (
                <Text style={[styles.moreText, { color: dynamicColors.textTertiary }]}>Xem thêm {hiddenIncomplete} việc...</Text>
              )}
              {completedCount > 0 && (
                <Text style={[styles.completedText, { color: dynamicColors.textTertiary }]}>Đã hoàn thành ({completedCount})</Text>
              )}
            </View>
          )}

          {localNote.tags && localNote.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {localNote.tags.map((tag) => <TagChip key={tag} label={tag} />)}
            </View>
          )}

          <View style={styles.footer}>
            <Text style={[styles.dateText, { color: dynamicColors.textTertiary }]}>{localNote.date ?? ''}</Text>
            <View style={styles.footerRight}>
              {localNote.collaborators && localNote.collaborators.length > 0 && (
                <Avatars names={localNote.collaborators.map(c => c.name)} isDark={isDark} />
              )}
              {localNote.todo_total != null && (
                <Text style={[styles.ratioText, { color: dynamicColors.textTertiary }]}>
                  {localNote.todo_completed ?? 0}/{localNote.todo_total}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {hovered && (
          <View style={[styles.toolbar, { borderTopColor: dynamicColors.border }]}>
            <View style={{ position: 'relative' }}>
              <ActionBtn
                icon="palette-outline"
                label="Đổi màu"
                onPress={() => { setShowColorPicker(v => !v); setShowDotMenu(false); }}
                color={showColorPicker ? colors.primary : dynamicColors.textSecondary}
              />
              {showColorPicker && (
                <ColorPicker
                  isDark={isDark}
                  onSelect={(color) => update({ color })}
                  onClose={() => setShowColorPicker(false)}
                />
              )}
            </View>
            {!isTodo && <ActionBtn icon="bell-outline" label="Nhắc nhở" onPress={() => { }} />}
            <ActionBtn icon="account-plus-outline" label="Thêm CTV" onPress={() => { }} />
            <ActionBtn icon={archiveIcon} label={archiveLabel} onPress={() => onArchive?.(note.id)} />

            <View ref={dotBtnRef}>
              <ActionBtn
                icon="dots-vertical"
                label="Thêm tùy chọn"
                onPress={() => {
                  dotBtnRef.current?.measureInWindow((x, y, w, h) => {
                    const screenHeight = Dimensions.get('window').height;
                    const menuHeight = isTodo ? 280 : 200;
                    const spaceBelow = screenHeight - (y + h);
                    if (spaceBelow < menuHeight) {
                      setDotMenuPos({ x: x - 160, y: y - menuHeight });
                    } else {
                      setDotMenuPos({ x: x - 160, y: y + h + 4 });
                    }
                    setDotMenuPos({ x: x - 160, y: y + h + 4 });
                  });
                  setShowDotMenu(v => !v);
                  setShowColorPicker(false);
                }}
              />
            </View>
            <Modal visible={showDotMenu} transparent animationType="none" onRequestClose={() => setShowDotMenu(false)}>
              <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowDotMenu(false)} activeOpacity={1} />
              <View style={[styles.dotMenu, { position: 'absolute', top: dotMenuPos.y, left: dotMenuPos.x }]}>
                <DotMenu isTodo={isTodo} onAction={handleDotAction} onClose={() => setShowDotMenu(false)} isDark={isDark} />
              </View>
            </Modal>
          </View>
        )}

        {(isMobile ? isSelectionMode : (hovered || isSelected)) && (
          <View style={styles.checkboxWrapper}>
            <HoverBtn onPress={onSelect} style={[isSelected && { backgroundColor: isDark ? '#1F2937' : '#fff' }]} label="Chọn">
              <Icon source={isSelected ? "check-circle" : "circle-outline"} size={22} color={isSelected ? colors.primary : dynamicColors.textTertiary} />
            </HoverBtn>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginBottom: 16, // Giữ lại cái này để có khoảng cách giữa các thẻ trên dưới
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'visible',
    zIndex: 1,

    // XÓA width: 260, flexGrow, flexShrink và marginRight đi
    // Trả lại width 100% để FlashList tự động tính toán kích thước cột
    width: '100%',

    ...Platform.select({ web: { cursor: 'pointer', overflow: 'visible', } as any }),
  },
  cardHovered: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
        // Thêm transition để hiệu ứng hover mượt mà hơn như bản gốc
        transition: 'box-shadow 0.2s ease-in-out'
      } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
    }),
  },
  cardOuter: {
    paddingTop: 12,
    paddingLeft: 12,
    overflow: 'visible',
    ...Platform.select({ web: { overflow: 'visible' } as any }),
  },
  cardContent: { padding: 16, paddingTop: 20 },
  checkboxCorner: {
    position: 'absolute', top: -12, left: -12, zIndex: 1,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  checkboxWrapper: { position: 'absolute', top: -10, left: -10, zIndex: 99 },
  pinCorner: { position: 'absolute', top: 1, right: 10, zIndex: 10, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'Inter-SemiBold', fontSize: 16, color: colors.textPrimary, marginBottom: 6, paddingRight: 20 },
  content: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 10 },
  todoList: { gap: 6, marginBottom: 10 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.gray400, alignItems: 'center', justifyContent: 'center', flexShrink: 0, },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  todoText: { fontFamily: 'Inter-Regular', fontSize: 14, flex: 1 },
  todoTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  moreText: { fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2, marginLeft: 24 },
  completedText: { fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontFamily: 'Inter-Regular', fontSize: 12 },
  ratioText: { fontFamily: 'Inter-Regular', fontSize: 12 },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gray400, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  avatarText: { fontFamily: 'Inter-SemiBold', fontSize: 9, color: '#fff' },
  avatarExtra: { backgroundColor: colors.gray300 },
  avatarExtraText: { fontFamily: 'Inter-Regular', fontSize: 8, color: colors.textSecondary },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderTopWidth: 1, gap: 2, ...Platform.select({
      web: { overflow: 'visible' } as any,
    }),
  },
  actionBtn: { width: 32, height: 32, borderRadius: 6, alignItems: 'center', justifyContent: 'center', ...Platform.select({ web: { cursor: 'pointer' } as any }), },
  colorPicker: {
    position: 'absolute', bottom: 36, left: 0, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.bgSurface, borderRadius: 10, padding: 8, gap: 6, width: 172, zIndex: 9999, borderWidth: 1, borderColor: colors.borderDefault, ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any,
    }),
  },
  colorDot: {
    width: 24, height: 24, borderRadius: 12,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  dotMenu: {
    backgroundColor: colors.bgSurface, borderRadius: 8, paddingVertical: 4, minWidth: 200, borderWidth: 1, borderColor: colors.borderDefault, ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any,
    }),
  },
  dotMenuItem: { paddingHorizontal: 16, paddingVertical: 10, ...Platform.select({ web: { cursor: 'pointer' } as any }), },
  dotMenuText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary },
  tooltip: { position: 'absolute', bottom: '100%', left: '50%', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, zIndex: 999, marginBottom: 4, ...Platform.select({ web: { transform: 'translateX(-50%)', whiteSpace: 'nowrap' } as any }) } as any,
  tooltipText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#fff' },
});