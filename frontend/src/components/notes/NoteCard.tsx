import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Icon, MD3Colors } from 'react-native-paper';
import { useState, useRef } from 'react';
import { TagChip } from '../ui/TagChip';
import { colors } from '../../constants/colors';

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

export interface TodoItemData {
  id: string; title: string; is_completed: boolean;
}

export interface NoteCardData {
  id: string; type: 'text' | 'todo'; color: string;
  title?: string; content_text?: string; is_pinned?: boolean;
  tags?: string[]; collaborators?: { name: string }[];
  todo_items?: TodoItemData[]; todo_total?: number;
  todo_completed?: number; date?: string; reminder?: string;
  images?: string[];
}

interface NoteCardProps {
  note: NoteCardData;
  onPress?: () => void;
  onUpdate?: (id: string, changes: Partial<NoteCardData>) => void;
  onDelete?: (id: string) => void;
  onArchive?: (id: string) => void;
  isSelected: boolean; // Thêm dòng này
  onSelect: () => void; // Thêm dòng này
}

function Avatars({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const extra = names.length - 3;
  return (
    <View style={styles.avatars}>
      {shown.map((name, i) => (
        <View key={i} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }]}>
          <Text style={styles.avatarText}>{name[0].toUpperCase()}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatar, styles.avatarExtra, { marginLeft: -6 }]}>
          <Text style={styles.avatarExtraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// Color picker popover
function ColorPicker({ onSelect, onClose }: { onSelect: (color: string) => void; onClose: () => void }) {
  return (
    <View style={styles.colorPicker}>
      {NOTE_COLORS.map((c) => (
        <TouchableOpacity
          key={c.key}
          style={[styles.colorDot, { backgroundColor: c.bg }]}
          onPress={() => { onSelect(c.key); onClose(); }}
        />
      ))}
    </View>
  );
}

// 3-dot menu
function DotMenu({ isTodo, onAction, onClose }: {
  isTodo: boolean;
  onAction: (action: string) => void;
  onClose: () => void;
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
    <View style={styles.dotMenu}>
      {items.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.dotMenuItem}
          onPress={() => { onAction(item.key); onClose(); }}
        >
          <Text style={[styles.dotMenuText, (item as any).danger && { color: colors.danger }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// Tooltip wrapper (web only)
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

// Action icon button in toolbar
function ActionBtn({ icon, label, onPress, color }: {
  icon: string;
  label: string;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.actionBtn}
      activeOpacity={0.6}
    >
      <Icon source={icon} size={18} color={color || colors.textSecondary} />
    </TouchableOpacity>
  );
}

export function NoteCard({ note, isSelected, onSelect, onPress, onUpdate, onDelete, onArchive }: NoteCardProps) {
  const [hovered, setHovered] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDotMenu, setShowDotMenu] = useState(false);
  const [localNote, setLocalNote] = useState(note);

  const update = (changes: Partial<NoteCardData>) => {
    setLocalNote(prev => ({ ...prev, ...changes }));
    onUpdate?.(note.id, changes);
  };

  const handleDotAction = (action: string) => {
    if (action === 'delete') onDelete?.(note.id);
    else if (action === 'duplicate') { /* TODO */ }
    else if (action === 'history') { /* TODO */ }
  };

  const bg = cardColorMap[localNote.color] ?? cardColorMap.default;
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
        { backgroundColor: bg },
        hovered && styles.cardHovered,
        isSelected && { borderColor: colors.primary, borderWidth: 2 },
      ]}
      {...hoverProps}
    >
      {/* CỤM GÓC TRÁI TRÊN - CHECKBOX CHÈN RA NGOÀI */}
      {(hovered || isSelected) && (
        <View style={styles.checkboxWrapper}>
          <TouchableOpacity
            onPress={onSelect} // Toggle trạng thái khi click
            activeOpacity={0.8}
            style={[
              isSelected && { backgroundColor: '#fff' } // Đảm bảo nền trắng khi được chọn
            ]}
          >
            <Icon
              source={isSelected ? "check-circle" : "circle-outline"}
              size={22}
              color={isSelected ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Pin icon góc trên phải - luôn hiện nếu pinned, chỉ hiện khi hover nếu chưa pin */}

      {/* 2. SỬA PHẦN PIN CORNER */}
      {(hovered || localNote.is_pinned) && (
        <View style={[styles.pinCorner, { opacity: (hovered || localNote.is_pinned) ? 1 : 0 }]}>
          <TouchableOpacity
            onPress={() => update({ is_pinned: !localNote.is_pinned })}
            activeOpacity={0.7}
          >
            {/* SỬ DỤNG ICON CỦA REACT NATIVE PAPER */}
            <Icon
              source={localNote.is_pinned ? 'pin' : 'pin-outline'} // Sử dụng icon của paper
              size={18}
              // Sử dụng màu của Mindraft: primary nếu đã ghim, tertiary nếu chưa
              color={localNote.is_pinned ? colors.primary : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Card content - click để mở editor */}
      <TouchableOpacity
        style={styles.cardContent}
        onPress={onPress}
        activeOpacity={0.9}
      >
        {localNote.title ? (
          <Text style={styles.title} numberOfLines={2}>{localNote.title}</Text>
        ) : null}

        {!isTodo && localNote.content_text ? (
          <Text style={styles.content} numberOfLines={4}>{localNote.content_text}</Text>
        ) : null}

        {isTodo && (
          <View style={styles.todoList}>
            {visibleItems.map((item) => (
              <View key={item.id} style={styles.todoRow}>
                <View style={[styles.checkbox, item.is_completed && styles.checkboxDone]}>
                  {item.is_completed && (
                    <Icon
                      source="check"
                      size={10}
                      color="#fff"
                    />)}
                </View>
                <Text style={[styles.todoText, item.is_completed && styles.todoTextDone]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
            ))}
            {hiddenIncomplete > 0 && (
              <Text style={styles.moreText}>Xem thêm {hiddenIncomplete} việc...</Text>
            )}
            {completedCount > 0 && (
              <Text style={styles.completedText}>Đã hoàn thành ({completedCount})</Text>
            )}
          </View>
        )}

        {localNote.tags && localNote.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {localNote.tags.map((tag) => <TagChip key={tag} label={tag} />)}
          </View>
        )}

        {(localNote.collaborators?.length || localNote.date || localNote.todo_total != null) ? (
          <View style={styles.footer}>
            <Text style={styles.dateText}>{localNote.date ?? ''}</Text>
            <View style={styles.footerRight}>
              {localNote.collaborators && localNote.collaborators.length > 0 && (
                <Avatars names={localNote.collaborators.map(c => c.name)} />
              )}
              {localNote.todo_total != null && (
                <Text style={styles.ratioText}>
                  {localNote.todo_completed ?? 0}/{localNote.todo_total}
                </Text>
              )}
            </View>
          </View>
        ) : null}
      </TouchableOpacity>

      {/* Action toolbar - chỉ hiện khi hover */}
      {hovered && (
        <View style={styles.toolbar}>
          {/* Color picker */}
          <View style={{ position: 'relative' }}>
            <ActionBtn
              icon="palette-outline"
              label="Đổi màu"
              onPress={() => { setShowColorPicker(v => !v); setShowDotMenu(false); }}
              color={showColorPicker ? colors.primary : undefined}
            />
            {showColorPicker && (
              <ColorPicker
                onSelect={(color) => update({ color })}
                onClose={() => setShowColorPicker(false)}
              />
            )}
          </View>

          {/* Reminder - chỉ text note */}
          {!isTodo && (
            <ActionBtn icon="bell-outline" label="Nhắc nhở" onPress={() => { }} />
          )}

          {/* Thêm CTV */}
          <ActionBtn icon="account-plus-outline" label="Thêm cộng tác viên" onPress={() => { }} />

          {/* Lưu trữ */}
          <ActionBtn icon="archive-arrow-down-outline" label="Lưu trữ" onPress={() => onArchive?.(note.id)} />

          {/* 3-dot menu */}
          <View style={{ position: 'relative' }}>
            <ActionBtn
              icon="dots-vertical"
              label="Thêm tùy chọn"
              onPress={() => { setShowDotMenu(v => !v); setShowColorPicker(false); }}
            />
            {showDotMenu && (
              <DotMenu
                isTodo={isTodo}
                onAction={handleDotAction}
                onClose={() => setShowDotMenu(false)}
              />
            )}
          </View>
        </View>
      )}
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

    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  cardHovered: {
    ...Platform.select({
      web: { boxShadow: '0 1px 2px 0 rgba(60,64,67,0.30), 0 1px 3px 1px rgba(60,64,67,0.15)' } as any,
      default: {
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
      },
    }),
  },
  cardContent: {
    padding: 16,
    paddingTop: 20,
  },
  checkboxCorner: {
    position: 'absolute', top: -12, left: -12, zIndex: 10,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  checkboxWrapper: {
    position: 'absolute',
    // Đẩy ngược lên trên và sang trái để lấn ra ngoài cạnh card
    top: -10,
    left: -10,
    zIndex: 99, // Đảm bảo nằm trên cùng của card
  },


  pinCorner: {
    position: 'absolute', top: 1, right: 10, zIndex: 10,
    width: 28, height: 28, alignItems: 'center', justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter-SemiBold', fontSize: 16,
    color: colors.textPrimary, marginBottom: 6,
    paddingRight: 20,
  },
  content: {
    fontFamily: 'Inter-Regular', fontSize: 14,
    color: colors.textSecondary, lineHeight: 21, marginBottom: 10,
  },
  todoList: { gap: 6, marginBottom: 10 },
  todoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: colors.gray400,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  todoText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary, flex: 1 },
  todoTextDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  moreText: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textTertiary, marginTop: 2, marginLeft: 24 },
  completedText: { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.textTertiary, marginTop: 4 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, marginBottom: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateText: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textTertiary },
  ratioText: { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.textTertiary },
  avatars: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.gray400,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fff',
  },
  avatarText: { fontFamily: 'Inter-SemiBold', fontSize: 9, color: '#fff' },
  avatarExtra: { backgroundColor: colors.gray300 },
  avatarExtraText: { fontFamily: 'Inter-Regular', fontSize: 8, color: colors.textSecondary },

  // Toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderDefault,
    gap: 2,
  },
  actionBtn: {
    width: 32, height: 32, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },

  // Color picker popover
  colorPicker: {
    position: 'absolute', bottom: 36, left: 0,
    flexDirection: 'row', flexWrap: 'wrap',
    backgroundColor: colors.bgSurface,
    borderRadius: 10, padding: 8, gap: 6,
    width: 172,
    borderWidth: 1, borderColor: colors.borderDefault,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any,
    }),
  },
  colorDot: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1, borderColor: colors.borderDefault,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },

  // 3-dot menu
  dotMenu: {
    position: 'absolute', bottom: 36, right: 0,
    backgroundColor: colors.bgSurface,
    borderRadius: 8, paddingVertical: 4,
    minWidth: 200,
    borderWidth: 1, borderColor: colors.borderDefault,
    zIndex: 100,
    ...Platform.select({
      web: { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } as any,
    }),
  },
  dotMenuItem: {
    paddingHorizontal: 16, paddingVertical: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as any }),
  },
  dotMenuText: {
    fontFamily: 'Inter-Regular', fontSize: 14, color: colors.textSecondary,
  },

  // Tooltip
  tooltip: {
    position: 'absolute', bottom: '100%', left: '50%',
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4,
    zIndex: 999, marginBottom: 4, whiteSpace: 'nowrap',
    ...Platform.select({ web: { transform: 'translateX(-50%)' } as any }),
  } as any,
  tooltipText: {
    fontFamily: 'Inter-Regular', fontSize: 12, color: '#fff',
  },
});