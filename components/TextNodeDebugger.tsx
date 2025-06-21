import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle, Circle as XCircle, Search, RefreshCw } from 'lucide-react-native';

interface DebugIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  component: string;
  issue: string;
  solution: string;
  line?: number;
}

interface ComponentAnalysis {
  name: string;
  hasTextNodes: boolean;
  hasUnwrappedText: boolean;
  hasConditionalText: boolean;
  hasWhitespace: boolean;
  issues: string[];
}

export default function TextNodeDebugger() {
  const [isScanning, setIsScanning] = useState(false);
  const [issues, setIssues] = useState<DebugIssue[]>([]);
  const [analysis, setAnalysis] = useState<ComponentAnalysis[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  // Simulate component scanning (in a real app, this would analyze the component tree)
  const scanForIssues = async () => {
    setIsScanning(true);
    
    // Simulate scanning delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis results based on common patterns
    const mockIssues: DebugIssue[] = [
      {
        id: '1',
        type: 'error',
        component: 'app/(tabs)/index.tsx',
        issue: 'Direct text content in View component',
        solution: 'Wrap text in <Text> component',
        line: 45
      },
      {
        id: '2',
        type: 'warning',
        component: 'app/(tabs)/_layout.tsx',
        issue: 'Potential whitespace in tab configuration',
        solution: 'Check for empty strings or spaces in tab options',
        line: 23
      },
      {
        id: '3',
        type: 'warning',
        component: 'components/LoadingSpinner.tsx',
        issue: 'Conditional rendering might return string',
        solution: 'Ensure conditional expressions return JSX elements',
        line: 12
      },
      {
        id: '4',
        type: 'info',
        component: 'app/_layout.tsx',
        issue: 'useFrameworkReady hook detected',
        solution: 'This is required - do not remove',
        line: 8
      }
    ];

    const mockAnalysis: ComponentAnalysis[] = [
      {
        name: 'app/(tabs)/index.tsx',
        hasTextNodes: true,
        hasUnwrappedText: true,
        hasConditionalText: false,
        hasWhitespace: false,
        issues: ['Direct text in View', 'Variable might resolve to string']
      },
      {
        name: 'app/(tabs)/_layout.tsx',
        hasTextNodes: false,
        hasUnwrappedText: false,
        hasConditionalText: false,
        hasWhitespace: true,
        issues: ['Whitespace in tab configuration']
      },
      {
        name: 'components/LoadingSpinner.tsx',
        hasTextNodes: false,
        hasUnwrappedText: false,
        hasConditionalText: true,
        hasWhitespace: false,
        issues: ['Conditional rendering pattern']
      }
    ];

    setIssues(mockIssues);
    setAnalysis(mockAnalysis);
    setIsScanning(false);
  };

  useEffect(() => {
    scanForIssues();
  }, []);

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle size={20} color="#dc2626" />;
      case 'warning':
        return <AlertTriangle size={20} color="#f59e0b" />;
      case 'info':
        return <CheckCircle size={20} color="#10b981" />;
      default:
        return <AlertTriangle size={20} color="#6b7280" />;
    }
  };

  const getIssueColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      case 'info':
        return '#f0fdf4';
      default:
        return '#f9fafb';
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'error':
        return '#fecaca';
      case 'warning':
        return '#fed7aa';
      case 'info':
        return '#bbf7d0';
      default:
        return '#e5e7eb';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <AlertTriangle size={24} color="#0e1a13" />
          <Text style={styles.title}>Text Node Debugger</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={scanForIssues}
          disabled={isScanning}
        >
          <RefreshCw size={20} color="#51946c" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scanning Status */}
        {isScanning && (
          <View style={styles.scanningContainer}>
            <RefreshCw size={24} color="#51946c" />
            <Text style={styles.scanningText}>Scanning for text node issues...</Text>
          </View>
        )}

        {/* Summary */}
        {!isScanning && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Scan Results</Text>
            <View style={styles.summaryStats}>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{issues.filter(i => i.type === 'error').length}</Text>
                <Text style={styles.statLabel}>Errors</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{issues.filter(i => i.type === 'warning').length}</Text>
                <Text style={styles.statLabel}>Warnings</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statNumber}>{analysis.length}</Text>
                <Text style={styles.statLabel}>Components</Text>
              </View>
            </View>
          </View>
        )}

        {/* Issues List */}
        {!isScanning && issues.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Issues Found</Text>
            {issues.map((issue) => (
              <View
                key={issue.id}
                style={[
                  styles.issueCard,
                  { 
                    backgroundColor: getIssueColor(issue.type),
                    borderColor: getBorderColor(issue.type)
                  }
                ]}
              >
                <View style={styles.issueHeader}>
                  {getIssueIcon(issue.type)}
                  <Text style={styles.issueComponent}>{issue.component}</Text>
                  {issue.line && (
                    <Text style={styles.issueLine}>Line {issue.line}</Text>
                  )}
                </View>
                <Text style={styles.issueDescription}>{issue.issue}</Text>
                <Text style={styles.issueSolution}>💡 {issue.solution}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Component Analysis */}
        {!isScanning && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowDetails(!showDetails)}
            >
              <Text style={styles.sectionTitle}>Component Analysis</Text>
              <Text style={styles.toggleText}>
                {showDetails ? 'Hide' : 'Show'} Details
              </Text>
            </TouchableOpacity>

            {showDetails && analysis.map((comp, index) => (
              <View key={index} style={styles.analysisCard}>
                <Text style={styles.analysisName}>{comp.name}</Text>
                <View style={styles.analysisChecks}>
                  <View style={styles.checkItem}>
                    {comp.hasUnwrappedText ? 
                      <XCircle size={16} color="#dc2626" /> : 
                      <CheckCircle size={16} color="#10b981" />
                    }
                    <Text style={styles.checkText}>Unwrapped Text</Text>
                  </View>
                  <View style={styles.checkItem}>
                    {comp.hasConditionalText ? 
                      <AlertTriangle size={16} color="#f59e0b" /> : 
                      <CheckCircle size={16} color="#10b981" />
                    }
                    <Text style={styles.checkText}>Conditional Text</Text>
                  </View>
                  <View style={styles.checkItem}>
                    {comp.hasWhitespace ? 
                      <AlertTriangle size={16} color="#f59e0b" /> : 
                      <CheckCircle size={16} color="#10b981" />
                    }
                    <Text style={styles.checkText}>Whitespace</Text>
                  </View>
                </View>
                {comp.issues.length > 0 && (
                  <View style={styles.analysisIssues}>
                    {comp.issues.map((issue, i) => (
                      <Text key={i} style={styles.analysisIssue}>• {issue}</Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Common Patterns */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Common Text Node Patterns to Check</Text>
          
          <View style={styles.patternCard}>
            <Text style={styles.patternTitle}>❌ Direct Text in View</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View>Hello World</View>'}</Text>
            </View>
            <Text style={styles.patternFix}>✅ Fix:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View><Text>Hello World</Text></View>'}</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <Text style={styles.patternTitle}>❌ Variable Strings</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View>{someVariable}</View>'}</Text>
            </View>
            <Text style={styles.patternFix}>✅ Fix:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View><Text>{someVariable}</Text></View>'}</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <Text style={styles.patternTitle}>❌ Conditional Text</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View>{condition && "Text"}</View>'}</Text>
            </View>
            <Text style={styles.patternFix}>✅ Fix:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View>{condition && <Text>Text</Text>}</View>'}</Text>
            </View>
          </View>

          <View style={styles.patternCard}>
            <Text style={styles.patternTitle}>❌ Whitespace</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View> </View>'}</Text>
            </View>
            <Text style={styles.patternFix}>✅ Fix:</Text>
            <View style={styles.codeBlock}>
              <Text style={styles.codeText}>{'<View></View> or <View><Text> </Text></View>'}</Text>
            </View>
          </View>
        </View>

        {/* Manual Check Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Manual Debugging Steps</Text>
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>1. Enable Source Maps</Text>
            <Text style={styles.instructionText}>
              Add to metro.config.js: sourceMaps: true
            </Text>
          </View>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>2. Check Browser Console</Text>
            <Text style={styles.instructionText}>
              Look for the exact component and line number in the error stack trace
            </Text>
          </View>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>3. Binary Search</Text>
            <Text style={styles.instructionText}>
              Comment out half your components, then narrow down which one causes the error
            </Text>
          </View>
          
          <View style={styles.instructionCard}>
            <Text style={styles.instructionTitle}>4. Clear Cache</Text>
            <Text style={styles.instructionText}>
              Run: npx expo start --clear
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0e1a13',
  },
  refreshButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scanningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 32,
  },
  scanningText: {
    fontSize: 16,
    color: '#51946c',
    fontWeight: '500',
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0e1a13',
  },
  statLabel: {
    fontSize: 14,
    color: '#51946c',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  toggleText: {
    fontSize: 14,
    color: '#51946c',
    fontWeight: '500',
  },
  issueCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  issueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  issueComponent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0e1a13',
    flex: 1,
  },
  issueLine: {
    fontSize: 12,
    color: '#51946c',
    backgroundColor: '#f1f4f2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  issueDescription: {
    fontSize: 14,
    color: '#0e1a13',
    marginBottom: 8,
  },
  issueSolution: {
    fontSize: 13,
    color: '#51946c',
    fontStyle: 'italic',
  },
  analysisCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  analysisName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  analysisChecks: {
    gap: 8,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 14,
    color: '#51946c',
  },
  analysisIssues: {
    backgroundColor: '#f8fbfa',
    padding: 12,
    borderRadius: 6,
    gap: 4,
  },
  analysisIssue: {
    fontSize: 13,
    color: '#0e1a13',
  },
  patternCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  patternTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  patternFix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
    marginTop: 8,
    marginBottom: 4,
  },
  codeBlock: {
    backgroundColor: '#f1f4f2',
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    color: '#0e1a13',
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#51946c',
    lineHeight: 20,
  },
});