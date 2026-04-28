import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

interface TagChipProps {
  label: string;
}

export function TagChip({ label }: TagChipProps) {
  return (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
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
  label: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: colors.textSecondary,
  },
});