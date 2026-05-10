import { themes } from '../constants/colors';
import { useNoteStore } from '../store/useNoteStore';

export const useThemeColors = () => {
  const theme = useNoteStore((state) => state.theme);
  // Nếu bạn muốn hỗ trợ cả 'system', có thể dùng Appearance của react-native ở đây
  return theme === 'dark' ? themes.dark : themes.light;
};