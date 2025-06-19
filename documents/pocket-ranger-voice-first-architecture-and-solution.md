# Pocket Ranger Voice-First Architecture and Implementation Plan

## Executive Summary

This document outlines the technical implementation plan for adding voice-first capabilities to the existing Pocket Ranger outdoor adventure planning application. The solution leverages Groq for fast AI inference and BorgCloud for speech-to-text processing, building upon the current React Native/Expo architecture.

## Current Architecture Overview

### Existing System Components
- **Frontend**: React Native with Expo Router (SDK 52.0.30)
- **Backend**: Expo Router API routes with Node.js runtime
- **Data Layer**: JSON-based adventure database with sample queries
- **Current Flow**: Text input → Keyword matching → Adventure recommendation

### Current User Journey
1. User types adventure request in text area
2. System processes input through keyword matching
3. Returns structured adventure itinerary with partner links
4. Displays schedule with AllTrails and OpenTable integrations

## Voice-First Enhancement Architecture

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER (React Native)                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Voice Input    │  │  Text Input     │  │  Voice Output   │ │
│  │  Component      │  │  (Existing)     │  │  Component      │ │
│  │  (New)          │  │                 │  │  (New)          │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ WebSocket/HTTP
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API LAYER (Expo Router)                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  Voice API      │  │  Planning API   │  │  TTS API        │ │
│  │  Route (New)    │  │  (Enhanced)     │  │  Route (New)    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   BorgCloud     │  │      Groq       │  │   ElevenLabs    │ │
│  │   Speech-to-    │  │   AI Inference  │  │   Text-to-      │ │
│  │   Text API      │  │      API        │  │   Speech API    │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Environment Configuration

```typescript
// types/env.d.ts (Enhanced)
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Existing
      EXPO_PUBLIC_API_URL: string;
      
      // New Voice APIs
      GROQ_API_KEY: string;
      BORGCLOUD_API_KEY: string;
      ELEVENLABS_API_KEY: string;
      
      // Voice Configuration
      EXPO_PUBLIC_VOICE_ENABLED: string;
      EXPO_PUBLIC_TTS_VOICE_ID: string;
    }
  }
}
```

#### 1.2 Dependencies Installation

```bash
# Audio recording and playback
npm install expo-av expo-media-library

# Audio processing utilities
npm install @react-native-async-storage/async-storage

# WebSocket for real-time communication
npm install ws @types/ws

# Audio format conversion
npm install react-native-audio-recorder-player
```

#### 1.3 Permissions Setup

```typescript
// hooks/useAudioPermissions.ts
import { Audio } from 'expo-av';
import { useState, useEffect } from 'react';

export function useAudioPermissions() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Permission request failed:', error);
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  };

  return { hasPermission, isLoading, requestPermissions };
}
```

### Phase 2: Voice Input Implementation (Week 2)

#### 2.1 Voice Recording Component

```typescript
// components/VoiceRecorder.tsx
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { Mic, MicOff, Square } from 'lucide-react-native';
import { useAudioPermissions } from '@/hooks/useAudioPermissions';

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export default function VoiceRecorder({ 
  onRecordingComplete, 
  onError, 
  disabled = false 
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const { hasPermission, requestPermissions } = useAudioPermissions();

  const startRecording = async () => {
    if (!hasPermission) {
      await requestPermissions();
      return;
    }

    try {
      // Configure audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and start recording
      const { recording } = await Audio.Recording.createAsync({
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

      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      onError('Failed to start recording. Please check microphone permissions.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    try {
      setIsRecording(false);
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      
      if (uri) {
        onRecordingComplete(uri);
      } else {
        onError('Recording failed to save');
      }

      recordingRef.current = null;
      setRecordingDuration(0);

    } catch (error) {
      console.error('Failed to stop recording:', error);
      onError('Failed to stop recording');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          Microphone access required for voice input
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton} 
          onPress={requestPermissions}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.recordButton,
          isRecording && styles.recordButtonActive,
          disabled && styles.recordButtonDisabled
        ]}
        onPress={isRecording ? stopRecording : startRecording}
        disabled={disabled}
      >
        {isRecording ? (
          <Square size={24} color="#FFFFFF" />
        ) : (
          <Mic size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>
      
      {isRecording && (
        <View style={styles.recordingInfo}>
          <View style={styles.recordingIndicator} />
          <Text style={styles.durationText}>
            {formatDuration(recordingDuration)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
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
    backgroundColor: '#DC2626',
  },
  recordButtonDisabled: {
    backgroundColor: '#8B9DC3',
    opacity: 0.6,
  },
  recordingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  durationText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
  },
  permissionContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  permissionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#856404',
    textAlign: 'center',
    marginBottom: 12,
  },
  permissionButton: {
    backgroundColor: '#6B8E23',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});
```

