import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, Dimensions } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState, useRef, useEffect } from 'react'; // ✅ ĐÃ GIỮ: useEffect để liên tục đồng bộ dữ liệu Store
import { TagChip } from '../ui/TagChip';
import { colors } from '../../constants/colors';
import { HoverBtn } from '../ui/HoverBtn';
// Import AppStore để lấy trạng thái theme
import { useAppStore } from '../../store/useAppStore';

// Bảng màu cho Chế độ Sáng (Giữ nguyên của bạn)
const cardColorMap: Record<string, string> = {
  default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
  green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
  pink: '#FDCFE8', brown: '#F0E6DA',
};

// Bảng màu cho Chế độ Tối (Màu trầm hơn, êm mắt hơn)
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
  title?: string; content_text?: string; is_pinned?: boolean;
  is_archived?: boolean; // ✅ ĐÃ GIỮ: Biến trạng thái lưu trữ
  is_trashed?: boolean;  // ✅ ĐÃ GIỮ: Biến trạng thái thùng rác
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
  onPin?: (id: string) => void;     // ✅ ĐÃ GIỮ: Nhận hàm ghim dữ liệu từ Store
  onTrash?: (id: string) => void;   // ✅ ĐÃ GIỮ: Nhận hàm vứt thùng rác từ Store
  isSelected: boolean;
  onSelect: () => void;
  isGridView?: boolean;
  /**
   * Khi true (màn hình Archive): nút archive đổi thành "Bỏ lưu trữ",
   * nút ghim bị ẩn, DotMenu hiển thị "Bỏ lưu trữ" thay vì "Lưu trữ".
   */
  isArchived?: boolean;             // ✅ ĐÃ HỢP NHẤT: Đón cờ kiểm tra màn hình Archive từ bản mới
  /**
   * Khi true (màn hình Trash): card chỉ đọc, toolbar chỉ có
   * "Khôi phục" (onArchive) và "Xóa vĩnh viễn" (onDelete).
   */
  isTrash?: boolean;                // ✅ ĐÃ HỢP NHẤT: Đón cờ kiểm tra màn hình Thùng rác từ bản mới
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

function DotMenu({ 
  isTodo, 
  isArchived, // ✅ ĐÃ CHUYỂN: Nhận cờ kiểm tra từ NoteCard để render menu linh hoạt
  onAction, 
  onClose, 
  isDark 
}: {
  isTodo: boolean;
  isArchived: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
  isDark: boolean;
}) {
  const baseItems = [
    { key: 'tag', label: 'Thêm tag' },
    { key: 'duplicate', label: 'Tạo bản sao' },
    { key: 'history', label: 'Xem lịch sử phiên bản' },
    // ✅ ĐÃ HỢP NHẤT LOGIC TỪ BẢN MỚI: Đổi nút bấm tùy theo màn hình Home hay Archive
    ...(isArchived
      ? [
        { key: 'unarchive', label: 'Bỏ lưu trữ' },
        { key: 'delete', label: 'Xóa ghi chú', danger: true },
      ]
      : [{ key: 'delete', label: 'Xóa ghi chú', danger: true }]),
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
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ position: 'relative' }}
      {...{ onMouseEnter: () => setShow(true), onMouseLeave: () => setShow(false) }}
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

