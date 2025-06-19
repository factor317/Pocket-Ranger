import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, Square } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({
  onTranscriptionComplete,
  onError,
  disabled = false,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    requestPermissions();
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'web') {
      // For web, we'll handle permissions differently
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
        setHasPermission(true);
      } catch (error) {
        setHasPermission(false);
      }
    } else {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    }
  };

  const startRecording = async () => {
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission to use voice input.');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync({
        android: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.wav',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/wav',
          bitsPerSecond: 128000,
        },
      });

      await recording.startAsync();
      recordingRef.current = recording;
      setIsRecording(true);

      // Start pulsing animation
      scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
      opacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      onError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      setIsProcessing(true);

      // Stop animations
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = withTiming(1);
      opacity.value = withTiming(1);

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      if (uri) {
        await processAudioFile(uri);
      } else {
        throw new Error('No audio file generated');
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError('Failed to process recording. Please try again.');
      setIsProcessing(false);
    }
  };

  const processAudioFile = async (audioUri: string) => {
    try {
      // Convert audio to base64 for API transmission
      const response = await fetch(audioUri);
      const audioBlob = await response.blob();
      const audioBase64 = await blobToBase64(audioBlob);

      // Send to BorgCloud for speech-to-text
      const transcription = await transcribeAudio(audioBase64);
      
      if (transcription) {
        onTranscriptionComplete(transcription);
      } else {
        onError('Could not understand the audio. Please try speaking more clearly.');
      }
    } catch (error) {
      console.error('Audio processing error:', error);
      onError('Failed to process audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove data:audio/wav;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const transcribeAudio = async (audioBase64: string): Promise<string | null> => {
    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: audioBase64,
          format: 'wav',
        }),
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      return data.text || null;
    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Requesting microphone permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
          <MicOff size={24} color="#D4A5A5" />
          <Text style={styles.permissionText}>Grant Microphone Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[animatedStyle]}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            (disabled || isProcessing) && styles.recordButtonDisabled,
          ]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={disabled || isProcessing}
        >
          {isProcessing ? (
            <View style={styles.processingIndicator}>
              <Text style={styles.processingText}>Processing...</Text>
            </View>
          ) : isRecording ? (
            <Square size={24} color="#FFFFFF" fill="#FFFFFF" />
          ) : (
            <Mic size={24} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={styles.instructionText}>
        {isProcessing
          ? 'Processing your voice...'
          : isRecording
          ? 'Tap to stop recording'
          : 'Tap to start voice input'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6B8E23',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordButtonActive: {
    backgroundColor: '#D4A5A5',
  },
  recordButtonDisabled: {
    backgroundColor: '#8B9DC3',
    opacity: 0.6,
  },
  instructionText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4A5A5',
  },
  permissionText: {
    marginLeft: 8,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  processingIndicator: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 10,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});