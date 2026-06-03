import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface TagChipProps {
  label: string;
  isDark?: boolean;
}

export function TagChip({ label, isDark = false }: TagChipProps) {
  return (
    <View style={[styles.chip, isDark && styles.chipDark]}>
      <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.gray100,
    borderWidth: 0.5,
    borderColor: colors.borderDefault,
  },
  chipDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
  labelDark: {
    color: '#D1D5DB',
  },
});