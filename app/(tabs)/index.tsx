import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Bug } from 'lucide-react-native';

interface LocationRecommendation {
  name: string;
  activity: string;
  city: string;
  description: string;
  schedule: ScheduleItem[];
}

interface ScheduleItem {
  time: string;
  activity: string;
  location: string;
  description?: string;
  partnerLink?: string;
  partnerName?: string;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export default function HomeScreen() {
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showConversation, setShowConversation] = useState(false);

  // Reset state when returning to home
  useEffect(() => {
    const resetState = () => {
      setUserInput('');
      setLoading(false);
      setConversation([]);
      setAiResponse('');
      setShowConversation(false);
      
      // Clear global state
      global.currentRecommendation = null;
      global.isUnsavedItinerary = false;
    };

    // Reset on component mount
    resetState();
  }, []);

  const handleSearch = async (searchText?: string) => {
    const inputText = searchText || userInput.trim();
    
    if (!inputText) {
      Alert.alert('Input Required', 'Please enter your activity preference');
      return;
    }

    console.log('🚀 HOME: Starting search for:', inputText);
    setLoading(true);
    
    try {
      // Process with AI for conversation
      console.log('🤖 HOME: Calling Groq Chat API...');
      const aiResponse = await processWithAI(inputText);
      
      console.log('📋 HOME: AI Response received:', {
        shouldSearch: aiResponse.shouldSearch,
        recommendedFile: aiResponse.recommendedFile,
        response: aiResponse.response?.substring(0, 100) + '...'
      });
      
      if (aiResponse.shouldSearch) {
        // Search for adventure recommendations from data source
        console.log('🎯 HOME: Calling POC Plan API with recommended file:', aiResponse.recommendedFile);
        
        const response = await fetch('/api/pocPlan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            userInput: inputText,
            recommendedFile: aiResponse.recommendedFile
          }),
        });

        if (!response.ok) {
          throw new Error(`POC Plan API failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('✅ HOME: POC Plan API response received:', {
          name: data.name,
          city: data.city,
          scheduleLength: data.schedule?.length || 0
        });
        
        // Store the recommendation globally and navigate to itinerary
        global.currentRecommendation = data;
        global.isUnsavedItinerary = true;
        
        console.log('🎯 HOME: Navigating to itinerary tab...');
        // Navigate to itinerary tab to show results
        router.push('/itinerary');
      }
      
      // Update conversation with dynamic response based on user input
      const dynamicResponse = generateDynamicResponse(inputText, aiResponse.response);
      
      const newConversation = [
        ...conversation,
        { role: 'user' as const, content: inputText, timestamp: Date.now() },
        { role: 'assistant' as const, content: dynamicResponse, timestamp: Date.now() + 1 }
      ];
      setConversation(newConversation);
      
      // Validate AI response before setting it
      if (typeof dynamicResponse === 'string' && dynamicResponse.trim()) {
        setAiResponse(dynamicResponse);
        setShowConversation(true);
      } else {
        console.warn('⚠️ HOME: Invalid AI response received, not displaying');
        setAiResponse('');
      }
      
    } catch (error) {
      console.error('❌ HOME: Search error:', error);
      Alert.alert('Error', 'Failed to get recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDynamicResponse = (userInput: string, baseResponse: string) => {
    // Validate input parameters
    if (!userInput || typeof userInput !== 'string') {
      return 'I\'d love to help you plan your adventure! Please provide more details about what you\'re looking for.';
    }

    // Use base response if it's valid, otherwise generate fallback
    if (baseResponse && typeof baseResponse === 'string' && baseResponse.trim()) {
      return baseResponse.trim();
    }

    // Extract location and activity from user input
    const input = userInput.toLowerCase();
    let location = '';
    let activity = '';
    
    // Extract location mentions
    if (input.includes('avon') || input.includes('colorado')) {
      location = 'Avon, Colorado';
    } else if (input.includes('madison')) {
      location = 'Madison area';
    } else if (input.includes('milwaukee')) {
      location = 'Milwaukee';
    } else if (input.includes('moab') || input.includes('utah')) {
      location = 'Moab, Utah';
    } else if (input.includes('glacier') || input.includes('montana')) {
      location = 'Glacier National Park';
    } else if (input.includes('tahoe') || input.includes('california')) {
      location = 'Lake Tahoe';
    } else if (input.includes('sedona') || input.includes('arizona')) {
      location = 'Sedona, Arizona';
    } else if (input.includes('asheville') || input.includes('north carolina')) {
      location = 'Asheville, North Carolina';
    }
    
    // Extract activity type
    if (input.includes('hik')) {
      activity = 'hiking';
    } else if (input.includes('fish')) {
      activity = 'fishing';
    } else if (input.includes('explor')) {
      activity = 'exploration';
    } else if (input.includes('camp')) {
      activity = 'camping';
    } else if (input.includes('climb')) {
      activity = 'climbing';
    }

    // Generate contextual response
    let contextualResponse = 'Perfect! I\'ve found some amazing';
    if (activity) {
      contextualResponse += ` ${activity} opportunities`;
    } else {
      contextualResponse += ' outdoor adventures';
    }
    
    if (location) {
      contextualResponse += ` in ${location}`;
    }
    
    contextualResponse += '. I\'ve created a detailed itinerary for you with scheduled activities and partner recommendations. ';
    contextualResponse += 'Tap on the Itinerary tab to view your personalized adventure plan!';
    
    return contextualResponse;
  };

  const processWithAI = async (message: string) => {
    try {
      console.log('🤖 HOME: Processing with AI:', message);
      
      const response = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversation.slice(-6),
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq Chat API failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ HOME: AI processing completed successfully');
      return result;
    } catch (error) {
      console.error('❌ HOME: AI processing error:', error);
      return {
        response: "I'd love to help you plan your adventure! Let me search for some great options for you.",
        shouldSearch: true,
        extractedInfo: {}
      };
    }
  };

  const toggleConversation = () => {
    setShowConversation(!showConversation);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.backgroundImage}
          />
          
          <TouchableOpacity
            style={styles.debugButton}
            onPress={() => router.push('/debug-adventures')}
          >
            <Bug size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.title}>Plan your next adventure</Text>
          
          <View style={styles.inputSection}>
            <TextInput
              style={styles.textArea}
              placeholder="What do you want to do?"
              placeholderTextColor="#688273"
              value={userInput}
              onChangeText={setUserInput}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.planButton]}
              onPress={() => handleSearch()}
              disabled={loading || !userInput.trim()}
            >
              <Text style={styles.planButtonText}>
                {loading ? 'Planning...' : 'Plan'}
              </Text>
            </TouchableOpacity>
          </View>

          {aiResponse && typeof aiResponse === 'string' && aiResponse.trim() && (
            <View style={styles.aiResponseContainer}>
              <Text style={styles.aiResponseText}>{aiResponse}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 320,
    position: 'relative',
    marginHorizontal: Platform.OS === 'web' ? 16 : 0,
    marginTop: Platform.OS === 'web' ? 12 : 0,
    borderRadius: Platform.OS === 'web' ? 12 : 0,
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  debugButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#121714',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    letterSpacing: -0.5,
  },
  inputSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  textArea: {
    backgroundColor: '#f1f4f2',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#121714',
    minHeight: 144,
    fontWeight: '400',
    lineHeight: 22,
    borderWidth: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    minWidth: 84,
    height: 40,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  planButton: {
    backgroundColor: '#94e0b2',
  },
  planButtonText: {
    color: '#121714',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.15,
  },
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