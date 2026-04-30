import { useState } from 'react';
import { Platform } from 'react-native';

export function useHover() {
  const [hovered, setHovered] = useState(false);

  const hoverProps = Platform.OS === 'web' ? {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  } : {};

  return { hovered, hoverProps };
}