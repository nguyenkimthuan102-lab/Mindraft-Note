import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primarySubtle,
    secondary: colors.primaryHover,
    background: colors.bgPage,
    surface: colors.bgSurface,
    error: colors.danger,
    onSurface: colors.textPrimary,
    outline: colors.borderDefault,
  },
};