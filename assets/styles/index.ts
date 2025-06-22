// Main style exports
export { colors } from './colors';
export { typography, textStyles } from './typography';
export { spacing, layout } from './spacing';
export { shadows } from './shadows';
export { componentStyles } from './components';

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