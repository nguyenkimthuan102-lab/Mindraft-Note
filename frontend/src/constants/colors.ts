// constants/colors.ts
export const colors = {
  // Primary
  primary:         '#2D7A4F',
  primaryHover:    '#246339',
  primaryActive:   '#1E5230',
  primarySubtle:   '#E2F3E8',
  primaryGhost:    'rgba(45, 122, 79, 0.1)',

  // Danger
  danger:          '#E85C3F',
  dangerHover:     '#D14A2E',
  dangerSubtle:    '#FEF2F2',

  // Neutral
  gray50:          '#F9FAFB',
  gray100:         '#F3F4F6',
  gray200:         '#E5E7EB',
  gray300:         '#D1D5DB',
  gray400:         '#9CA3AF',
  gray500:         '#6B7280',
  gray600:         '#4B5563',
  gray700:         '#374151',
  gray900:         '#1A1A1A',

  // Semantic text
  textPrimary:     '#1A1A1A',
  textSecondary:   '#374151',
  textTertiary:    '#666666',
  textPlaceholder: '#9CA3AF',
  textDisabled:    '#D1D5DB',
  textInverse:     '#FFFFFF',
  textBrand:       '#2D7A4F',
  textDanger:      '#E85C3F',

  // Background
  bgPage:          '#F9FAFB',
  bgSurface:       '#FFFFFF',
  bgHover:         '#F3F4F6',
  bgActive:        'rgba(45, 122, 79, 0.08)',

  // Border
  borderDefault:   '#E5E7EB',
  borderFocus:     '#2D7A4F',
  borderSelected:  '#2D7A4F',

  // Note card backgrounds
  cardDefault:     '#FFFFFF',
  cardRed:         '#FADADD',
  cardOrange:      '#FEEFC3',
  cardYellow:      '#FEF7CD',
  cardGreen:       '#E2F3E8',
  cardTeal:        '#D0F4EE',
  cardBlue:        '#D3E3FD',
  cardPurple:      '#E8DEFC',
  cardPink:        '#FDCFE8',
  cardBrown:       '#F0E6DA',

  // Checkbox
  checkboxUnchecked: '#BBBBB5',
  checkboxChecked:   '#2D7A4F',

  // Overlay
  overlayLight:    'rgba(0, 0, 0, 0.25)',
  overlayDark:     'rgba(0, 0, 0, 0.5)',
} as const;

// Map color key từ API → màu nền card
export const cardColorMap: Record<string, string> = {
  default: colors.cardDefault,
  red:     colors.cardRed,
  orange:  colors.cardOrange,
  yellow:  colors.cardYellow,
  green:   colors.cardGreen,
  teal:    colors.cardTeal,
  blue:    colors.cardBlue,
  purple:  colors.cardPurple,
  pink:    colors.cardPink,
  brown:   colors.cardBrown,
};

// Dark mode (implement sau với useColorScheme)
export const darkColors = {
  bgPage:          '#111827',
  bgSurface:       '#1F2937',
  bgHover:         '#374151',
  borderDefault:   '#374151',
  textPrimary:     '#F9FAFB',
  textSecondary:   '#D1D5DB',
  textTertiary:    '#9CA3AF',
};