#### 2.2 Speech-to-Text API Integration

```typescript
// app/api/speech-to-text+api.ts
import { FormData } from 'formdata-node';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert to format expected by BorgCloud
    const borgCloudFormData = new FormData();
    borgCloudFormData.append('audio', audioFile);
    borgCloudFormData.append('model', 'whisper-large-v3');
    borgCloudFormData.append('language', 'en');
    borgCloudFormData.append('response_format', 'json');

    const response = await fetch('https://api.borgcloud.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BORGCLOUD_API_KEY}`,
      },
      body: borgCloudFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('BorgCloud API error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Speech recognition failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    
    return new Response(
      JSON.stringify({ 
        text: result.text,
        confidence: result.confidence || 1.0,
        duration: result.duration || 0
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Speech-to-text error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
```

### Phase 3: Enhanced AI Processing (Week 3)

#### 3.1 Groq Integration for Adventure Planning

```typescript
// app/api/voice-plan+api.ts
export async function POST(request: Request) {
  try {
    const { text, conversationHistory = [] } = await request.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid text input provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Load available adventures for context
    const sampleQueriesPath = path.join(process.cwd(), 'data', 'sample-queries.json');
    const sampleQueries = JSON.parse(fs.readFileSync(sampleQueriesPath, 'utf8'));
    
    const availableDestinations = sampleQueries.queries.map(q => ({
      location: q.adventure_file.replace('.json', '').replace('-', ' '),
      description: q.query
    }));

    // Enhanced prompt for Groq
    const systemPrompt = `You are an expert outdoor adventure planner for Pocket Ranger. Your role is to:

1. UNDERSTAND user requests for outdoor adventures and activities
2. MATCH requests to available destinations and create detailed itineraries
3. RESPOND in a structured JSON format that includes adventure recommendations

Available destinations and their specialties:
${availableDestinations.map(d => `- ${d.location}: ${d.description}`).join('\n')}

For each user request, analyze:
- Desired activities (hiking, sightseeing, dining, etc.)
- Location preferences or specific destinations mentioned
- Duration and intensity preferences
- Special interests (breweries, wildlife, photography, etc.)

ALWAYS respond with a JSON object containing:
{
  "understanding": "Brief summary of what the user wants",
  "recommendation": {
    "destination": "best matching destination from available options",
    "reasoning": "why this destination fits their request",
    "confidence": 0.0-1.0
  },
  "followUpQuestions": ["optional clarifying questions if needed"],
  "conversationalResponse": "Natural, enthusiastic response about the recommendation"
}

If the request is unclear or doesn't match available destinations well, ask clarifying questions.`;

    const userMessage = conversationHistory.length > 0 
      ? `Previous conversation: ${JSON.stringify(conversationHistory.slice(-3))}\n\nNew request: ${text}`
      : text;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      throw new Error('AI processing failed');
    }

    const result = await response.json();
    const aiResponse = JSON.parse(result.choices[0].message.content);

    // If we have a good destination match, load the adventure data
    let adventureData = null;
    if (aiResponse.recommendation?.confidence > 0.7) {
      const destinationFile = aiResponse.recommendation.destination
        .toLowerCase()
        .replace(/\s+/g, '-') + '.json';
      
      try {
        const adventurePath = path.join(process.cwd(), 'data', 'adventures', destinationFile);
        adventureData = JSON.parse(fs.readFileSync(adventurePath, 'utf8'));
      } catch (error) {
        console.log(`Adventure file not found: ${destinationFile}`);
      }
    }

    return new Response(
      JSON.stringify({
        aiResponse,
        adventureData,
        needsMoreInfo: !adventureData || aiResponse.recommendation?.confidence < 0.7
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Voice planning error:', error);
    return new Response(
      JSON.stringify({ error: 'AI processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Phase 4: Text-to-Speech Implementation (Week 4)

#### 4.1 TTS API Route

```typescript
// app/api/text-to-speech+api.ts
export async function POST(request: Request) {
  try {
    const { text, voiceId = process.env.EXPO_PUBLIC_TTS_VOICE_ID || 'rachel' } = await request.json();

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'No text provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('TTS generation failed');
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return new Response(
      JSON.stringify({ 
        audioData: base64Audio,
        mimeType: 'audio/mpeg'
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: 'Text-to-speech generation failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

#### 4.2 Audio Playback Component

```typescript
// components/VoicePlayer.tsx
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause, Volume2 } from 'lucide-react-native';

interface VoicePlayerProps {
  text: string;
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackEnd?: () => void;
}

export default function VoicePlayer({ 
  text, 
  autoPlay = false,
  onPlaybackStart,
  onPlaybackEnd 
}: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const generateAndPlayAudio = async () => {
    if (isPlaying) {
      await stopPlayback();
      return;
    }

    setIsLoading(true);
    
    try {
      // Generate TTS audio
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('TTS generation failed');
      }

      const { audioData, mimeType } = await response.json();
      
      // Create audio URI from base64 data
      const audioUri = `data:${mimeType};base64,${audioData}`;

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );

      soundRef.current = sound;
      setIsPlaying(true);
      onPlaybackStart?.();

      // Set up playback status listener
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          onPlaybackEnd?.();
        }
      });

    } catch (error) {
      console.error('Audio playback error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopPlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    onPlaybackEnd?.();
  };

  React.useEffect(() => {
    if (autoPlay && text) {
      generateAndPlayAudio();
    }

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [text, autoPlay]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, isLoading && styles.playButtonDisabled]}
        onPress={generateAndPlayAudio}
        disabled={isLoading}
      >
        {isLoading ? (
          <Volume2 size={20} color="#FFFFFF" />
        ) : isPlaying ? (
          <Pause size={20} color="#FFFFFF" />
        ) : (
          <Play size={20} color="#FFFFFF" />
        )}
      </TouchableOpacity>
      
      <Text style={styles.statusText}>
        {isLoading ? 'Generating...' : isPlaying ? 'Playing' : 'Tap to hear'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6B8E23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonDisabled: {
    backgroundColor: '#8B9DC3',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
});
```

### Phase 5: UI Integration (Week 5)

#### 5.1 Enhanced Explore Screen with Voice

```typescript
// app/(tabs)/index.tsx (Voice Integration)
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, ExternalLink, Mic } from 'lucide-react-native';
import VoiceRecorder from '@/components/VoiceRecorder';
import VoicePlayer from '@/components/VoicePlayer';

// ... existing interfaces ...

export default function ExploreScreen() {
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState<LocationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  const handleVoiceRecording = async (audioUri: string) => {
    setIsProcessingVoice(true);
    
    try {
      // Convert audio to text
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/wav',
        name: 'recording.wav',
      } as any);

      const sttResponse = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!sttResponse.ok) {
        throw new Error('Speech recognition failed');
      }

      const { text } = await sttResponse.json();
      setUserInput(text);

      // Process with AI
      await handleVoiceSearch(text);

    } catch (error) {
      console.error('Voice processing error:', error);
      Alert.alert('Error', 'Failed to process voice input. Please try again.');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  const handleVoiceSearch = async (text: string) => {
    setLoading(true);
    setIsExpanded(false);

    try {
      const response = await fetch('/api/voice-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text, 
          conversationHistory 
        }),
      });

      if (!response.ok) {
        throw new Error('AI processing failed');
      }

      const data = await response.json();
      setAiResponse(data.aiResponse);
      
      if (data.adventureData) {
        setRecommendation(data.adventureData);
      }

      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: data.aiResponse.conversationalResponse }
      ]);

    } catch (error) {
      console.error('Voice search error:', error);
      Alert.alert('Error', 'Failed to process your request. Please try again.');
      setIsExpanded(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!userInput.trim()) {
      Alert.alert('Input Required', 'Please enter your activity preference');
      return;
    }

    if (inputMode === 'voice') {
      await handleVoiceSearch(userInput.trim());
    } else {
      // Existing text search logic
      setLoading(true);
      setIsExpanded(false);
      
      try {
        const response = await fetch('/api/pocPlan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userInput: userInput.trim() }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendation');
        }

        const data = await response.json();
        setRecommendation(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to get recommendation. Please try again.');
        setIsExpanded(true);
      } finally {
        setLoading(false);
      }
    }
  };

  // ... existing methods ...

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Existing header */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.backgroundImage}
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.title}>Pocket Ranger</Text>
            <Text style={styles.subtitle}>Your outdoor adventure companion</Text>
          </View>
        </View>

        {/* Enhanced Search Container with Voice */}
        <View style={[
          styles.searchContainer,
          isExpanded ? styles.searchContainerExpanded : styles.searchContainerCollapsed
        ]}>
          {/* Input Mode Toggle */}
          <View style={styles.inputModeToggle}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                inputMode === 'text' && styles.modeButtonActive
              ]}
              onPress={() => setInputMode('text')}
            >
              <Search size={16} color={inputMode === 'text' ? '#FFFFFF' : '#6B8E23'} />
              <Text style={[
                styles.modeButtonText,
                inputMode === 'text' && styles.modeButtonTextActive
              ]}>Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                inputMode === 'voice' && styles.modeButtonActive
              ]}
              onPress={() => setInputMode('voice')}
            >
              <Mic size={16} color={inputMode === 'voice' ? '#FFFFFF' : '#6B8E23'} />
              <Text style={[
                styles.modeButtonText,
                inputMode === 'voice' && styles.modeButtonTextActive
              ]}>Voice</Text>
            </TouchableOpacity>
          </View>

          {/* Input Area */}
          {inputMode === 'text' ? (
            <View style={[
              styles.inputContainer,
              isExpanded ? styles.inputContainerExpanded : styles.inputContainerCollapsed
            ]}>
              <Search size={20} color="#6B8E23" style={styles.searchIcon} />
              <TextInput
                style={[
                  styles.textInput,
                  isExpanded ? styles.textInputExpanded : styles.textInputCollapsed
                ]}
                placeholder="What's your next adventure? (e.g., hiking for 3 days near Avon Colorado...)"
                value={userInput}
                onChangeText={setUserInput}
                placeholderTextColor="#8B9DC3"
                multiline={isExpanded}
                numberOfLines={isExpanded ? 8 : 1}
              />
            </View>
          ) : (
            <View style={styles.voiceInputContainer}>
              <VoiceRecorder
                onRecordingComplete={handleVoiceRecording}
                onError={(error) => Alert.alert('Recording Error', error)}
                disabled={isProcessingVoice || loading}
              />
              {userInput && (
                <View style={styles.transcriptionContainer}>
                  <Text style={styles.transcriptionLabel}>You said:</Text>
                  <Text style={styles.transcriptionText}>{userInput}</Text>
                </View>
              )}
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.searchButton, (loading || isProcessingVoice) && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading || isProcessingVoice}
          >
            <Text style={styles.searchButtonText}>
              {isProcessingVoice ? 'Processing Voice...' : loading ? 'Planning...' : 'Find Adventure'}
            </Text>
          </TouchableOpacity>

          {recommendation && (
            <TouchableOpacity
              style={styles.newSearchButton}
              onPress={handleNewSearch}
            >
              <Text style={styles.newSearchButtonText}>New Search</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Response Section */}
        {aiResponse && (
          <View style={styles.aiResponseContainer}>
            <View style={styles.aiResponseHeader}>
              <Text style={styles.aiResponseTitle}>AI Assistant</Text>
              <VoicePlayer 
                text={aiResponse.conversationalResponse}
                autoPlay={true}
              />
            </View>
            <Text style={styles.aiResponseText}>
              {aiResponse.conversationalResponse}
            </Text>
            
            {aiResponse.followUpQuestions && aiResponse.followUpQuestions.length > 0 && (
              <View style={styles.followUpContainer}>
                <Text style={styles.followUpTitle}>Need more details?</Text>
                {aiResponse.followUpQuestions.map((question: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.followUpButton}
                    onPress={() => setUserInput(question)}
                  >
                    <Text style={styles.followUpButtonText}>{question}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Existing recommendation display */}
        {recommendation && (
          <View style={styles.recommendationContainer}>
            {/* ... existing recommendation UI ... */}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Enhanced styles
const styles = StyleSheet.create({
  // ... existing styles ...
  
  inputModeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  modeButtonActive: {
    backgroundColor: '#6B8E23',
  },
  modeButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
  },
  modeButtonTextActive: {
    color: '#FFFFFF',
  },
  voiceInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BFD3C1',
    alignItems: 'center',
    minHeight: 120,
  },
  transcriptionContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginBottom: 4,
  },
  transcriptionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333333',
    lineHeight: 20,
  },
  aiResponseContainer: {
    margin: 24,
    marginTop: 0,
    backgroundColor: '#E8F5E8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFD3C1',
  },
  aiResponseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiResponseTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
  },
  aiResponseText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#333333',
    lineHeight: 20,
  },
  followUpContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#BFD3C1',
  },
  followUpTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginBottom: 8,
  },
  followUpButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#BFD3C1',
  },
  followUpButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#333333',
  },
});
```

## Data Flow Architecture

### Voice-First User Journey

```
1. User Intent
   ↓
