// Spacing system based on 8px grid
export const spacing = {
  // Base unit (8px)
  unit: 8,
  
  // Spacing scale
  xs: 4,   // 0.5 * unit
  sm: 8,   // 1 * unit
  md: 12,  // 1.5 * unit
  lg: 16,  // 2 * unit
  xl: 20,  // 2.5 * unit
  '2xl': 24, // 3 * unit
  '3xl': 32, // 4 * unit
  '4xl': 40, // 5 * unit
  '5xl': 48, // 6 * unit
  '6xl': 64, // 8 * unit
  '7xl': 80, // 10 * unit
  '8xl': 96, // 12 * unit
};

// Common padding/margin combinations
export const layout = {
  // Container padding
  containerPadding: {
    paddingHorizontal: spacing.lg,
  },
  containerPaddingLarge: {
    paddingHorizontal: spacing.xl,
  },
  
  // Section spacing
  sectionSpacing: {
    marginBottom: spacing.lg,
  },
  sectionSpacingLarge: {
    marginBottom: spacing['2xl'],
  },
  
  // Card padding
  cardPadding: {
    padding: spacing.lg,
  },
  cardPaddingLarge: {
    padding: spacing.xl,
  },
  
  // Button padding
  buttonPadding: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  buttonPaddingLarge: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  
  // Input padding
  inputPadding: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
};