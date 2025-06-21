import React from 'react';
import RealTextNodeValidator from '../../components/RealTextNodeValidator';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';

// Test component with REAL text node issues
function TestComponent() {
  const userName = "John Doe";
  const showMessage = true;
  
  return (
    <View style={styles.testContainer}>
      <Text style={styles.testTitle}>Real Text Node Test</Text>
      
      {/* This WILL cause a text node error */}
      <View style={styles.problemView}>
        This text is directly in a View - REAL ERROR!
      </View>
      
      {/* This WILL cause a conditional text error */}
      <View style={styles.problemView}>
        {showMessage && "This conditional text is problematic"}
      </View>
      
      {/* This WILL cause a variable text error */}
      <View style={styles.problemView}>
        {userName}
      </View>
      
      {/* This is CORRECT */}
      <View style={styles.correctView}>
        <Text style={styles.correctText}>This text is properly wrapped!</Text>
      </View>
    </View>
  );
}

export default function ValidatorTab() {
  return (
    <RealTextNodeValidator enabled={true} autoScan={true}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <AlertTriangle size={24} color="#dc2626" />
          <Text style={styles.title}>REAL Text Node Validator</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>🎯 This is a REAL validator!</Text>
            <Text style={styles.infoText}>
              This validator scans your actual DOM and finds genuine text node errors. 
              No mock data - it analyzes the real component tree!
            </Text>
            <Text style={styles.infoText}>
              Look for the red floating button in the top-right corner. 
              It will show the actual number of text node issues found.
            </Text>
          </View>

          <TestComponent />

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>⚠️ Expected Behavior</Text>
            <Text style={styles.warningText}>
              The test component above contains REAL text node errors. 
              The validator should detect them and show them in the overlay.
            </Text>
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
    color: '#dc2626',
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
  testContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f2ec',
  },
  testTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 16,
  },
  problemView: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 12,
    marginBottom: 12,
  },
  correctView: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    padding: 12,
  },
  correctText: {
    color: '#15803d',
    fontSize: 14,
  },
  warningCard: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    padding: 16,
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