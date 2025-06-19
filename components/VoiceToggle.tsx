import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Mic, Keyboard } from 'lucide-react-native';

interface VoiceToggleProps {
  isVoiceMode: boolean;
  onToggle: (isVoice: boolean) => void;
  disabled?: boolean;
}

export default function VoiceToggle({ isVoiceMode, onToggle, disabled = false }: VoiceToggleProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.toggleButton,
          !isVoiceMode && styles.toggleButtonActive,
          disabled && styles.toggleButtonDisabled,
        ]}
        onPress={() => onToggle(false)}
        disabled={disabled}
      >
        <Keyboard size={16} color={!isVoiceMode ? '#FFFFFF' : '#6B8E23'} />
        <Text style={[
          styles.toggleText,
          !isVoiceMode && styles.toggleTextActive,
        ]}>
          Type
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.toggleButton,
          isVoiceMode && styles.toggleButtonActive,
          disabled && styles.toggleButtonDisabled,
        ]}
        onPress={() => onToggle(true)}
        disabled={disabled}
      >
        <Mic size={16} color={isVoiceMode ? '#FFFFFF' : '#6B8E23'} />
        <Text style={[
          styles.toggleText,
          isVoiceMode && styles.toggleTextActive,
        ]}>
          Voice
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    padding: 2,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  toggleButtonActive: {
    backgroundColor: '#6B8E23',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  toggleText: {
    marginLeft: 6,
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
});