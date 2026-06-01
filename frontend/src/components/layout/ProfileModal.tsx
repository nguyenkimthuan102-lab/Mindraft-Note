import {
    View, Text, StyleSheet, Modal, TouchableOpacity,
    TextInput, Image, Platform, Alert, ActivityIndicator,
    ScrollView, Pressable, KeyboardAvoidingView,
} from 'react-native';
import { useState, useRef } from 'react';
import { Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppStore } from '../../store/useAppStore';
import { logout } from '../../api/auth/authApi';
import axiosClient from '../../api/axiosClient';

// ─── Inline API helpers ───────────────────────────────────────────────────────
const apiUpdateProfile = async (data: { name?: string; avatar_url?: string | null }): Promise<{ name: string; avatar_url: string | null }> => {
    const res = await axiosClient.patch('/users/me', data);
    return res.data.data;
};

//const apiUploadAvatar = async (formData: FormData): Promise<{ avatar_url: string | null }> => {
    //const res = await axiosClient.patch('/users/me', formData, { // 👈 ĐÃ SỬA
        //headers: { 'Content-Type': 'multipart/form-data' },
    //});
    //return res.data.data;
//};

const apiChangePassword = async (data: { current_password: string; new_password: string }): Promise<void> => {
    await axiosClient.patch('/users/me/password', data); //
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface DynColors {
    bg: string; text: string; textSec: string; border: string;
    inputBg: string; placeholder: string; divider: string; itemHover: string;
}

interface ProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

// ─── ChangePasswordModal — full screen ───────────────────────────────────────
function ChangePasswordModal({ visible, onClose, isDark, dynColors }: {
    visible: boolean;
    onClose: () => void;
    isDark: boolean;
    dynColors: DynColors;
}) {
    const [currentPwd, setCurrentPwd] = useState('');
    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<{ current?: string; new?: string; confirm?: string }>({});

    const validate = () => {
        const e: typeof errors = {};
        if (!currentPwd) e.current = 'Vui lòng nhập mật khẩu hiện tại.';
        if (!newPwd) e.new = 'Vui lòng nhập mật khẩu mới.';
        else if (newPwd.length < 8) e.new = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
        if (!confirmPwd) e.confirm = 'Vui lòng xác nhận mật khẩu.';
        else if (newPwd !== confirmPwd) e.confirm = 'Mật khẩu xác nhận không khớp.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            await apiChangePassword({ current_password: currentPwd, new_password: newPwd });
            Alert.alert('Thành công', 'Mật khẩu đã được thay đổi thành công.');
            handleClose();
        } catch (e: any) {
            const msg = e?.response?.data?.message ?? 'Không thể đổi mật khẩu. Vui lòng thử lại.';
            Alert.alert('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
        setErrors({}); setShowCurrent(false); setShowNew(false); setShowConfirm(false);
        onClose();
    };

    const inputBg = isDark ? '#111827' : '#F9FAFB';
    const labelColor = isDark ? '#D1D5DB' : colors.textSecondary;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
            {/* Backdrop */}
            <Pressable style={cpStyles.backdrop} onPress={handleClose} />

            {/* Centered card */}
            <KeyboardAvoidingView style={cpStyles.center} behavior={Platform.OS === 'ios' ? 'padding' : undefined} pointerEvents="box-none">
                <View style={[cpStyles.card, { backgroundColor: dynColors.bg, borderColor: dynColors.border }]}>

                    {/* Header */}
                    <View style={cpStyles.header}>
                        <View style={cpStyles.headerIcon}>
                            <Icon source="lock-reset" size={22} color={colors.primary} />
                        </View>
                        <Text style={[cpStyles.title, { color: dynColors.text }]}>Đổi mật khẩu</Text>
                        <TouchableOpacity onPress={handleClose} style={cpStyles.closeBtn}>
                            <Icon source="close" size={20} color={dynColors.textSec} />
                        </TouchableOpacity>
                    </View>

                    <View style={cpStyles.body}>
                        {/* Current password */}
                        <View style={cpStyles.fieldGroup}>
                            <Text style={[cpStyles.label, { color: labelColor }]}>Mật khẩu hiện tại</Text>
                            <View style={[
                                cpStyles.inputRow,
                                { backgroundColor: inputBg, borderColor: errors.current ? colors.danger : dynColors.border }
                            ]}>
                                <TextInput
                                    style={[cpStyles.input, { color: dynColors.text }]}
                                    value={currentPwd}
                                    onChangeText={v => { setCurrentPwd(v); setErrors(p => ({ ...p, current: undefined })); }}
                                    secureTextEntry={!showCurrent}
                                    placeholder="Nhập mật khẩu hiện tại"
                                    placeholderTextColor={dynColors.placeholder}
                                    autoComplete="current-password"
                                />
                                <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={cpStyles.eyeBtn}>
                                    <Icon source={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={dynColors.textSec} />
                                </TouchableOpacity>
                            </View>
                            {errors.current && <Text style={cpStyles.errText}>{errors.current}</Text>}
                        </View>

                        {/* New password */}
                        <View style={cpStyles.fieldGroup}>
                            <Text style={[cpStyles.label, { color: labelColor }]}>Mật khẩu mới</Text>
                            <View style={[
                                cpStyles.inputRow,
                                { backgroundColor: inputBg, borderColor: errors.new ? colors.danger : dynColors.border }
                            ]}>
                                <TextInput
                                    style={[cpStyles.input, { color: dynColors.text }]}
                                    value={newPwd}
                                    onChangeText={v => { setNewPwd(v); setErrors(p => ({ ...p, new: undefined })); }}
                                    secureTextEntry={!showNew}
                                    placeholder="Ít nhất 8 ký tự"
                                    placeholderTextColor={dynColors.placeholder}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity onPress={() => setShowNew(v => !v)} style={cpStyles.eyeBtn}>
                                    <Icon source={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={dynColors.textSec} />
                                </TouchableOpacity>
                            </View>
                            {errors.new && <Text style={cpStyles.errText}>{errors.new}</Text>}
                        </View>

                        {/* Confirm password */}
                        <View style={cpStyles.fieldGroup}>
                            <Text style={[cpStyles.label, { color: labelColor }]}>Xác nhận mật khẩu mới</Text>
                            <View style={[
                                cpStyles.inputRow,
                                { backgroundColor: inputBg, borderColor: errors.confirm ? colors.danger : dynColors.border }
                            ]}>
                                <TextInput
                                    style={[cpStyles.input, { color: dynColors.text }]}
                                    value={confirmPwd}
                                    onChangeText={v => { setConfirmPwd(v); setErrors(p => ({ ...p, confirm: undefined })); }}
                                    secureTextEntry={!showConfirm}
                                    placeholder="Nhập lại mật khẩu mới"
                                    placeholderTextColor={dynColors.placeholder}
                                    autoComplete="new-password"
                                />
                                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={cpStyles.eyeBtn}>
                                    <Icon source={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={dynColors.textSec} />
                                </TouchableOpacity>
                            </View>
                            {errors.confirm && <Text style={cpStyles.errText}>{errors.confirm}</Text>}
                        </View>

                        {/* Actions */}
                        <View style={cpStyles.actions}>
                            <TouchableOpacity
                                style={[cpStyles.cancelBtn, { borderColor: dynColors.border, backgroundColor: dynColors.inputBg }]}
                                onPress={handleClose}
                                activeOpacity={0.7}
                            >
                                <Text style={[cpStyles.cancelText, { color: dynColors.textSec }]}>Hủy</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[cpStyles.submitBtn, loading && { opacity: 0.65 }]}
                                onPress={handleSubmit}
                                disabled={loading}
                                activeOpacity={0.8}
                            >
                                {loading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Text style={cpStyles.submitText}>Xác nhận</Text>
                                }
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── ActionItem row ───────────────────────────────────────────────────────────
function ActionItem({ icon, label, onPress, chevron, dynColors }: {
    icon: string; label: string; onPress: () => void;
    chevron?: boolean; dynColors: DynColors;
}) {
    const [hovered, setHovered] = useState(false);
    const isWeb = Platform.OS === 'web';
    const hoverProps = isWeb ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
    } as any : {};

    return (
        <TouchableOpacity
            style={[styles.actionItem, hovered && { backgroundColor: dynColors.itemHover }]}
            onPress={onPress}
            activeOpacity={0.7}
            {...hoverProps}
        >
            <View style={[styles.actionIconWrap, { backgroundColor: dynColors.inputBg }]}>
                <Icon source={icon} size={17} color={dynColors.text} />
            </View>
            <Text style={[styles.actionLabel, { color: dynColors.text }]}>{label}</Text>
            {chevron && <Icon source="chevron-right" size={18} color={dynColors.textSec} />}
        </TouchableOpacity>
    );
}

// ─── Main ProfileModal ────────────────────────────────────────────────────────
export function ProfileModal({ visible, onClose }: ProfileModalProps) {
    const router = useRouter();
    const { user, setUser, logout: storeLogout } = useAuthStore();
    const { theme } = useAppStore();
    const isDark = theme === 'dark';

    const [changePwdVisible, setChangePwdVisible] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    // Tên
    const [editingName, setEditingName] = useState(false);
    const [nameValue, setNameValue] = useState(user?.name ?? '');
    const [savingName, setSavingName] = useState(false);

    // Avatar
    const fileInputRef = useRef<any>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const dynColors: DynColors = {
        bg: isDark ? '#1F2937' : '#FFFFFF',
        text: isDark ? '#F9FAFB' : colors.textPrimary,
        textSec: isDark ? '#9CA3AF' : colors.textSecondary,
        border: isDark ? '#374151' : colors.borderDefault,
        inputBg: isDark ? '#111827' : colors.gray50,
        placeholder: isDark ? '#6B7280' : colors.textPlaceholder,
        divider: isDark ? '#374151' : '#F3F4F6',
        itemHover: isDark ? '#374151' : colors.bgHover,
    };

    const initials = (user?.name ?? 'U')
        .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

    // ── Lưu tên ──────────────────────────────────────────────────────────────
    const handleSaveName = async () => {
        const trimmed = nameValue.trim();
        if (!trimmed) {
            setNameValue(user?.name ?? '');
            setEditingName(false);
            return;
        }
        if (trimmed === user?.name) {
            setEditingName(false);
            return;
        }
        setSavingName(true);
        try {
            const updated = await apiUpdateProfile({ name: trimmed });
            setUser({ ...user!, name: updated.name });
            setEditingName(false);
        } catch {
            Alert.alert('Lỗi', 'Không thể cập nhật tên. Vui lòng thử lại.');
            setNameValue(user?.name ?? '');
            setEditingName(false);
        } finally {
            setSavingName(false);
        }
    };

    const handleCancelName = () => {
        setNameValue(user?.name ?? '');
        setEditingName(false);
    };

    // ── Avatar ────────────────────────────────────────────────────────────────
    const handleAvatarPress = () => {
        if (Platform.OS === 'web') {
            fileInputRef.current?.click();
        } else {
            Alert.alert('Thay đổi ảnh đại diện', 'Tính năng đang phát triển.');
        }
    };

    // Xử lý ảnh đại diện
    const handleFileChange = async (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        e.target.value = '';
        setUploadingAvatar(true);

        try {
        // Bước 1: Gọi API lên Backend xin vé Presigned URL
        const presignRes = await axiosClient.post('/media/presigned-url', {
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            purpose: 'avatar'
        });

        const { upload_url, file_url } = presignRes.data.data;

        // Bước 2: Dùng lệnh PUT đẩy file binary thẳng lên link chứa ảnh (AWS S3 hoặc Cổng Fake Local của Backend)
        await fetch(upload_url, {
            method: 'PUT',
            body: file,
            headers: { 'Content-Type': file.type }
        });

        // Bước 3: Đẩy cái chuỗi URL ảnh tương lai vào hàm PATCH profile để Backend lưu chặt link text vào DB
        const updated = await apiUpdateProfile({ avatar_url: file_url });
        // Bẻ gãy Cache trình duyệt bằng cách gắn thêm Timestamp vào sau đuôi ảnh
        const antiCacheUrl = `${updated.avatar_url}?t=${new Date().getTime()}`;
        
        // Nạp thẳng dữ liệu mới này vào hàm setUser có sẵn của Store để ép cả con app cập nhật RAM
        setUser({
            ...user!,
            avatar_url: antiCacheUrl
        });
        Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện thành công.');
        } catch (err) {
        console.error('Lỗi luồng up avatar:', err);
        Alert.alert('Lỗi', 'Không thể tải ảnh lên. Vui lòng thử lại.');
        } finally {
        setUploadingAvatar(false);
        }
    };
    // ── Đăng xuất ─────────────────────────────────────────────────────────────
    const handleLogout = async () => {
        setLoggingOut(true);
        try { 
            // Thêm dòng này để gọi API Backend xóa cookie/token dưới DB
            await axiosClient.post('/auth/logout/'); 
        } catch { /* ignore */ }
        await storeLogout();
        onClose();
        router.replace('/(auth)/login');
    };

    // ── Reset khi đóng ────────────────────────────────────────────────────────
    const handleClose = () => {
        setEditingName(false);
        setNameValue(user?.name ?? '');
        onClose();
    };

    const mainActions = [
        {
            icon: 'account-switch-outline', label: 'Chuyển đổi tài khoản',
            onPress: () => Alert.alert('Chuyển đổi tài khoản', 'Tính năng đang phát triển.')
        },
        {
            icon: 'account-cog-outline', label: 'Quản lí tài khoản',
            onPress: () => Alert.alert('Quản lí tài khoản', 'Tính năng đang phát triển.')
        },
        {
            icon: 'help-circle-outline', label: 'Trợ giúp',
            onPress: () => Alert.alert('Trợ giúp', 'Tính năng đang phát triển.')
        },
        {
            icon: 'lock-reset', label: 'Đổi mật khẩu',
            onPress: () => setChangePwdVisible(true), chevron: true
        },
    ];

    return (
        <>
            <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
                {/* Backdrop */}
                <Pressable style={styles.backdrop} onPress={handleClose} />

                {/* Panel */}
                <View style={[styles.panel, {
                    backgroundColor: dynColors.bg,
                    borderColor: dynColors.border,
                    shadowColor: isDark ? '#000' : '#374151',
                }]}>
                    <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

                        {/* ── Account section ────────────────────────────── */}
                        <View style={styles.accountSection}>

                            {/* Avatar — dùng label+input để trigger file picker đáng tin cậy trên web */}
                            {Platform.OS === 'web' ? (
                                <label htmlFor="profile-avatar-input" style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', marginBottom: 14 } as any}>
                                    {user?.avatar_url ? (
                                        <Image source={{ uri: user.avatar_url }} style={styles.avatarLarge} />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarInitials}>{initials}</Text>
                                        </View>
                                    )}
                                    <View style={[styles.cameraBadge, { backgroundColor: dynColors.bg, borderColor: dynColors.border }]}>
                                        {uploadingAvatar
                                            ? <ActivityIndicator size="small" color={colors.primary} />
                                            : <Icon source="camera-outline" size={14} color={colors.primary} />
                                        }
                                    </View>
                                    <input
                                        id="profile-avatar-input"
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        style={{ position: 'absolute', width: 0, height: 0, opacity: 0, overflow: 'hidden' }}
                                        onChange={handleFileChange}
                                    />
                                </label>
                            ) : (
                                <TouchableOpacity style={[styles.avatarWrapper, { marginBottom: 14 }]} onPress={handleAvatarPress} activeOpacity={0.85}>
                                    {user?.avatar_url ? (
                                        <Image source={{ uri: user.avatar_url }} style={styles.avatarLarge} />
                                    ) : (
                                        <View style={styles.avatarFallback}>
                                            <Text style={styles.avatarInitials}>{initials}</Text>
                                        </View>
                                    )}
                                    <View style={[styles.cameraBadge, { backgroundColor: dynColors.bg, borderColor: dynColors.border }]}>
                                        {uploadingAvatar
                                            ? <ActivityIndicator size="small" color={colors.primary} />
                                            : <Icon source="camera-outline" size={14} color={colors.primary} />
                                        }
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Tên — inline edit */}
                            {editingName ? (
                                <View style={[styles.nameInputWrap, { borderColor: colors.primary, backgroundColor: dynColors.inputBg }]}>
                                    <TextInput
                                        style={[styles.nameInput, { color: dynColors.text }]}
                                        value={nameValue}
                                        onChangeText={setNameValue}
                                        autoFocus
                                        onSubmitEditing={handleSaveName}
                                        returnKeyType="done"
                                        maxLength={60}
                                        placeholderTextColor={dynColors.placeholder}
                                        selectTextOnFocus
                                    />
                                    <TouchableOpacity onPress={handleCancelName} style={styles.nameActionBtn}>
                                        <Icon source="close" size={16} color={dynColors.textSec} />
                                    </TouchableOpacity>
                                    {savingName
                                        ? <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 4 }} />
                                        : (
                                            <TouchableOpacity onPress={handleSaveName} style={styles.nameActionBtn}>
                                                <Icon source="check" size={16} color={colors.primary} />
                                            </TouchableOpacity>
                                        )
                                    }
                                </View>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.nameDisplay, Platform.OS === 'web' && { cursor: 'pointer' } as any]}
                                    onPress={() => { setNameValue(user?.name ?? ''); setEditingName(true); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.displayName, { color: dynColors.text }]} numberOfLines={1}>
                                        {user?.name ?? 'User'}
                                    </Text>
                                    <View style={styles.editPencil}>
                                        <Icon source="pencil-outline" size={15} color={dynColors.textSec} />
                                    </View>
                                </TouchableOpacity>
                            )}

                            {/* Email */}
                            <Text style={[styles.emailText, { color: dynColors.textSec }]} numberOfLines={1}>
                                {user?.email ?? ''}
                            </Text>
                        </View>

                        <View style={[styles.divider, { backgroundColor: dynColors.divider }]} />

                        {/* ── Actions ─────────────────────────────────────── */}
                        <View style={styles.actionsSection}>
                            {mainActions.map(item => (
                                <ActionItem
                                    key={item.label}
                                    icon={item.icon}
                                    label={item.label}
                                    chevron={item.chevron}
                                    onPress={item.onPress}
                                    dynColors={dynColors}
                                />
                            ))}
                        </View>

                        <View style={[styles.divider, { backgroundColor: dynColors.divider }]} />

                        {/* ── Đăng xuất ───────────────────────────────────── */}
                        <View style={styles.logoutSection}>
                            <TouchableOpacity
                                style={[styles.logoutBtn, loggingOut && { opacity: 0.6 }]}
                                onPress={handleLogout}
                                disabled={loggingOut}
                                activeOpacity={0.8}
                            >
                                {loggingOut
                                    ? <ActivityIndicator size="small" color={colors.danger} />
                                    : <Icon source="logout" size={18} color={colors.danger} />
                                }
                                <Text style={styles.logoutText}>Đăng xuất</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            {/* ── Change Password Modal riêng (full screen) ────────────────── */}
            <ChangePasswordModal
                visible={changePwdVisible}
                onClose={() => setChangePwdVisible(false)}
                isDark={isDark}
                dynColors={dynColors}
            />
        </>
    );
}

