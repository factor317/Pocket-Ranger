import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TestNavigation from './test-navigation';

export default function NavigationTest() {
  const [useReactNavigation, setUseReactNavigation] = useState(false);

  if (useReactNavigation) {
    return <TestNavigation />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Navigation Test</Text>
        <Text style={styles.description}>
          Toggle between Expo Router and React Navigation to test which one works better.
        </Text>
        
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>
            Current: {useReactNavigation ? 'React Navigation' : 'Expo Router'}
          </Text>
          <Switch
            value={useReactNavigation}
            onValueChange={setUseReactNavigation}
            trackColor={{ false: '#e8f2ec', true: '#51946c' }}
            thumbColor={useReactNavigation ? '#0e1a13' : '#51946c'}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => setUseReactNavigation(!useReactNavigation)}
        >
          <Text style={styles.buttonText}>
            Switch to {useReactNavigation ? 'Expo Router' : 'React Navigation'}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Test Instructions:</Text>
          <Text style={styles.infoText}>
            1. Try both navigation systems{'\n'}
            2. Check for the "Unexpected text node" error{'\n'}
            3. Test all tab navigation{'\n'}
            4. Verify smooth transitions
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0e1a13',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#51946c',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
  },
  button: {
    backgroundColor: '#51946c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 32,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f2ec',
    width: '100%',
    maxWidth: 400,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#51946c',
    lineHeight: 20,
  },
});