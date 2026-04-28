import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

const LABELS = ['Personal', 'Work', 'Ideas'];

interface NavItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  href: string;
  active: boolean;
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={[styles.navItem, active && styles.navItemActive]}
      onPress={() => router.push(href as any)}
      activeOpacity={0.7}
    >
      <Feather
        name={icon}
        size={18}
        color={active ? colors.primary : colors.textSecondary}
      />
      <Text style={[styles.navLabel, active && styles.navLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logo}>
        <View style={styles.logoIcon}>
          <Feather name="file-text" size={16} color="#fff" />
        </View>
        <Text style={styles.logoText}>Mindraft</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* New note */}
        <TouchableOpacity style={styles.newNote} activeOpacity={0.8}>
          <Feather name="plus" size={18} color={colors.textPrimary} />
          <Text style={styles.newNoteText}>New note</Text>
        </TouchableOpacity>

        {/* Main nav */}
        <NavItem icon="file-text" label="All notes" href="/(main)" active={pathname === '/'} />
        <NavItem icon="bell" label="Reminders" href="/(main)/reminders" active={pathname === '/reminders'} />

        {/* Labels */}
        <Text style={styles.sectionLabel}>LABELS</Text>
        {LABELS.map((label) => (
          <TouchableOpacity key={label} style={styles.navItem} activeOpacity={0.7}>
            <Feather name="tag" size={16} color={colors.textSecondary} />
            <Text style={styles.navLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity style={styles.editLabels}>
          <Text style={styles.editLabelsText}>Edit labels</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Bottom nav */}
        <NavItem icon="archive" label="Archive" href="/(main)/archive" active={pathname === '/archive'} />
        <NavItem icon="trash-2" label="Trash" href="/(main)/trash" active={pathname === '/trash'} />
        <NavItem icon="settings" label="Settings" href="/(main)/settings" active={pathname === '/settings'} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: colors.bgSurface,
    borderRightWidth: 1,
    borderRightColor: colors.borderDefault,
    paddingTop: Platform.OS === 'web' ? 0 : 44,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 12,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 17,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  newNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  newNoteText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  navItemActive: {
    backgroundColor: colors.primarySubtle,
  },
  navLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    color: colors.textSecondary,
  },
  navLabelActive: {
    fontFamily: 'Inter-Medium',
    color: colors.primary,
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 0.7,
    marginTop: 16,
    marginBottom: 6,
    marginLeft: 10,
  },
  editLabels: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  editLabelsText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    color: colors.textTertiary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDefault,
    marginVertical: 12,
  },
});