2. Voice Recording (expo-av)
   ↓
3. Audio Upload → BorgCloud STT API
   ↓
4. Text Transcription
   ↓
5. AI Processing → Groq API (Llama 3.1)
   ↓
6. Intent Understanding + Adventure Matching
   ↓
7. Response Generation
   ↓
8. Text-to-Speech → ElevenLabs API
   ↓
9. Audio Playback + Visual Display
   ↓
10. User Interaction (Follow-up questions, Adventure details)
```

### Conversation State Management

```typescript
// hooks/useConversationState.ts
import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  audioUri?: string;
}

export function useConversationState() {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useCallback((message: Omit<ConversationMessage, 'timestamp'>) => {
    const newMessage: ConversationMessage = {
      ...message,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Persist to storage
    AsyncStorage.setItem('conversation_history', JSON.stringify([...messages, newMessage]));
  }, [messages]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    AsyncStorage.removeItem('conversation_history');
  }, []);

  const loadConversation = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('conversation_history');
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
    }
  }, []);

  return {
    messages,
    addMessage,
    clearConversation,
    loadConversation,
    isLoading,
    setIsLoading,
  };
}
```

## Error Handling Strategy

### 1. Network Resilience

```typescript
// utils/apiWithRetry.ts
export async function apiWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries = 3
): Promise<Response> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        timeout: 30000, // 30 second timeout
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }
      
      throw new Error(`Server error: ${response.status}`);
      
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
```

### 2. Graceful Degradation

```typescript
// components/VoiceInterface.tsx
export default function VoiceInterface() {
  const [fallbackMode, setFallbackMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    setErrorMessage(error);
    
    // Auto-fallback to text mode after voice failures
    setTimeout(() => {
      setFallbackMode(true);
      setErrorMessage(null);
    }, 3000);
  };

  if (fallbackMode) {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackText}>
          Voice features temporarily unavailable. Using text mode.
        </Text>
        <TextInput 
          placeholder="Type your adventure request..."
          style={styles.fallbackInput}
        />
      </View>
    );
  }

  return (
    <View>
      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
      <VoiceRecorder onError={handleVoiceError} />
    </View>
  );
}
```

## Performance Optimization

### 1. Audio Compression

```typescript
// utils/audioOptimization.ts
export const optimizeAudioForUpload = async (audioUri: string): Promise<string> => {
  // Compress audio to reduce upload time and API costs
  const compressedUri = await Audio.compressAsync(audioUri, {
    quality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_MEDIUM,
    bitRate: 64000, // Reduce bitrate for faster upload
    sampleRate: 16000, // Standard for speech recognition
  });
  
  return compressedUri;
};
```

### 2. Response Caching

```typescript
// utils/responseCache.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry {
  response: any;
  timestamp: number;
  ttl: number;
}

