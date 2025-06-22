import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Play, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react-native';
import { router } from 'expo-router';

interface DebugInfo {
  timestamp: string;
  environment: string;
  checks: {
    dataDirectory?: any;
    adventuresDirectory?: any;
    adventureFiles?: any;
    fileValidation?: any;
    sampleQueries?: any;
    aiRecommendations?: any;
    testScenarios?: any;
  };
}

interface TestResult {
  testCase: string;
  timestamp: string;
  steps: {
    groqChat?: any;
    pocPlan?: any;
    validation?: any;
  };
  overall: {
    status: string;
    message: string;
  };
}

export default function DebugAdventuresScreen() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingFlow, setTestingFlow] = useState(false);

  useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading debug information...');
      
      const response = await fetch('/api/debug-adventures');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
      
      console.log('✅ Debug information loaded successfully');
    } catch (error) {
      console.error('❌ Error loading debug info:', error);
      Alert.alert('Error', 'Failed to load debug information');
    } finally {
      setLoading(false);
    }
  };

  const runTestFlow = async (testCase: string) => {
    try {
      setTestingFlow(true);
      console.log(`🧪 Running test flow for: ${testCase}`);
      
      const response = await fetch('/api/test-adventure-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCase })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setTestResults(prev => [result, ...prev]);
      
      console.log(`✅ Test flow completed for: ${testCase}`);
    } catch (error) {
      console.error(`❌ Test flow failed for ${testCase}:`, error);
      Alert.alert('Error', `Test flow failed: ${error.message}`);
    } finally {
      setTestingFlow(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'valid':
        return <CheckCircle size={16} color="#10b981" />;
      case 'error':
      case 'invalid':
      case 'failure':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <AlertCircle size={16} color="#f59e0b" />;
    }
  };

  const testCases = [
    'hiking in utah for 4 days',
    'Moab red rock adventure',
    'Colorado mountain hiking',
    'Glacier National Park trip',
    'Sedona spiritual journey'
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#0e1a13" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Adventure Debug</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading debug information...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#0e1a13" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adventure Debug</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDebugInfo}>
          <RefreshCw size={20} color="#51946c" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          {debugInfo && (
            <View style={styles.statusGrid}>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Data Directory</Text>
                {getStatusIcon(debugInfo.checks.dataDirectory?.exists ? 'success' : 'error')}
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Adventures Directory</Text>
                {getStatusIcon(debugInfo.checks.adventuresDirectory?.exists ? 'success' : 'error')}
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Adventure Files</Text>
                {getStatusIcon(debugInfo.checks.adventureFiles?.count > 0 ? 'success' : 'error')}
                <Text style={styles.statusCount}>
                  {debugInfo.checks.adventureFiles?.count || 0}
                </Text>
              </View>
              <View style={styles.statusItem}>
                <Text style={styles.statusLabel}>Sample Queries</Text>
                {getStatusIcon(debugInfo.checks.sampleQueries?.valid ? 'success' : 'error')}
              </View>
            </View>
          )}
        </View>

        {/* Adventure Files */}
        {debugInfo?.checks.fileValidation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adventure Files</Text>
            {Object.entries(debugInfo.checks.fileValidation).map(([file, info]: [string, any]) => (
              <View key={file} style={styles.fileItem}>
                <View style={styles.fileHeader}>
                  <Text style={styles.fileName}>{file}</Text>
                  {getStatusIcon(info.status)}
                </View>
                {info.status === 'valid' && info.structure && (
                  <View style={styles.fileDetails}>
                    <Text style={styles.fileDetail}>📍 {info.structure.city}</Text>
                    <Text style={styles.fileDetail}>🎯 {info.structure.activity}</Text>
                    <Text style={styles.fileDetail}>📅 {info.structure.scheduleItems} activities</Text>
                  </View>
                )}
                {info.error && (
                  <Text style={styles.errorText}>{info.error}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Test Scenarios */}
        {debugInfo?.checks.testScenarios && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Scenarios</Text>
            {Object.entries(debugInfo.checks.testScenarios).map(([input, result]: [string, any]) => (
              <View key={input} style={styles.testItem}>
                <View style={styles.testHeader}>
                  <Text style={styles.testInput}>"{input}"</Text>
                  {getStatusIcon(result.matches ? 'success' : 'error')}
                </View>
                <View style={styles.testDetails}>
                  <Text style={styles.testDetail}>Expected: {result.expectedFile}</Text>
                  <Text style={styles.testDetail}>Actual: {result.actualFile}</Text>
                  <Text style={styles.testDetail}>Method: {result.method}</Text>
                  {result.adventure && (
                    <Text style={styles.testDetail}>Adventure: {result.adventure.name}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Live Testing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Live Flow Testing</Text>
          <Text style={styles.sectionSubtitle}>
            Test the complete adventure flow from user input to itinerary display
          </Text>
          
          <View style={styles.testCasesGrid}>
            {testCases.map((testCase) => (
              <TouchableOpacity
                key={testCase}
                style={[styles.testCaseButton, testingFlow && styles.testCaseButtonDisabled]}
                onPress={() => runTestFlow(testCase)}
                disabled={testingFlow}
              >
                <Play size={16} color="#ffffff" />
                <Text style={styles.testCaseButtonText}>{testCase}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Test Results</Text>
            {testResults.map((result, index) => (
              <View key={index} style={styles.testResultItem}>
                <View style={styles.testResultHeader}>
                  <Text style={styles.testResultCase}>"{result.testCase}"</Text>
                  {getStatusIcon(result.overall.status)}
                </View>
                
                <View style={styles.testResultSteps}>
                  {result.steps.groqChat && (
                    <View style={styles.stepItem}>
                      <Text style={styles.stepTitle}>1. Groq Chat API</Text>
                      {getStatusIcon(result.steps.groqChat.status)}
                      {result.steps.groqChat.recommendedFile && (
                        <Text style={styles.stepDetail}>
                          Recommended: {result.steps.groqChat.recommendedFile}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {result.steps.pocPlan && (
                    <View style={styles.stepItem}>
                      <Text style={styles.stepTitle}>2. POC Plan API</Text>
                      {getStatusIcon(result.steps.pocPlan.status)}
                      {result.steps.pocPlan.adventure && (
                        <Text style={styles.stepDetail}>
                          Adventure: {result.steps.pocPlan.adventure.name}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {result.steps.validation && (
                    <View style={styles.stepItem}>
                      <Text style={styles.stepTitle}>3. Data Validation</Text>
                      {getStatusIcon(result.steps.validation.overall)}
                      <Text style={styles.stepDetail}>
                        Schedule Items: {result.steps.validation.scheduleLength}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Debug Info JSON */}
        {debugInfo && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Raw Debug Data</Text>
            <View style={styles.jsonContainer}>
              <Text style={styles.jsonText}>
                {JSON.stringify(debugInfo, null, 2)}
              </Text>
            </View>
          </View>
        )}
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
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e1a13',
    flex: 1,
    textAlign: 'center',
  },
  refreshButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#51946c',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e1a13',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#688273',
    marginBottom: 16,
    lineHeight: 20,
  },
  statusGrid: {
    gap: 12,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#121714',
    flex: 1,
  },
  statusCount: {
    fontSize: 12,
    color: '#688273',
    marginLeft: 8,
  },
  fileItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f4f2',
  },
  fileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121714',
    flex: 1,
  },
  fileDetails: {
    marginTop: 4,
    gap: 2,
  },
  fileDetail: {
    fontSize: 12,
    color: '#688273',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  testItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f4f2',
  },
  testHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  testInput: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121714',
    flex: 1,
  },
  testDetails: {
    marginTop: 4,
    gap: 2,
  },
  testDetail: {
    fontSize: 12,
    color: '#688273',
  },
  testCasesGrid: {
    gap: 8,
  },
  testCaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#51946c',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  testCaseButtonDisabled: {
    backgroundColor: '#d1e6d9',
  },
  testCaseButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  testResultItem: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f8fbfa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  testResultCase: {
    fontSize: 14,
    fontWeight: '600',
    color: '#121714',
    flex: 1,
  },
  testResultSteps: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121714',
    flex: 1,
  },
  stepDetail: {
    fontSize: 11,
    color: '#688273',
    marginLeft: 24,
  },
  jsonContainer: {
    backgroundColor: '#f1f4f2',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  jsonText: {
    fontSize: 10,
    color: '#121714',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
});