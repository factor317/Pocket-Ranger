// Import all style modules first
import { colors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, layout } from './spacing';
import { shadows } from './shadows';
import { componentStyles } from './components';

// Re-export for direct access
export { colors, typography, textStyles, spacing, layout, shadows, componentStyles };

// Theme object for easy access
export const theme = {
  colors,
  typography,
  textStyles,
  spacing,
  layout,
  shadows,
  components: componentStyles,
};

// Utility functions for style composition
export const createStyles = (styleObject: any) => styleObject;

export const combineStyles = (...styles: any[]) => {
  return Object.assign({}, ...styles);
};