import { colors } from './colors';
import { textStyles } from './typography';
import { spacing, layout } from './spacing';
import { shadows } from './shadows';

// Common component styles
export const componentStyles = {
  // Container styles
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Header styles
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.medium,
  },
  
  headerTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
    flex: 1,
    textAlign: 'center' as const,
  },
  
  // Button styles
  button: {
    borderRadius: spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...layout.buttonPadding,
  },
  
  buttonPrimary: {
    backgroundColor: colors.secondary[400],
  },
  
  buttonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  
  buttonText: {
    ...textStyles.button,
    color: colors.text.primary,
  },
  
  buttonTextSecondary: {
    ...textStyles.button,
    color: colors.primary[500],
  },
  
  // Card styles
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.md,
    ...layout.cardPadding,
    ...shadows.md,
  },
  
  cardLarge: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.lg,
    ...layout.cardPaddingLarge,
    ...shadows.lg,
  },
  
  // Input styles
  input: {
    backgroundColor: colors.background.tertiary,
    borderRadius: spacing.md,
    ...layout.inputPadding,
    ...textStyles.body,
    color: colors.text.primary,
    borderWidth: 0,
  },
  
  inputFocused: {
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  
  // Text styles
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
  },
  
  subtitle: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  
  bodyText: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  
  captionText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing['5xl'],
  },
  
  loadingText: {
    ...textStyles.body,
    color: colors.text.tertiary,
  },
  
  // Empty states
  emptyState: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: spacing['5xl'],
  },
  
  emptyTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  
  emptySubtitle: {
    ...textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center' as const,
    marginBottom: spacing['2xl'],
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: spacing.xl,
  },
  
  modalContent: {
    backgroundColor: colors.background.primary,
    borderRadius: spacing.lg,
    padding: spacing['2xl'],
    width: '100%',
    maxWidth: 400,
    ...shadows.xl,
  },
  
  // Status indicators
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.md,
  },
  
  badgeWarning: {
    backgroundColor: colors.warning[500],
  },
  
  badgeSuccess: {
    backgroundColor: colors.success[500],
  },
  
  badgeText: {
    ...textStyles.caption,
    color: colors.text.inverse,
    fontWeight: '600',
  },
};