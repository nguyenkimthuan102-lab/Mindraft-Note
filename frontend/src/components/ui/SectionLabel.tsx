import { Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export function SectionLabel({ label }: { label: string }) {
  return <Text style={styles.text}>{label}</Text>;
}

const styles = StyleSheet.create({
  text: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 10,
  },
});