import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  TouchableWithoutFeedback,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { useAppStore } from '../../store/useAppStore';

interface FloatingActionButtonProps {
  onCreateText: () => void;
  onCreateTodo: () => void;
}

export function FloatingActionButton({ onCreateText, onCreateTodo }: FloatingActionButtonProps) {
  const { theme } = useAppStore();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  // Dynamic theme colors
  const dynamic = {
    bg: isDark ? '#1F2937' : '#FFFFFF',
    border: isDark ? '#374151' : '#E5E7EB',
    text: isDark ? '#F9FAFB' : '#374151',
    backdrop: isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.4)',
  };

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const closeMenu = () => {
    if (!isOpen) return;
    setIsOpen(false);
    Animated.timing(animation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAction = (callback: () => void) => {
    closeMenu();
    callback();
  };

  if (!isMobile) return null;

  const fabBottom = 24 + insets.bottom;

  // Animations
  const rotateFAB = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '135deg'],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const item1TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });

  const item2TranslateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.rootContainer,
        isOpen
          ? StyleSheet.absoluteFillObject
          : { bottom: fabBottom, right: 24, width: 56, height: 56 },
      ]}
    >
      {/* Backdrop */}
      {isOpen && (
        <TouchableWithoutFeedback onPress={closeMenu}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: dynamic.backdrop,
                opacity: backdropOpacity,
              },
            ]}
          />
        </TouchableWithoutFeedback>
      )}

      {/* Floating Menu Items */}
      {isOpen && (
        <View pointerEvents="box-none" style={[styles.menuContainer, { bottom: fabBottom + 68 }]}>
          {/* Item 2: Note văn bản */}
          <Animated.View
            style={[
              styles.itemRow,
              {
                opacity: animation,
                transform: [{ translateY: item2TranslateY }],
              },
            ]}
          >
            <View style={[styles.labelContainer, { backgroundColor: dynamic.bg, borderColor: dynamic.border }]}>
              <Text style={[styles.labelText, { color: dynamic.text }]}>Note văn bản</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAction(onCreateText)}
              style={[styles.smallFab, { backgroundColor: dynamic.bg, borderColor: dynamic.border }]}
            >
              <Feather name="file-text" size={18} color={dynamic.text} />
            </TouchableOpacity>
          </Animated.View>

          {/* Item 1: Note To-do */}
          <Animated.View
            style={[
              styles.itemRow,
              {
                opacity: animation,
                transform: [{ translateY: item1TranslateY }],
              },
            ]}
          >
            <View style={[styles.labelContainer, { backgroundColor: dynamic.bg, borderColor: dynamic.border }]}>
              <Text style={[styles.labelText, { color: dynamic.text }]}>Note To-do</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAction(onCreateTodo)}
              style={[styles.smallFab, { backgroundColor: dynamic.bg, borderColor: dynamic.border }]}
            >
              <Feather name="check-square" size={18} color={dynamic.text} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Main FAB */}
      <Animated.View
        style={[
          styles.mainFabContainer,
          !isOpen && { position: 'absolute', bottom: 0, right: 0 },
          isOpen && { position: 'absolute', bottom: fabBottom, right: 24 },
          { transform: [{ rotate: rotateFAB }] },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={toggleMenu}
          style={styles.mainFab}
        >
          <Feather name="plus" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    position: 'absolute',
    zIndex: 999,
  },
  menuContainer: {
    position: 'absolute',
    right: 24,
    alignItems: 'flex-end',
    gap: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  labelContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      } as any,
    }),
  },
  labelText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
  },
  smallFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
      } as any,
    }),
  },
  mainFabContainer: {
    width: 56,
    height: 56,
    zIndex: 1000,
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 10px rgba(45, 122, 79, 0.4)',
      } as any,
    }),
  },
});