export class ResponseCache {
  private static instance: ResponseCache;
  private cache = new Map<string, CacheEntry>();

  static getInstance(): ResponseCache {
    if (!ResponseCache.instance) {
      ResponseCache.instance = new ResponseCache();
    }
    return ResponseCache.instance;
  }

  async get(key: string): Promise<any | null> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      // Try to load from persistent storage
      try {
        const stored = await AsyncStorage.getItem(`cache_${key}`);
        if (stored) {
          const parsedEntry: CacheEntry = JSON.parse(stored);
          if (Date.now() - parsedEntry.timestamp < parsedEntry.ttl) {
            this.cache.set(key, parsedEntry);
            return parsedEntry.response;
          }
        }
      } catch (error) {
        console.error('Cache read error:', error);
      }
      return null;
    }

    // Check if entry is still valid
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      AsyncStorage.removeItem(`cache_${key}`);
      return null;
    }

    return entry.response;
  }

  async set(key: string, response: any, ttlMs = 300000): Promise<void> {
    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: ttlMs,
    };

    this.cache.set(key, entry);
    
    // Persist to storage
    try {
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  }
}
```

## Testing Strategy

### 1. Voice Component Testing

```typescript
// __tests__/components/VoiceRecorder.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import VoiceRecorder from '@/components/VoiceRecorder';
import { Audio } from 'expo-av';

