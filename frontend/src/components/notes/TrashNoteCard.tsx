import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Icon } from 'react-native-paper';
import { useState } from 'react';
import { colors } from '../../constants/colors';
import { HoverBtn } from '../ui/HoverBtn';
import { useAppStore } from '../../store/useAppStore';
import { NoteCardData, TodoItemData } from './NoteCard';

const cardColorMap: Record<string, string> = {
    default: '#FFFFFF', red: '#FADADD', orange: '#FEEFC3', yellow: '#FEF7CD',
    green: '#E2F3E8', teal: '#D0F4EE', blue: '#D3E3FD', purple: '#E8DEFC',
    pink: '#FDCFE8', brown: '#F0E6DA',
};

const darkCardColorMap: Record<string, string> = {
    default: '#1F2937', red: '#4C1D1D', orange: '#452A10', yellow: '#453510',
    green: '#064E3B', teal: '#103E3E', blue: '#1E3A8A', purple: '#2E1065',
    pink: '#4C1D35', brown: '#2D251F',
};

interface TrashNoteCardProps {
    note: NoteCardData;
    onDelete: (id: string) => void;
    onRestore: (id: string) => void;
    onPress?: (note: NoteCardData) => void;
}

// Tooltip đơn giản (copy từ NoteCard)
function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
    const [show, setShow] = useState(false);
    const isWeb = Platform.OS === 'web';
    if (!isWeb) return <>{children}</>;
    return (
        <View
            style={{ position: 'relative' }}
            {...{
                onMouseEnter: () => setShow(true),
                onMouseLeave: () => setShow(false),
            }}
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

function stripHtml(html: string): string {
    return html
        .replace(/<div><br\s*\/?><\/div>/gi, '\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/^\n/, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function TrashNoteCard({ note, onDelete, onRestore, onPress }: TrashNoteCardProps) {
    const { theme } = useAppStore();
    const isDark = theme === 'dark';
    const [hovered, setHovered] = useState(false);

    const bg = isDark
        ? (darkCardColorMap[note.color] ?? darkCardColorMap.default)
        : (cardColorMap[note.color] ?? cardColorMap.default);

    const dynamicColors = {
        textPrimary: isDark ? '#F9FAFB' : colors.textPrimary,
        textSecondary: isDark ? '#9CA3AF' : colors.textSecondary,
        border: isDark ? '#374151' : colors.borderDefault,
    };

    const isTodo = note.type === 'todo';
    const incompleteItems = note.todo_items?.filter(t => !t.is_completed) ?? [];
    const visibleItems = incompleteItems.slice(0, 3);
    const hiddenIncomplete = Math.max(0, incompleteItems.length - 3);

    const isWeb = Platform.OS === 'web';

    const hoverProps = isWeb ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    } : {};

    return (
        <View
            style={[
                styles.card,
                { backgroundColor: bg, borderColor: dynamicColors.border },
                hovered && styles.cardHovered,
            ]}
            {...hoverProps}
        >
            {/* Nội dung thẻ — click để xem (read-only trong trash) */}
            <TouchableOpacity
                activeOpacity={onPress ? 0.7 : 1}
                onPress={() => onPress?.(note)}
                disabled={!onPress}
            >
                <View style={styles.cardContent}>
                    {note.title ? (
                        <Text style={[styles.title, { color: dynamicColors.textPrimary }]} numberOfLines={2}>
                            {note.title}
                        </Text>
                    ) : null}

                    {!isTodo && note.content_text ? (
                        <Text style={[styles.content, { color: dynamicColors.textSecondary }]} numberOfLines={4}>
                            {stripHtml(note.content_text)}
                        </Text>
                    ) : null}

                    {isTodo && (
                        <View style={styles.todoList}>
                            {visibleItems.map((item: TodoItemData) => (
                                <View key={item.id} style={styles.todoRow}>
                                    <View style={[styles.checkbox, isDark && { borderColor: '#4B5563' }, item.is_completed && styles.checkboxDone]}>
                                        {item.is_completed && <Icon source="check" size={10} color="#fff" />}
                                    </View>
                                    <Text
                                        style={[styles.todoText, { color: dynamicColors.textSecondary }, item.is_completed && styles.todoTextDone]}
                                        numberOfLines={1}
                                    >
                                        {item.title}
                                    </Text>
                                </View>
                            ))}
                            {hiddenIncomplete > 0 && (
                                <Text style={[styles.moreItems, { color: dynamicColors.textSecondary }]}>
                                    +{hiddenIncomplete} việc nữa
                                </Text>
                            )}
                        </View>
                    )}
                </View>
            </TouchableOpacity>

            {/* Toolbar: chỉ hiện khi hover (desktop) hoặc luôn hiện (mobile) */}
            {(hovered || !isWeb) && (
                <View style={styles.toolbar}>
                    {/* Xóa vĩnh viễn */}
                    <Tooltip label="Xóa vĩnh viễn">
                        <HoverBtn
                            onPress={() => onDelete(note.id)}
                            style={styles.actionBtn}
                        >
                            <Icon source="delete-outline" size={18} color={colors.textSecondary} />
                        </HoverBtn>
                    </Tooltip>

                    {/* Khôi phục */}
                    <Tooltip label="Khôi phục">
                        <HoverBtn
                            onPress={() => onRestore(note.id)}
                            style={styles.actionBtn}
                        >
                            <Icon source="restore" size={18} color={colors.textSecondary} />
                        </HoverBtn>
                    </Tooltip>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: colors.borderDefault,
        backgroundColor: '#fff',
        overflow: 'visible',
    },
    cardHovered: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 6,
        elevation: 4,
    },
    cardContent: {
        padding: 14,
    },
    title: {
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        color: colors.textPrimary,
        marginBottom: 6,
        lineHeight: 20,
    },
    content: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 19,
    },
    todoList: {
        gap: 4,
    },
    todoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    checkbox: {
        width: 14,
        height: 14,
        borderRadius: 3,
        borderWidth: 1.5,
        borderColor: colors.textSecondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxDone: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    todoText: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        flex: 1,
    },
    todoTextDone: {
        textDecorationLine: 'line-through',
        opacity: 0.5,
    },
    moreItems: {
        fontFamily: 'Inter-Regular',
        fontSize: 12,
        marginTop: 2,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingBottom: 8,
        paddingTop: 2,
        gap: 2,
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Tooltip
    tooltip: {
        position: 'absolute',
        bottom: '100%',
        left: '50%',
        transform: [{ translateX: -30 }],
        backgroundColor: '#3C4043',
        borderRadius: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 4,
        zIndex: 9999,
        minWidth: 80,
        alignItems: 'center',
    },
    tooltipText: {
        color: '#fff',
        fontSize: 11,
        fontFamily: 'Inter-Regular',
    },
});