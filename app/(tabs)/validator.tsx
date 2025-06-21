import React from 'react';
import RealTextNodeValidator from '../../components/RealTextNodeValidator';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Shield } from 'lucide-react-native';

export default function ValidatorTab() {
  return (
    <RealTextNodeValidator enabled={true} autoScan={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Shield size={24} color="#10b981" />
          <Text style={styles.title}>Text Node Validator</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🎯 Real-Time Text Node Detection</Text>
            <Text style={styles.infoText}>
              This validator scans your actual DOM and finds genuine text node errors. 
              It analyzes the real component tree and detects issues in real-time.
            </Text>
            <Text style={styles.infoText}>
              Look for the red floating button in the top-right corner. 
              It will show the actual number of text node issues found in your app.
            </Text>
          </View>

          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>📋 How to Use</Text>
            <Text style={styles.instructionItem}>
              • Tap the floating eye button to open the validator overlay
            </Text>
            <Text style={styles.instructionItem}>
              • View real-time issues as they're detected
            </Text>
            <Text style={styles.instructionItem}>
              • Tap any issue to see detailed fix information
            </Text>
            <Text style={styles.instructionItem}>
              • Copy fixes directly to your clipboard
            </Text>
            <Text style={styles.instructionItem}>
              • Issues update automatically as you code
            </Text>
          </View>

          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>✅ Clean Component Example</Text>
            <Text style={styles.statusDescription}>
              This validator tab contains no test data and will only show real issues 
              found in your actual application components.
            </Text>
            <View style={styles.cleanExample}>
              <Text style={styles.cleanExampleText}>
                All text in this component is properly wrapped in Text components.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </RealTextNodeValidator>
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
  infoCard: {
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#7dd3fc',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0c4a6e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#0c4a6e',
    lineHeight: 20,
    marginBottom: 8,
  },
  instructionsCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 12,
  },
  instructionItem: {
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
    marginBottom: 4,
  },
  statusCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8f2ec',
    borderRadius: 12,
    padding: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 14,
    color: '#51946c',
    lineHeight: 20,
    marginBottom: 12,
  },
  cleanExample: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
  },
  cleanExampleText: {
    fontSize: 14,
    color: '#15803d',
    textAlign: 'center',
  },
});