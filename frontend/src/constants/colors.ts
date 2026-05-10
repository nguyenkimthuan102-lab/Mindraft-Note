// Bảng màu Sáng (Gốc của bạn)
const lightColors = {
  primary:         '#2D7A4F',
  primaryHover:    '#246339',
  primaryActive:   '#1E5230',
  primarySubtle:   '#E2F3E8',
  primaryGhost:    'rgba(45, 122, 79, 0.1)',

  danger:          '#E85C3F',
  dangerHover:     '#D14A2E',
  dangerSubtle:    '#FEF2F2',

  gray50:          '#F9FAFB',
  gray100:         '#F3F4F6',
  gray200:         '#E5E7EB',
  gray300:         '#D1D5DB',
  gray400:         '#9CA3AF',
  gray500:         '#6B7280',
  gray600:         '#4B5563',
  gray700:         '#374151',
  gray900:         '#1A1A1A',

  textPrimary:     '#1A1A1A',
  textSecondary:   '#374151',
  textTertiary:    '#666666',
  textPlaceholder: '#9CA3AF',
  textDisabled:    '#D1D5DB',
  textInverse:     '#FFFFFF',
  textBrand:       '#2D7A4F',
  textDanger:      '#E85C3F',

  bgPage:          '#F9FAFB',
  bgSurface:       '#FFFFFF',
  bgHover:         '#F3F4F6',
  bgActive:        'rgba(45, 122, 79, 0.08)',

  borderDefault:   '#E5E7EB',
  borderFocus:     '#2D7A4F',
  borderSelected:  '#2D7A4F',

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

  checkboxUnchecked: '#BBBBB5',
  checkboxChecked:   '#2D7A4F',

  overlayLight:    'rgba(0, 0, 0, 0.25)',
  overlayDark:     'rgba(0, 0, 0, 0.5)',
};

// Bảng màu Tối (Mở rộng từ darkColors của bạn)
const darkColorsInternal = {
  ...lightColors, // Kế thừa các màu cơ bản
  bgPage:          '#111827',
  bgSurface:       '#1F2937',
  bgHover:         '#374151',
  borderDefault:   '#374151',
  textPrimary:     '#F9FAFB',
  textSecondary:   '#D1D5DB',
  textTertiary:    '#9CA3AF',
  textInverse:     '#111827',
  cardDefault:     '#1F2937',
  // Card colors trong Dark Mode nên tối hơn một chút để đỡ chói
  cardRed:         '#442726',
  cardOrange:      '#433519',
  cardYellow:      '#454418',
  cardGreen:       '#1B2E25',
  cardBlue:        '#1E2B4E',
};

// Xuất ra themes để dùng động
export const themes = {
  light: lightColors,
  dark: darkColorsInternal,
};

// Giữ lại export cũ để các file chưa sửa không bị lỗi
export const colors = lightColors;

// Hàm hỗ trợ lấy màu card theo theme
export const getCardColorMap = (isDark: boolean) => {
  const current = isDark ? themes.dark : themes.light;
  return {
    default: current.cardDefault,
    red:     current.cardRed,
    orange:  current.cardOrange,
    yellow:  current.cardYellow,
    green:   current.cardGreen,
    teal:    current.cardTeal,
    blue:    current.cardBlue,
    purple:  current.cardPurple,
    pink:    current.cardPink,
    brown:   current.cardBrown,
  };
};