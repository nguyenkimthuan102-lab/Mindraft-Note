import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useHover } from '../../hooks/useHover';
import { colors } from '../../constants/colors';

interface HoverBtnProps {
  onPress: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  fullWidth?: boolean;
  size?: number;
}

export function HoverBtn({ onPress, children, style, borderRadius = 6, fullWidth = false, size }: HoverBtnProps) {
  const { hovered, hoverProps } = useHover();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        fullWidth ? styles.btnFull : styles.btn,
        size ? { width: size, height: size } : undefined,
        { borderRadius },
        hovered && styles.btnHovered,
        style,
      ]}
      {...hoverProps}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFull: {
    width: '100%',
  },
  btnHovered: {
    backgroundColor: colors.bgHover, // #F3F4F6
  },
});