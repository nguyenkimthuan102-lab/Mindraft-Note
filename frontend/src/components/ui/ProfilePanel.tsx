import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { logout as logoutApi } from '../../api/auth/authApi';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';

interface ProfilePanelProps {
    visible: boolean;
    onClose: () => void;
    anchorPosition?: { top: number; right: number };
}

export function ProfilePanel({ visible, onClose, anchorPosition }: ProfilePanelProps) {
    const { user, logout: logoutStore, setUser } = useAuthStore();
    const { theme } = useAppStore();
    const router = useRouter();

    const [isEditingName, setIsEditingName] = useState(false);
    const [displayName, setDisplayName] = useState(user?.name ?? 'User Name');
    const [nameInput, setNameInput] = useState(user?.name ?? 'User Name');
    const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatar_url ?? null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSavingName, setIsSavingName] = useState(false);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const isDark = theme === 'dark';

    const dc = {
        bg: isDark ? '#1F2937' : colors.bgSurface,
        border: isDark ? '#374151' : colors.borderDefault,
        text: isDark ? '#F9FAFB' : colors.textPrimary,
        textSec: isDark ? '#9CA3AF' : colors.textSecondary,
        textTert: isDark ? '#6B7280' : colors.textTertiary,
        inputBg: isDark ? '#111827' : colors.gray100,
        rowHover: isDark ? '#374151' : colors.bgHover,
    };

    // ── Avatar picker (web: hidden <input type="file">) ────────────────────────
    const handlePickAvatar = () => {
        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
        }
        // TODO: add native image picker (expo-image-picker) for iOS/Android
    };

    const handleFileChange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAvatarUri(url);
        // TODO: upload file to server & call setUser with new avatar_url
    };

    // ── Save display name ──────────────────────────────────────────────────────
    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed || trimmed === displayName) {
            setIsEditingName(false);
            setNameInput(displayName);
            return;
        }
        setIsSavingName(true);
        try {
            // TODO: call API to update name
            setDisplayName(trimmed);
            if (user) setUser({ ...user, name: trimmed });
        } finally {
            setIsSavingName(false);
            setIsEditingName(false);
        }
    };

    // ── Logout ─────────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await logoutApi();
        } catch {
            // ignore – still clear local state
        } finally {
            logoutStore();
            onClose();
            router.replace('/(auth)/login');
        }
    };

    // ── Change password ────────────────────────────────────────────────────────
    const handleChangePassword = () => {
        onClose();
        router.push('/(auth)/forgot-password');
    };

    const initials = (displayName || 'U')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    if (!visible) return null;

    const panelTop = anchorPosition?.top ?? 70;
    const panelRight = anchorPosition?.right ?? 16;

    return (
        <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
            {/* Backdrop */}
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

            {/* Hidden file input for web avatar upload */}
            {Platform.OS === 'web' && (
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                />
            )}

            {/* Panel */}
            <View
                style={[
                    styles.panel,
                    {
                        top: panelTop,
                        right: panelRight,
                        backgroundColor: dc.bg,
                        borderColor: dc.border,
                        ...Platform.select({
                            web: {
                                boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
                            } as any,
                        }),
                    },
                ]}
            >
                {/* ── HEADER: Avatar + Name + Email ─────────────────────────── */}
                <View style={[styles.header, { borderBottomColor: dc.border }]}>
                    {/* Avatar */}
                    <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrap} activeOpacity={0.85}>
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                                <Text style={styles.avatarInitials}>{initials}</Text>
                            </View>
                        )}
                        <View style={styles.avatarEditBadge}>
                            <Feather name="camera" size={11} color="#fff" />
                        </View>
                    </TouchableOpacity>

                    {/* Name + Email */}
                    <View style={styles.identity}>
                        {/* Display Name */}
                        {isEditingName ? (
                            <View style={styles.nameEditRow}>
                                <TextInput
                                    value={nameInput}
                                    onChangeText={setNameInput}
                                    autoFocus
                                    style={[
                                        styles.nameInput,
                                        {
                                            backgroundColor: dc.inputBg,
                                            color: dc.text,
                                            borderColor: colors.borderFocus,
                                        },
                                    ]}
                                    onSubmitEditing={handleSaveName}
                                    returnKeyType="done"
                                    selectTextOnFocus
                                    {...Platform.select({ web: { outlineStyle: 'none' } as any })}
                                />
                                <TouchableOpacity onPress={handleSaveName} style={styles.saveBtn} disabled={isSavingName}>
                                    {isSavingName ? (
                                        <ActivityIndicator size="small" color={colors.primary} />
                                    ) : (
                                        <Feather name="check" size={16} color={colors.primary} />
                                    )}
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => { setNameInput(displayName); setIsEditingName(true); }}
                                style={styles.nameRow}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.displayName, { color: dc.text }]} numberOfLines={1}>
                                    {displayName}
                                </Text>
                                <Feather name="edit-2" size={13} color={dc.textTert} style={styles.editIcon} />
                            </TouchableOpacity>
                        )}

                        {/* Email */}
                        <Text style={[styles.email, { color: dc.textSec }]} numberOfLines={1}>
                            {user?.email ?? 'user@gmail.com'}
                        </Text>
                    </View>
                </View>

                {/* ── ACTIONS ───────────────────────────────────────────────── */}
                <View style={styles.actions}>
                    <ActionRow
                        icon="lock"
                        label="Đổi mật khẩu"
                        onPress={handleChangePassword}
                        textColor={dc.text}
                        rowHoverColor={dc.rowHover}
                    />
                </View>

                {/* ── SIGN OUT ──────────────────────────────────────────────── */}
                <View style={[styles.signOutSection, { borderTopColor: dc.border }]}>
                    <TouchableOpacity
                        style={[styles.signOutBtn, { borderColor: colors.danger + '55' }]}
                        onPress={handleLogout}
                        disabled={isLoggingOut}
                        activeOpacity={0.8}
                    >
                        {isLoggingOut ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                            <Feather name="log-out" size={16} color={colors.danger} />
                        )}
                        <Text style={[styles.signOutText, { opacity: isLoggingOut ? 0.5 : 1 }]}>
                            {isLoggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

// ── Sub-component: one action row ─────────────────────────────────────────────
function ActionRow({
    icon,
    label,
    onPress,
    textColor,
    rowHoverColor,
}: {
    icon: string;
    label: string;
    onPress: () => void;
    textColor: string;
    rowHoverColor: string;
}) {
    const [hovered, setHovered] = useState(false);

    return (
        <TouchableOpacity
            style={[styles.actionRow, hovered && { backgroundColor: rowHoverColor }]}
            onPress={onPress}
            activeOpacity={0.7}
            // @ts-ignore – web only hover events
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <Feather name={icon as any} size={16} color={textColor} style={styles.actionIcon} />
            <Text style={[styles.actionLabel, { color: textColor }]}>{label}</Text>
            <Feather name="chevron-right" size={15} color={textColor} style={{ opacity: 0.4 }} />
        </TouchableOpacity>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    panel: {
        position: 'absolute',
        width: 300,
        borderRadius: 14,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        elevation: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 18,
        paddingVertical: 18,
        borderBottomWidth: 1,
    },
    avatarWrap: { position: 'relative' },
    avatarImg: { width: 62, height: 62, borderRadius: 31 },
    avatarPlaceholder: {
        width: 62,
        height: 62,
        borderRadius: 31,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInitials: {
        fontFamily: 'Inter-Bold',
        fontSize: 22,
        color: '#fff',
        letterSpacing: 1,
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    identity: { flex: 1, gap: 4, minWidth: 0 },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        minWidth: 0,
    },
    displayName: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 15,
        flexShrink: 1,
    },
    editIcon: { flexShrink: 0 },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    nameInput: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
        borderWidth: 1.5,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        height: 34,
    },
    saveBtn: {
        width: 30,
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
    email: {
        fontFamily: 'Inter-Regular',
        fontSize: 13,
        flexShrink: 1,
    },
    actions: { paddingVertical: 6 },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
    },
    actionIcon: { marginRight: 12 },
    actionLabel: {
        flex: 1,
        fontFamily: 'Inter-Medium',
        fontSize: 14,
    },
    signOutSection: {
        borderTopWidth: 1,
        padding: 14,
    },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    signOutText: {
        fontFamily: 'Inter-SemiBold',
        fontSize: 14,
        color: colors.danger,
    },
});