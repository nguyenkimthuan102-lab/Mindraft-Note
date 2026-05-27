import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
// THÊM: Import AppStore để lấy trạng thái theme
import { useAppStore } from '../../store/useAppStore';

interface QuickCaptureProps {
  onCreateText?: () => void;
  onCreateTodo?: () => void;
}

export function QuickCapture({ onCreateText, onCreateTodo }: QuickCaptureProps) {
  // THÊM: Lấy theme và xác định bảng màu động
  const { theme } = useAppStore();
  const isDark = theme === 'dark';

  const dynamic = {
    bg: isDark ? '#1F2937' : colors.bgSurface,
    border: isDark ? '#374151' : colors.borderDefault,
    placeholder: isDark ? '#9CA3AF' : colors.textPlaceholder,
    icon: isDark ? '#6B7280' : colors.textTertiary,
  };

  return (
    <TouchableOpacity 
      // CẬP NHẬT: Thêm style mảng để áp dụng màu nền và viền động
      style={[styles.wrap, { backgroundColor: dynamic.bg, borderColor: dynamic.border }]} 
      onPress={onCreateText} 
      activeOpacity={0.8}
    >
      <TextInput
        // CẬP NHẬT: placeholderTextColor lấy theo màu động
        style={styles.input}
        placeholder="Ghi chú..."
        placeholderTextColor={dynamic.placeholder}
        editable={false}
        pointerEvents="none"
      />
      <TouchableOpacity onPress={onCreateTodo} style={styles.todoBtn} activeOpacity={0.7}>
        {/* CẬP NHẬT: Màu icon lấy theo màu động */}
        <Feather name="check-square" size={18} color={dynamic.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    paddingHorizontal: 16,
    height: 48,
    marginBottom: 24,
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.05)' } as any,
    }),
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textPlaceholder,
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  todoBtn: {
    padding: 4,
  },
});