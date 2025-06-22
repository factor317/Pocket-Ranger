import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface AiResponseDisplayProps {
  aiResponse: string;
}

export default function AiResponseDisplay({
  aiResponse,
}: AiResponseDisplayProps) {
  // Validate aiResponse before rendering
  if (!aiResponse || typeof aiResponse !== 'string' || !aiResponse.trim()) {
    return null;
  }

  return (
    <View style={styles.aiResponseContainer}>
      <Text style={styles.aiResponseText}>{aiResponse.trim()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aiResponseContainer: {
    margin: 16,
    backgroundColor: '#f8faf9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8f0ea',
  },
  aiResponseText: {
    fontSize: 15,
    color: '#121714',
    lineHeight: 22,
    fontWeight: '400',
  },
});