// Mock expo-av
jest.mock('expo-av', () => ({
  Audio: {
    requestPermissionsAsync: jest.fn(),
    setAudioModeAsync: jest.fn(),
    Recording: {
      createAsync: jest.fn(),
    },
  },
}));

describe('VoiceRecorder', () => {
  const mockOnRecordingComplete = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Audio.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: 'granted' });
  });

  test('requests permissions on mount', async () => {
    render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        onError={mockOnError}
      />
    );

    await waitFor(() => {
      expect(Audio.requestPermissionsAsync).toHaveBeenCalled();
    });
  });

  test('starts recording when button pressed', async () => {
    const mockRecording = {
      stopAndUnloadAsync: jest.fn(),
      getURI: jest.fn().mockReturnValue('mock-uri'),
    };

    (Audio.Recording.createAsync as jest.Mock).mockResolvedValue({
      recording: mockRecording,
    });

    const { getByRole } = render(
      <VoiceRecorder 
        onRecordingComplete={mockOnRecordingComplete}
        onError={mockOnError}
      />
    );

    const recordButton = getByRole('button');
    fireEvent.press(recordButton);

    await waitFor(() => {
      expect(Audio.Recording.createAsync).toHaveBeenCalled();
    });
  });
});
```

### 2. API Integration Testing

```typescript
// __tests__/api/voice-integration.test.ts
import { POST as speechToText } from '@/app/api/speech-to-text+api';
import { POST as voicePlan } from '@/app/api/voice-plan+api';