// ─── Styles — Profile panel ───────────────────────────────────────────────────
const styles = StyleSheet.create({
    backdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1,
    },
    panel: {
        position: 'absolute',
        top: 72,
        right: 16,
        width: 300,
        maxHeight: 520,
        borderRadius: 16,
        borderWidth: 1,
        overflow: 'hidden',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 24,
        elevation: 16,
        zIndex: 2,
    },
    accountSection: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 14,
    },
    avatarLarge: {
        width: 72, height: 72, borderRadius: 36,
    },
    avatarFallback: {
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: colors.primary,
        alignItems: 'center', justifyContent: 'center',
    },
    avatarInitials: {
        fontFamily: 'Inter-SemiBold', fontSize: 26, color: '#fff', letterSpacing: 1,
    },
    cameraBadge: {
        position: 'absolute', bottom: 0, right: 0,
        width: 26, height: 26, borderRadius: 13,
        borderWidth: 2, alignItems: 'center', justifyContent: 'center',
    },
    nameDisplay: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        paddingHorizontal: 10, paddingVertical: 5,
        borderRadius: 8, marginBottom: 4,
    },
    displayName: {
        fontFamily: 'Inter-SemiBold', fontSize: 17, maxWidth: 200,
    },
    editPencil: { opacity: 0.55 },
    nameInputWrap: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderRadius: 8,
        paddingHorizontal: 10, paddingVertical: 5,
        width: '100%', marginBottom: 4,
        gap: 2,
    },
    nameInput: {
        flex: 1, fontFamily: 'Inter-Medium', fontSize: 15,
        ...Platform.select({ web: { outlineStyle: 'none' } as any }),
    },
    nameActionBtn: {
        padding: 4, borderRadius: 6,
    },
    emailText: {
        fontFamily: 'Inter-Regular', fontSize: 13, maxWidth: 240,
    },
    divider: { height: 1 },
    actionsSection: { paddingVertical: 6 },
    actionItem: {
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 11, gap: 12,
    },
    actionIconWrap: {
        width: 32, height: 32, borderRadius: 8,
        alignItems: 'center', justifyContent: 'center',
    },
    actionLabel: {
        flex: 1, fontFamily: 'Inter-Regular', fontSize: 14,
    },
    logoutSection: { paddingHorizontal: 16, paddingVertical: 12 },
    logoutBtn: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 10, borderWidth: 1,
        borderColor: `${colors.danger}33`,
        backgroundColor: `${colors.danger}0A`,
    },
    logoutText: {
        fontFamily: 'Inter-Medium', fontSize: 14, color: colors.danger,
    },
});

