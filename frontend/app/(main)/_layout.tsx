import { View, StyleSheet } from 'react-native';
import { Slot } from 'expo-router';
import { Sidebar } from '../../src/components/layout/Sidebar';
import { Topbar } from '../../src/components/layout/Topbar';
import { colors } from '../../src/constants/colors';

export default function MainLayout() {
  return (
    <View style={styles.root}>
      <Sidebar />
      <View style={styles.right}>
        <Topbar />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.bgPage,
  },
  right: {
    flex: 1,
    flexDirection: 'column',
  },
  content: {
    flex: 1,
  },
});