export function NoteCard({ note, isSelected, onSelect, isGridView, onPress, onUpdate, onDelete, onArchive, onPin, onTrash, isArchived = false, isTrash = false }: NoteCardProps) {
  const { theme } = useAppStore(); 
  const isDark = theme === 'dark';

  const [hovered, setHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [localNote, setLocalNote] = useState(note);
  const [dotMenuPos, setDotMenuPos] = useState({ x: 0, y: 0 });
  const dotBtnRef = useRef<View>(null);

  // ✅ ĐÃ GIỮ: Tai nghe đồng bộ dữ liệu lập tức từ bên ngoài truyền vào State local khi Store thay đổi
  useEffect(() => {
    setLocalNote(note);
  }, [note]);

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
    if (action === 'delete') {
      // Nếu đang ở màn Thùng rác thì gọi hàm xóa vĩnh viễn, ngược lại đẩy vào Thùng rác của Store
      isTrash ? onDelete?.(note.id) : onTrash?.(note.id);
    }
    if (action === 'unarchive') onArchive?.(note.id);
  };

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
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: dynamicColors.border },
        hovered && styles.cardHovered,
        isSelected && { borderColor: colors.primary, borderWidth: 2 },
        { zIndex: hovered ? 100 : 1 },
      ]}
      {...hoverProps}
    >
      {/* ✅ ĐÃ SỬA: Nút ghim ăn theo dây Store onPin, tự động ẩn khi ở màn Archive và Trash */}
      {!isArchived && !isTrash && (hovered || localNote.is_pinned) ? (
        <View style={[styles.pinCorner, { opacity: (hovered || localNote.is_pinned) ? 1 : 0 }]}>
          <HoverBtn
            onPress={() => onPin?.(note.id)} 
            label={localNote.is_pinned ? "Bỏ ghim" : "Ghim"}
          >
            <Icon
              source={localNote.is_pinned ? 'pin' : 'pin-outline'}
              size={18}
              color={localNote.is_pinned ? colors.primary : dynamicColors.textTertiary}
            />
          </HoverBtn>
        </View>
      ) : null}

      {/* ✅ ĐÃ ĐỒNG BỘ: Màn hình Trash khóa tính năng bấm mở Editor, chuyển sang chế độ Chỉ đọc (Read-only) */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={isTrash ? undefined : onPress}
        activeOpacity={isTrash ? 1 : 0.9}
      >
        {localNote.title ? (
          <Text style={[styles.title, { color: dynamicColors.textPrimary }]} numberOfLines={2}>{localNote.title}</Text>
        ) : null}

        {!isTodo && localNote.content_text ? (
          <Text style={[styles.content, { color: dynamicColors.textSecondary }]} numberOfLines={4}>{localNote.content_text}</Text>
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
          {isTrash ? (
            /* ── CHUẨN HOÀN CHỈNH: Toolbar màn Thùng rác đổi tính năng sang chỉ hiện Khôi phục & Xóa vĩnh viễn ── */
            <>
              <ActionBtn
                icon="delete-restore"
                label="Khôi phục"
                onPress={() => onArchive?.(note.id)} // Tái sử dụng đầu dây onArchive làm hàm Khôi phục ở màn Trash
                color={dynamicColors.textSecondary}
              />
              <ActionBtn
                icon="delete-forever-outline"
                label="Xóa vĩnh viễn"
                onPress={() => onDelete?.(note.id)}   // Tái sử dụng đầu dây onDelete làm hàm Xóa vĩnh viễn ở màn Trash
                color={colors.danger}
              />
            </>
          ) : (
            /* ── Toolbar thông thường (Home / Archive) ── */
            <>
              {/* Đổi màu */}
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
              
              {/* Nhắc nhở — ẩn khi ghi chú đã được đem cất vào kho Archive */}
              {!isArchived && !isTodo && <ActionBtn icon="bell-outline" label="Nhắc nhở" onPress={() => { }} />}
              
              <ActionBtn icon="account-plus-outline" label="Thêm CTV" onPress={() => { }} />
              
              {/* ✅ ĐÃ ĐỒNG BỘ: Nút biến hình linh hoạt đổi Icon và Label theo trạng thái isArchived */}
              <ActionBtn 
                icon={isArchived ? 'archive-arrow-up-outline' : 'archive-arrow-down-outline'} 
                label={isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'} 
                onPress={() => onArchive?.(note.id)} 
              />

              {/* Dot menu */}
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
                    });
                    setShowDotMenu(v => !v);
                    setShowColorPicker(false);
                  }}
                />
              </View>
              <Modal visible={showDotMenu} transparent animationType="none" onRequestClose={() => setShowDotMenu(false)}>
                <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setShowDotMenu(false)} activeOpacity={1} />
                <View style={[styles.dotMenu, { position: 'absolute', top: dotMenuPos.y, left: dotMenuPos.x }]}>
                  <DotMenu isTodo={isTodo} isArchived={isArchived} onAction={handleDotAction} onClose={() => setShowDotMenu(false)} isDark={isDark} />
                </View>
              </Modal>
            </>
          )}
        </View>
      )}

      {/* ✅ ĐÃ ĐỒNG BỘ: Ô chọn checkbox hàng loạt tự ẩn khi đứng ở màn Thùng rác Trash, kiểm tra chặt bằng toán tử ba ngôi chặn đứng bug lọt số 0 ra Web */}
      {(hovered || isSelected) && !isTrash ? (
        <View style={styles.checkboxWrapper}>
          <HoverBtn onPress={onSelect} style={[isSelected && { backgroundColor: isDark ? '#1F2937' : '#fff' }]} label="Chọn">
            <Icon source={isSelected ? "check-circle" : "circle-outline"} size={22} color={isSelected ? colors.primary : dynamicColors.textTertiary} />
          </HoverBtn>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginBottom: 16, 
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.borderDefault,
    overflow: 'visible',
    zIndex: 1,
    width: '100%',
    ...Platform.select({ web: { cursor: 'pointer', overflow: 'visible', } as any }),
  },
  cardHovered: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)',
        transition: 'box-shadow 0.2s ease-in-out'
      } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
    }),
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
      web: { boxShadow: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12 } as any,
    }),
  },
  dotMenuItem: { paddingHorizontal: 16, paddingVertical: 10, ...Platform.select({ web: { cursor: 'pointer' } as any }), },
  dotMenuText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary },
  tooltip: { position: 'absolute', bottom: '100%', left: '50%', backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, zIndex: 999, marginBottom: 4, ...Platform.select({ web: { transform: 'translateX(-50%)' } as any }) } as any,
  tooltipText: { fontFamily: 'Inter-Regular', fontSize: 12, color: '#fff' },
});