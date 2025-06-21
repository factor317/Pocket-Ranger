import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's the text node error
    const isTextNodeError = error.message.includes('text node') || 
                           error.message.includes('A text node cannot be a child of a <View>');
    
    if (isTextNodeError) {
      console.error('🚨 TEXT NODE ERROR DETECTED:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isTextNodeError = this.state.error?.message.includes('text node') || 
                             this.state.error?.message.includes('A text node cannot be a child of a <View>');

      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color="#dc2626" />
            <Text style={styles.title}>
              {isTextNodeError ? 'Text Node Error Detected!' : 'Something went wrong'}
            </Text>
            
            {isTextNodeError && (
              <View style={styles.textNodeInfo}>
                <Text style={styles.textNodeTitle}>🎯 This is the error you're looking for!</Text>
                <Text style={styles.textNodeDescription}>
                  A text node (string) was rendered directly inside a {'<View>'} component.
                  All text must be wrapped in {'<Text>'} components.
                </Text>
              </View>
            )}

            <View style={styles.errorDetails}>
              <Text style={styles.errorMessage}>
                {this.state.error?.message}
              </Text>
              
              {this.state.errorInfo?.componentStack && (
                <View style={styles.stackContainer}>
                  <Text style={styles.stackTitle}>Component Stack:</Text>
                  <Text style={styles.stackTrace}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={this.handleReset}>
              <RefreshCw size={20} color="#ffffff" />
              <Text style={styles.resetButtonText}>Try Again</Text>
            </TouchableOpacity>

            {isTextNodeError && (
              <View style={styles.debugTips}>
                <Text style={styles.debugTitle}>🔍 Debugging Tips:</Text>
                <Text style={styles.debugTip}>
                  • Check the component stack above for the problematic component
                </Text>
                <Text style={styles.debugTip}>
                  • Look for direct strings in {'<View>'} components
                </Text>
                <Text style={styles.debugTip}>
                  • Check for variables that might resolve to strings
                </Text>
                <Text style={styles.debugTip}>
                  • Look for conditional rendering that returns strings
                </Text>
                <Text style={styles.debugTip}>
                  • Navigate to /debug-text-nodes for detailed analysis
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0e1a13',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  textNodeInfo: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
    width: '100%',
  },
  textNodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  textNodeDescription: {
    fontSize: 14,
    color: '#7f1d1d',
    lineHeight: 20,
  },
  errorDetails: {
    width: '100%',
    marginBottom: 20,
  },
  errorMessage: {
    fontSize: 14,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 12,
    fontFamily: 'monospace',
  },
  stackContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    padding: 12,
  },
  stackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 12,
    color: '#51946c',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  debugTips: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 12,
  },
  debugTip: {
    fontSize: 13,
    color: '#166534',
    marginBottom: 4,
    lineHeight: 18,
  },
});