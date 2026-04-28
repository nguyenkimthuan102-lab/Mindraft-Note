import { View, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface QuickCaptureProps {
  onCreateText?: () => void;
  onCreateTodo?: () => void;
}

export function QuickCapture({ onCreateText, onCreateTodo }: QuickCaptureProps) {
  return (
    <TouchableOpacity style={styles.wrap} onPress={onCreateText} activeOpacity={0.8}>
      <TextInput
        style={styles.input}
        placeholder="Ghi chú..."
        placeholderTextColor={colors.textPlaceholder}
        editable={false}
        pointerEvents="none"
      />
      <TouchableOpacity onPress={onCreateTodo} style={styles.todoBtn} activeOpacity={0.7}>
        <Feather name="check-square" size={18} color={colors.textTertiary} />
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