import { Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.text}>{label}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
});