// ─── Styles — Change Password Modal ──────────────────────────────────────────
const cpStyles = StyleSheet.create({
    backdrop: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    center: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: 16,
    },
    card: {
        width: '100%',
        maxWidth: 440,
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 16,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'transparent',
    },
    headerIcon: {
        width: 38, height: 38, borderRadius: 10,
        backgroundColor: colors.primarySubtle,
        alignItems: 'center', justifyContent: 'center',
    },
    title: {
        flex: 1, fontFamily: 'Inter-SemiBold', fontSize: 17,
    },
    closeBtn: {
        padding: 4, borderRadius: 8,
    },
    body: {
        padding: 24, gap: 16,
    },
    fieldGroup: { gap: 6 },
    label: {
        fontFamily: 'Inter-Medium', fontSize: 13,
    },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        borderWidth: 1.5, borderRadius: 10,
        paddingHorizontal: 14, paddingVertical: 11,
    },
    input: {
        flex: 1, fontFamily: 'Inter-Regular', fontSize: 15,
        ...Platform.select({ web: { outlineStyle: 'none' } as any }),
    },
    eyeBtn: { padding: 2, marginLeft: 8 },
    errText: {
        fontFamily: 'Inter-Regular', fontSize: 12,
        color: colors.danger, marginTop: 2,
    },
    actions: {
        flexDirection: 'row', gap: 10, marginTop: 4,
    },
    cancelBtn: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 10, borderWidth: 1,
    },
    cancelText: { fontFamily: 'Inter-Medium', fontSize: 14 },
    submitBtn: {
        flex: 2, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 10,
        backgroundColor: colors.primary,
    },
    submitText: { fontFamily: 'Inter-SemiBold', fontSize: 14, color: '#fff' },
});