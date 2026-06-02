import { TouchableOpacity, StyleSheet, ViewStyle, StyleProp, View, Text, Platform } from 'react-native';
import { useHover } from '../../hooks/useHover';
import { colors } from '../../constants/colors';
import { useState, useCallback } from 'react';

// Khai báo interface cho sự kiện Mouse trên Web để tránh dùng any
interface WebMouseEvents {
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}

interface HoverBtnProps {
  onPress: () => void;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  borderRadius?: number;
  fullWidth?: boolean;
  size?: number;
  hoverBorder?: boolean;
  label?: string;
  isDark?: boolean;
}

export function HoverBtn({ onPress, children, style, borderRadius = 6, fullWidth = false, size, hoverBorder = false, label, isDark = false, }: HoverBtnProps) {
  const { hovered, hoverProps } = useHover();
  const [showBelow, setShowBelow] = useState(false);

  // Hàm xử lý đo lường vị trí khi hover
  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (Platform.OS === 'web') {
      // Lấy tọa độ thực tế của phần tử trên trình duyệt
      const rect = e.currentTarget.getBoundingClientRect();

      // Nếu nút nằm quá sát mép trên màn hình (< 50px), đảo nhãn xuống dưới
      setShowBelow(rect.top < 100);
    }

    // Thực hiện logic hover mặc định
    if (hoverProps.onMouseEnter) {
      (hoverProps.onMouseEnter as Function)(e);
    }
  }, [hoverProps]);

  return (
    <View
      // Chuyển sự kiện hover lên View container để TypeScript không báo lỗi
      // Ép kiểu sang WebMouseEvents để nhận diện các sự kiện Web
      {...(Platform.OS === 'web' ? {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: hoverProps.onMouseLeave
      } as WebMouseEvents : {})}
      style={styles.container}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          fullWidth ? styles.btnFull : styles.btn,
          size ? { width: size, height: size } : undefined,
          { borderRadius },
          hoverBorder && { borderWidth: 2, borderColor: 'transparent', borderStyle: 'solid' },
          hovered && (isDark ? styles.btnHoveredDark : styles.btnHovered),
          style,
          hovered && hoverBorder && (isDark ? styles.btnHoverBorderDark : styles.btnHoverBorder),
        ]}
        {...hoverProps}
      >
        {children}
      </TouchableOpacity>
      {/* Logic Tooltip tích hợp sẵn, chỉ chạy trên Web */}
      {Platform.OS === 'web' && hovered && label && (
        <View style={[
          styles.tooltip,
          showBelow ? styles.tooltipBelow : styles.tooltipAbove
        ]}>
          <Text style={styles.tooltipText}>{label}</Text>
        </View>
      )}
    </View>
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
    backgroundColor: colors.bgHover, // #F3F4F6 — light mode
  },
  btnHoveredDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.10)', // dark mode
  },
  btnHoverBorder: {
    borderColor: '#000000', // light mode
  },
  btnHoverBorderDark: {
    borderColor: 'rgba(255, 255, 255, 0.40)', // dark mode
  },
  container: {
    position: 'relative',
    alignItems: 'center',
    // Đảm bảo nút đang hover luôn nằm trên các thành phần khác của Card[cite: 3]
    zIndex: 999,
  },
  tooltip: {
    position: 'absolute',
    //bottom: '100%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 6,
    // Tránh dùng 'as any' cho transform bằng cách dùng mảng
    transform: [{ translateX: 0 }],
    zIndex: 1000,
  },
  // Vị trí mặc định: Phía trên
  tooltipAbove: {
    bottom: '100%',
    marginBottom: 8,
  },
  // Vị trí khi sát mép màn hình: Phía dưới
  tooltipBelow: {
    top: '100%',
    marginTop: 8,
  },
  tooltipText: {
    color: '#fff',
    fontSize: 12,
    // Thuộc tính chỉ có trên Web, nếu báo lỗi đỏ trong IDE hãy dùng 
    // @ts-ignore hoặc định nghĩa lại CSSProperties, nhưng không dùng 'any' bừa bãi
    //@ts-ignore
    whiteSpace: 'nowrap',
  },
});