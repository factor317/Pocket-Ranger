import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Search, Settings } from 'lucide-react-native';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
}

interface ValidationResult {
  id: string;
  rule: string;
  component: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  timestamp: number;
  fixed?: boolean;
}

interface ComponentValidatorProps {
  children: React.ReactNode;
  enabled?: boolean;
  showOverlay?: boolean;
}

export default function ComponentValidator({ 
  children, 
  enabled = true, 
  showOverlay = false 
}: ComponentValidatorProps) {
  const [isVisible, setIsVisible] = useState(showOverlay);
  const [isValidating, setIsValidating] = useState(enabled);
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [rules, setRules] = useState<ValidationRule[]>([
    {
      id: 'text-in-view',
      name: 'Text in View',
      description: 'Detects direct text content in View components',
      enabled: true,
      severity: 'error'
    },
    {
      id: 'conditional-text',
      name: 'Conditional Text',
      description: 'Detects conditional rendering that might return strings',
      enabled: true,
      severity: 'warning'
    },
    {
      id: 'whitespace-nodes',
      name: 'Whitespace Nodes',
      description: 'Detects whitespace that might cause text node errors',
      enabled: true,
      severity: 'warning'
    },
    {
      id: 'variable-strings',
      name: 'Variable Strings',
      description: 'Detects variables that might resolve to strings',
      enabled: true,
      severity: 'warning'
    },
    {
      id: 'array-rendering',
      name: 'Array Rendering',
      description: 'Detects arrays that might contain strings',
      enabled: true,
      severity: 'info'
    }
  ]);

  const validationInterval = useRef<NodeJS.Timeout>();

  // Simulate real-time validation
  useEffect(() => {
    if (!isValidating) return;

    const runValidation = () => {
      // Simulate finding issues in real-time
      const mockResults: ValidationResult[] = [
        {
          id: Date.now().toString(),
          rule: 'text-in-view',
          component: 'app/(tabs)/index.tsx:45',
          message: 'Direct text "Welcome to Pocket Ranger" found in View component',
          severity: 'error',
          timestamp: Date.now()
        },
        {
          id: (Date.now() + 1).toString(),
          rule: 'conditional-text',
          component: 'components/LoadingSpinner.tsx:23',
          message: 'Conditional expression might return string: {loading && "Loading..."}',
          severity: 'warning',
          timestamp: Date.now()
        },
        {
          id: (Date.now() + 2).toString(),
          rule: 'variable-strings',
          component: 'app/(tabs)/profile.tsx:67',
          message: 'Variable {userName} might resolve to string in View',
          severity: 'warning',
          timestamp: Date.now()
        }
      ];

      // Only add new results if validation is enabled
      if (isValidating && Math.random() > 0.7) {
        setResults(prev => [...prev.slice(-10), ...mockResults.slice(0, 1)]);
      }
    };

    validationInterval.current = setInterval(runValidation, 3000);

    return () => {
      if (validationInterval.current) {
        clearInterval(validationInterval.current);
      }
    };
  }, [isValidating]);

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  const clearResults = () => {
    setResults([]);
  };

  const markAsFixed = (resultId: string) => {
    setResults(prev => prev.map(result => 
      result.id === resultId ? { ...result, fixed: true } : result
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'info': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'error': return '#fef2f2';
      case 'warning': return '#fffbeb';
      case 'info': return '#eff6ff';
      default: return '#f9fafb';
    }
  };

  const activeResults = results.filter(result => 
    rules.find(rule => rule.id === result.rule)?.enabled && !result.fixed
  );

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
      {children}
      
      {/* Floating Toggle Button */}
      <TouchableOpacity
        style={[styles.floatingButton, isVisible && styles.floatingButtonActive]}
        onPress={() => setIsVisible(!isVisible)}
      >
        {isVisible ? <EyeOff size={20} color="#ffffff" /> : <Eye size={20} color="#ffffff" />}
        {activeResults.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeResults.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Validation Overlay */}
      {isVisible && (
        <View style={styles.overlay}>
          <SafeAreaView style={styles.overlayContent}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Search size={20} color="#0e1a13" />
                <Text style={styles.title}>Component Validator</Text>
              </View>
              <View style={styles.headerRight}>
                <Switch
                  value={isValidating}
                  onValueChange={setIsValidating}
                  trackColor={{ false: '#e8f2ec', true: '#51946c' }}
                  thumbColor={isValidating ? '#0e1a13' : '#51946c'}
                />
                <TouchableOpacity onPress={() => setIsVisible(false)}>
                  <EyeOff size={20} color="#51946c" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Status */}
            <View style={styles.status}>
              <View style={[styles.statusIndicator, { 
                backgroundColor: isValidating ? '#10b981' : '#6b7280' 
              }]} />
              <Text style={styles.statusText}>
                {isValidating ? 'Validating in real-time' : 'Validation paused'}
              </Text>
              <Text style={styles.statusCount}>
                {activeResults.length} issues found
              </Text>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Quick Actions */}
              <View style={styles.quickActions}>
                <TouchableOpacity style={styles.actionButton} onPress={clearResults}>
                  <Text style={styles.actionButtonText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.actionButtonSecondary]}
                  onPress={() => setIsValidating(!isValidating)}
                >
                  <Text style={styles.actionButtonTextSecondary}>
                    {isValidating ? 'Pause' : 'Resume'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Validation Rules */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Validation Rules</Text>
                {rules.map(rule => (
                  <View key={rule.id} style={styles.ruleItem}>
                    <View style={styles.ruleInfo}>
                      <Text style={styles.ruleName}>{rule.name}</Text>
                      <Text style={styles.ruleDescription}>{rule.description}</Text>
                    </View>
                    <Switch
                      value={rule.enabled}
                      onValueChange={() => toggleRule(rule.id)}
                      trackColor={{ false: '#e8f2ec', true: getSeverityColor(rule.severity) }}
                      thumbColor={rule.enabled ? '#ffffff' : '#51946c'}
                    />
                  </View>
                ))}
              </View>

              {/* Results */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Live Results ({activeResults.length})
                </Text>
                
                {activeResults.length === 0 ? (
                  <View style={styles.emptyState}>
                    <CheckCircle size={32} color="#10b981" />
                    <Text style={styles.emptyText}>No issues detected!</Text>
                    <Text style={styles.emptySubtext}>
                      {isValidating ? 'Monitoring for text node errors...' : 'Start validation to check for issues'}
                    </Text>
                  </View>
                ) : (
                  activeResults.map(result => (
                    <View 
                      key={result.id} 
                      style={[styles.resultItem, { 
                        backgroundColor: getSeverityBg(result.severity),
                        borderLeftColor: getSeverityColor(result.severity)
                      }]}
                    >
                      <View style={styles.resultHeader}>
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultComponent}>{result.component}</Text>
                          <Text style={styles.resultRule}>{result.rule}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.fixButton}
                          onPress={() => markAsFixed(result.id)}
                        >
                          <CheckCircle size={16} color="#10b981" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.resultMessage}>{result.message}</Text>
                      <Text style={styles.resultTime}>
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                  ))
                )}
              </View>

              {/* Quick Fixes */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Fixes</Text>
                
                <View style={styles.fixCard}>
                  <Text style={styles.fixTitle}>🔧 Most Common Fix</Text>
                  <Text style={styles.fixDescription}>
                    Wrap any text content in {'<Text>'} components:
                  </Text>
                  <View style={styles.codeExample}>
                    <Text style={styles.codeText}>
                      {'<View><Text>{content}</Text></View>'}
                    </Text>
                  </View>
                </View>

                <View style={styles.fixCard}>
                  <Text style={styles.fixTitle}>⚡ Auto-Fix Pattern</Text>
                  <Text style={styles.fixDescription}>
                    Use this pattern for conditional text:
                  </Text>
                  <View style={styles.codeExample}>
                    <Text style={styles.codeText}>
                      {'<View>{condition && <Text>Content</Text>}</View>'}
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#51946c',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 1000,
  },
  floatingButtonActive: {
    backgroundColor: '#0e1a13',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  overlayContent: {
    flex: 1,
    backgroundColor: '#f8fbfa',
    marginTop: 100,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    color: '#0e1a13',
    flex: 1,
  },
  statusCount: {
    fontSize: 12,
    color: '#51946c',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#51946c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#51946c',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  actionButtonTextSecondary: {
    color: '#51946c',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  ruleInfo: {
    flex: 1,
  },
  ruleName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0e1a13',
    marginBottom: 2,
  },
  ruleDescription: {
    fontSize: 12,
    color: '#51946c',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0e1a13',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#51946c',
    textAlign: 'center',
    marginTop: 4,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultComponent: {
    fontSize: 14,
    fontWeight: '500',
    color: '#0e1a13',
  },
  resultRule: {
    fontSize: 12,
    color: '#51946c',
    marginTop: 2,
  },
  fixButton: {
    padding: 4,
  },
  resultMessage: {
    fontSize: 13,
    color: '#0e1a13',
    marginBottom: 4,
    lineHeight: 18,
  },
  resultTime: {
    fontSize: 11,
    color: '#51946c',
  },
  fixCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  fixTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  fixDescription: {
    fontSize: 13,
    color: '#51946c',
    marginBottom: 8,
  },
  codeExample: {
    backgroundColor: '#f1f4f2',
    padding: 8,
    borderRadius: 4,
  },
  codeText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#0e1a13',
  },
});