describe('Voice API Integration', () => {
  test('speech-to-text processes audio correctly', async () => {
    const mockAudioFile = new File(['mock audio data'], 'test.wav', {
      type: 'audio/wav',
    });

    const formData = new FormData();
    formData.append('audio', mockAudioFile);

    const request = new Request('http://localhost:3000/api/speech-to-text', {
      method: 'POST',
      body: formData,
    });

    // Mock BorgCloud response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        text: 'hiking in Colorado',
        confidence: 0.95,
      }),
    });

    const response = await speechToText(request);
    const result = await response.json();

    expect(result.text).toBe('hiking in Colorado');
    expect(result.confidence).toBe(0.95);
  });

  test('voice-plan generates appropriate responses', async () => {
    const request = new Request('http://localhost:3000/api/voice-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I want to go hiking in Colorado for 3 days',
        conversationHistory: [],
      }),
    });

    // Mock Groq response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{
          message: {
            content: JSON.stringify({
              understanding: 'User wants 3-day hiking trip in Colorado',
              recommendation: {
                destination: 'avon-colorado',
                confidence: 0.9,
              },
              conversationalResponse: 'Great choice! Colorado has amazing hiking...',
            }),
          },
        }],
      }),
    });

    const response = await voicePlan(request);
    const result = await response.json();

    expect(result.aiResponse.understanding).toContain('Colorado');
    expect(result.aiResponse.recommendation.confidence).toBeGreaterThan(0.8);
  });
});
```

## Success Metrics

### Technical Metrics

1. **Voice Recognition Accuracy**
   - Target: >95% accuracy for clear speech
   - Measurement: Compare transcription to expected text

2. **Response Latency**
   - Speech-to-Text: <3 seconds
   - AI Processing: <5 seconds
   - Text-to-Speech: <2 seconds
   - Total round-trip: <10 seconds

3. **System Reliability**
   - API uptime: >99.5%
   - Error rate: <2%
   - Graceful degradation: 100% fallback to text mode

### User Experience Metrics

1. **Voice Interaction Success Rate**
   - Target: >90% of voice interactions result in useful adventure recommendations
   - Measurement: User completion of voice-to-recommendation flow

2. **User Preference**
   - Target: >60% of users prefer voice input over text for adventure planning
   - Measurement: Usage analytics and user surveys

3. **Conversation Quality**
   - Target: Average conversation length >3 exchanges
   - Measurement: Track multi-turn conversations

## Cost Analysis

### Monthly API Usage Estimates (1,000 active users)

#### BorgCloud Speech-to-Text
- Average recording: 30 seconds
- 3 recordings per user per session
- 2 sessions per user per month
- Total: 6,000 recordings × 30 seconds = 50 hours
- **Cost: ~$150/month** (estimated at $3/hour)

#### Groq AI Processing
- Average request: 200 tokens input, 300 tokens output
- 6,000 requests per month
- Total: 3M tokens
- **Cost: ~$30/month** (estimated at $0.01/1K tokens)

#### ElevenLabs Text-to-Speech
- Average response: 100 characters
- 6,000 responses per month
- Total: 600K characters
- **Cost: ~$60/month** (estimated at $0.10/1K characters)

#### Total Monthly Cost: ~$240

### Cost Optimization Strategies

1. **Audio Compression**: Reduce STT costs by 30-40%
2. **Response Caching**: Reduce AI processing costs by 20-30%
3. **Selective TTS**: Only generate audio for final responses
4. **Usage Analytics**: Monitor and optimize based on actual usage patterns

## Security Considerations

### 1. API Key Management

```typescript
// utils/secureConfig.ts
export const getSecureConfig = () => {
  const requiredKeys = [
    'GROQ_API_KEY',
    'BORGCLOUD_API_KEY',
    'ELEVENLABS_API_KEY',
  ];

  const config: Record<string, string> = {};
  
  for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    config[key] = value;
  }

  return config;
};
```

### 2. Audio Data Privacy

```typescript
// utils/audioSecurity.ts
export const secureAudioUpload = async (audioUri: string): Promise<string> => {
  // Encrypt audio data before upload
  const audioData = await FileSystem.readAsStringAsync(audioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // Add timestamp and hash for integrity
  const timestamp = Date.now();
  const hash = await crypto.subtle.digest('SHA-256', 
    new TextEncoder().encode(audioData + timestamp)
  );

  return JSON.stringify({
    data: audioData,
    timestamp,
    hash: Array.from(new Uint8Array(hash)),
  });
};
```

### 3. Rate Limiting

```typescript
// middleware/rateLimiter.ts
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(clientId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now();
  const clientData = rateLimiter.get(clientId);

  if (!clientData || now > clientData.resetTime) {
    rateLimiter.set(clientId, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (clientData.count >= maxRequests) {
    return false;
  }

  clientData.count++;
  return true;
}
```

## Deployment Considerations

### Environment Variables Setup

```bash
# .env.production
GROQ_API_KEY=your_groq_api_key_here
BORGCLOUD_API_KEY=your_borgcloud_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
EXPO_PUBLIC_VOICE_ENABLED=true
EXPO_PUBLIC_TTS_VOICE_ID=rachel
```

### Platform-Specific Considerations

#### Web Platform
- Use Web Audio API for recording
- Implement WebRTC for real-time audio processing
- Add browser compatibility checks

#### Mobile Platform
- Request microphone permissions
- Handle background audio processing
- Optimize for battery usage

### Monitoring and Analytics

```typescript
// utils/voiceAnalytics.ts
export const trackVoiceInteraction = (event: string, data: any) => {
  // Track voice usage patterns
  console.log(`Voice Event: ${event}`, data);
  
  // Send to analytics service
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', event, {
      event_category: 'voice_interaction',
      ...data,
    });
  }
};
```

## Next Steps

### Immediate Implementation (Week 1-2)
1. Set up API keys and environment configuration
2. Implement basic voice recording component
3. Integrate BorgCloud speech-to-text API
4. Test audio recording and transcription flow

### Core Features (Week 3-4)
1. Integrate Groq AI for intelligent processing
2. Implement conversation state management
3. Add text-to-speech with ElevenLabs
4. Create enhanced UI with voice/text toggle

### Polish and Optimization (Week 5-6)
1. Add error handling and fallback mechanisms
2. Implement caching and performance optimizations
3. Add comprehensive testing suite
4. Deploy and monitor initial usage

### Future Enhancements
1. Multi-language support
2. Voice command shortcuts
3. Offline voice processing
4. Advanced conversation memory
5. Voice-based adventure booking integration

This implementation plan provides a comprehensive roadmap for adding voice-first capabilities to the existing Pocket Ranger application, leveraging modern AI services while maintaining the app's core functionality and user experience.