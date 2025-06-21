import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ComponentValidator from '../components/ComponentValidator';
import { TriangleAlert as AlertTriangle, CircleCheck as CheckCircle } from 'lucide-react-native';

// Demo component with intentional text node issues
function ProblematicComponent({ showIssues }: { showIssues: boolean }) {
  const [userInput, setUserInput] = useState('');
  const [showConditional, setShowConditional] = useState(false);
  
  if (!showIssues) {
    return (
      <View style={styles.demoCard}>
        <Text style={styles.demoTitle}>✅ Clean Component</Text>
        <Text style={styles.demoDescription}>
          This component properly wraps all text in Text components.
        </Text>
        <TouchableOpacity style={styles.demoButton}>
          <Text style={styles.demoButtonText}>No Issues Here!</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.demoCard}>
      <Text style={styles.demoTitle}>❌ Problematic Component</Text>
      
      {/* Issue 1: Direct text in View */}
      <View style={styles.issueExample}>
        This text should be wrapped in a Text component!
      </View>
      
      {/* Issue 2: Conditional text */}
      <View style={styles.issueExample}>
        {showConditional && "This conditional text is problematic"}
      </View>
      
      {/* Issue 3: Variable that might be a string */}
      <View style={styles.issueExample}>
        {userInput}
      </View>
      
      {/* Issue 4: Whitespace */}
      <View style={styles.issueExample}>
        {' '}
      </View>
      
      <TouchableOpacity 
        style={styles.demoButton}
        onPress={() => setShowConditional(!showConditional)}
      >
        <Text style={styles.demoButtonText}>Toggle Conditional Text</Text>
      </TouchableOpacity>
      
      <TextInput
        style={styles.demoInput}
        placeholder="Type something..."
        value={userInput}
        onChangeText={setUserInput}
      />
    </View>
  );
}

export default function ComponentValidatorDemo() {
  const [showIssues, setShowIssues] = useState(false);
  const [validatorEnabled, setValidatorEnabled] = useState(true);

  return (
    <ComponentValidator enabled={validatorEnabled} showOverlay={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <AlertTriangle size={24} color="#0e1a13" />
          <Text style={styles.title}>Component Validator Demo</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.description}>
            This demo shows how the Component Validator works in real-time. 
            Toggle between clean and problematic components to see validation in action.
          </Text>

          <View style={styles.controls}>
            <TouchableOpacity
              style={[styles.controlButton, showIssues && styles.controlButtonActive]}
              onPress={() => setShowIssues(!showIssues)}
            >
              <Text style={[styles.controlButtonText, showIssues && styles.controlButtonTextActive]}>
                {showIssues ? 'Hide Issues' : 'Show Issues'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, validatorEnabled && styles.controlButtonActive]}
              onPress={() => setValidatorEnabled(!validatorEnabled)}
            >
              <Text style={[styles.controlButtonText, validatorEnabled && styles.controlButtonTextActive]}>
                {validatorEnabled ? 'Disable Validator' : 'Enable Validator'}
              </Text>
            </TouchableOpacity>
          </View>

          <ProblematicComponent showIssues={showIssues} />

          <View style={styles.infoCard}>
            <CheckCircle size={20} color="#10b981" />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How to Use the Validator</Text>
              <Text style={styles.infoText}>
                1. Look for the floating eye icon in the top-right corner{'\n'}
                2. Tap it to open the validation overlay{'\n'}
                3. Enable/disable specific validation rules{'\n'}
                4. View real-time issues as they're detected{'\n'}
                5. Mark issues as fixed when resolved
              </Text>
            </View>
          </View>

          <View style={styles.warningCard}>
            <AlertTriangle size={20} color="#f59e0b" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>Note</Text>
              <Text style={styles.warningText}>
                This is a simulation. In a real implementation, the validator would 
                analyze your actual component tree and detect real text node issues.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </ComponentValidator>
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
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0e1a13',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  description: {
    fontSize: 16,
    color: '#51946c',
    lineHeight: 24,
    marginBottom: 24,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  controlButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#51946c',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#51946c',
  },
  controlButtonText: {
    color: '#51946c',
    fontSize: 14,
    fontWeight: '500',
  },
  controlButtonTextActive: {
    color: '#ffffff',
  },
  demoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  demoDescription: {
    fontSize: 14,
    color: '#51946c',
    marginBottom: 16,
    lineHeight: 20,
  },
  issueExample: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  demoButton: {
    backgroundColor: '#51946c',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginBottom: 12,
  },
  demoButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  demoInput: {
    borderWidth: 1,
    borderColor: '#e8f2ec',
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8fbfa',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 16,
    gap: 12,
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#d97706',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});