import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TagChip } from '../ui/TagChip';
import { colors } from '../../constants/colors';

const cardColorMap: Record<string, string> = {
  default: '#FFFFFF',
  red:     '#FADADD',
  orange:  '#FEEFC3',
  yellow:  '#FEF7CD',
  green:   '#E2F3E8',
  teal:    '#D0F4EE',
  blue:    '#D3E3FD',
  purple:  '#E8DEFC',
  pink:    '#FDCFE8',
  brown:   '#F0E6DA',
};

export interface TodoItemData {
  id: string;
  title: string;
  is_completed: boolean;
}

export interface NoteCardData {
  id: string;
  type: 'text' | 'todo';
  color: string;
  title?: string;
  content_text?: string;
  is_pinned?: boolean;
  tags?: string[];
  collaborators?: { name: string }[];
  // Todo specific
  todo_items?: TodoItemData[];
  todo_total?: number;
  todo_completed?: number;
  date?: string;
  reminder?: string;
}

interface NoteCardProps {
  note: NoteCardData;
  onPress?: () => void;
}

// Collaborator avatar stack
function Avatars({ names }: { names: string[] }) {
  const shown = names.slice(0, 3);
  const extra = names.length - 3;
  return (
    <View style={styles.avatars}>
      {shown.map((name, i) => (
        <View
          key={i}
          style={[styles.avatar, { marginLeft: i === 0 ? 0 : -6, zIndex: shown.length - i }]}
        >
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

export function NoteCard({ note, onPress }: NoteCardProps) {
  const bg = cardColorMap[note.color] ?? cardColorMap.default;
  const isTodo = note.type === 'todo';
  const incompleteItems = note.todo_items?.filter(t => !t.is_completed) ?? [];
  const completedCount = note.todo_items?.filter(t => t.is_completed).length ?? 0;
  const hiddenIncomplete = Math.max(0, incompleteItems.length - 3);
  const visibleItems = incompleteItems.slice(0, 3);

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Pin icon */}
      {note.is_pinned && (
        <View style={styles.pinIcon}>
          <Feather name="map-pin" size={14} color={colors.textTertiary} />
        </View>
      )}

      {/* Title */}
      {note.title ? (
        <Text style={styles.title} numberOfLines={2}>{note.title}</Text>
      ) : null}

      {/* Text content */}
      {!isTodo && note.content_text ? (
        <Text style={styles.content} numberOfLines={4}>{note.content_text}</Text>
      ) : null}

      {/* Todo items */}
      {isTodo && (
        <View style={styles.todoList}>
          {visibleItems.map((item) => (
            <View key={item.id} style={styles.todoRow}>
              <View style={[styles.checkbox, item.is_completed && styles.checkboxDone]}>
                {item.is_completed && (
                  <Feather name="check" size={9} color="#fff" />
                )}
              </View>
              <Text
                style={[styles.todoText, item.is_completed && styles.todoTextDone]}
                numberOfLines={1}
              >
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

      {/* Tags */}
      {note.tags && note.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {note.tags.map((tag) => (
            <TagChip key={tag} label={tag} />
          ))}
        </View>
      )}

      {/* Footer */}
      {(note.collaborators?.length || note.date || note.todo_total) ? (
        <View style={styles.footer}>
          <Text style={styles.dateText}>{note.date ?? ''}</Text>
          <View style={styles.footerRight}>
            {note.collaborators && note.collaborators.length > 0 && (
              <Avatars names={note.collaborators.map(c => c.name)} />
            )}
            {note.todo_total != null && (
              <Text style={styles.ratioText}>
                {note.todo_completed ?? 0}/{note.todo_total}
              </Text>
            )}
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 1,
      },
    }),
  },
  pinIcon: {
    position: 'absolute',
    top: 14,
    right: 14,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 6,
    paddingRight: 24,
  },
  content: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  todoList: {
    gap: 6,
    marginBottom: 10,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  todoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  todoTextDone: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  moreText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
    marginLeft: 24,
  },
  completedText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  ratioText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: colors.textTertiary,
  },
  avatars: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  avatarText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 9,
    color: '#fff',
  },
  avatarExtra: {
    backgroundColor: colors.gray300,
  },
  avatarExtraText: {
    fontFamily: 'Inter-Regular',
    fontSize: 8,
    color: colors.textSecondary,
  },
});