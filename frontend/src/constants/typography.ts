// constants/typography.ts
export const typography = {
  h1: {
    fontFamily: 'Inter-Bold',
    fontSize: 31,
    lineHeight: 37,        // 31 * 1.2
    letterSpacing: -0.62,  // -0.02em
    color: '#1A1A1A',
  },
  h2: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 25,
    lineHeight: 33,        // 25 * 1.3
    letterSpacing: -0.5,   // -0.02em
    color: '#1A1A1A',
  },
  h3: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    lineHeight: 26,        // 20 * 1.3
    letterSpacing: 0,
    color: '#1A1A1A',
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 24,        // 16 * 1.5
    letterSpacing: 0,
    color: '#1A1A1A',
  },
  bodySm: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 21,        // 14 * 1.5
    letterSpacing: 0,
    color: '#374151',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    lineHeight: 17,        // 14 * 1.2
    letterSpacing: 0,
    color: '#374151',
  },
  caption: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    lineHeight: 14,        // 12 * 1.2
    letterSpacing: 0.12,   // +0.01em
    color: '#666666',
  },
  sectionLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.7,    // 0.07em
    color: '#666666',
    textTransform: 'uppercase' as const,
  },
} as const;