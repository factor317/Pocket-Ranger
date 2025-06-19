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

  const getRecordingOptions = () => {
    if (Platform.OS === 'web') {
      return {
        web: {
          mimeType: 'audio/webm;codecs=opus',
          bitsPerSecond: 128000,
        },
      };
    } else {
      return {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
      };
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
      await recording.prepareToRecordAsync(getRecordingOptions());

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

      // Send to transcription service
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
        resolve(base64.split(',')[1]); // Remove data URL prefix
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
          format: Platform.OS === 'web' ? 'webm' : 'm4a',
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
          <MicOff size={24} color="#688273" />
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
            <Square size={24} color="#ffffff" fill="#ffffff" />
          ) : (
            <Mic size={24} color="#ffffff" />
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
    backgroundColor: '#94e0b2',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  recordButtonActive: {
    backgroundColor: '#f87171',
  },
  recordButtonDisabled: {
    backgroundColor: '#d1d5db',
    opacity: 0.6,
  },
  instructionText: {
    marginTop: 12,
    fontSize: 14,
    color: '#688273',
    textAlign: 'center',
    fontWeight: '500',
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f1f4f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e8f0ea',
  },
  permissionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#688273',
    fontWeight: '500',
  },
  processingIndicator: {
    alignItems: 'center',
  },
  processingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
});