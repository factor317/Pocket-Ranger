/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import LoadingSpinner from '../../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    const { getByTestId } = render(<LoadingSpinner />);
    // Since we can't easily test animations in Jest, we just verify it renders
    expect(() => render(<LoadingSpinner />)).not.toThrow();
  });

  test('renders with custom size', () => {
    const { getByTestId } = render(<LoadingSpinner size={48} />);
    expect(() => render(<LoadingSpinner size={48} />)).not.toThrow();
  });

  test('renders with custom color', () => {
    const { getByTestId } = render(<LoadingSpinner color="#FF0000" />);
    expect(() => render(<LoadingSpinner color="#FF0000" />)).not.toThrow();
  });

  test('renders with both custom size and color', () => {
    const { getByTestId } = render(<LoadingSpinner size={32} color="#00FF00" />);
    expect(() => render(<LoadingSpinner size={32} color="#00FF00" />)).not.toThrow();
  });
});