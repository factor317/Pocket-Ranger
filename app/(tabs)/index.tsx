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

  // Reset state when returning to home
  useEffect(() => {
    const resetState = () => {
      setUserInput('');
      setLoading(false);
      setConversation([]);
      setAiResponse('');
      
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

    setLoading(true);
    console.log('🔍 Starting search with input:', inputText);
    
    try {
      // Test health endpoint first
      console.log('🏥 Testing health endpoint...');
      const healthResponse = await fetch('/api/health');
      console.log('🏥 Health response status:', healthResponse.status);
      
      if (!healthResponse.ok) {
        console.error('❌ Health endpoint failed - API routing may be broken');
        throw new Error('API routing is not working properly');
      }
      
      const healthData = await healthResponse.json();
      console.log('✅ Health endpoint working:', healthData);

      // Process with AI for conversation and get recommended file
      console.log('🤖 Calling Groq AI...');
      const aiResponse = await processWithAI(inputText);
      console.log('🤖 AI Response received:', aiResponse);
      
      if (aiResponse.shouldSearch) {
        console.log('🔍 AI recommends searching with file:', aiResponse.recommendedFile);
        
        // Search for adventure recommendations from data source using the recommended file
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
          const errorText = await response.text();
          console.error('❌ pocPlan API error:', response.status, errorText);
          throw new Error(`Failed to fetch recommendation: ${response.status}`);
        }

        const data = await response.json();
        console.log('📋 Adventure data received:', {
          name: data.name,
          city: data.city,
          scheduleItems: data.schedule?.length || 0
        });
        
        // Store the recommendation globally and navigate to itinerary
        global.currentRecommendation = data;
        global.isUnsavedItinerary = true;
        
        console.log('🧭 Navigating to itinerary tab...');
        // Navigate to itinerary tab to show results
        router.push('/itinerary');
      }
      
      // Update conversation with dynamic response based on user input
      const dynamicResponse = generateDynamicResponse(inputText, aiResponse.response, aiResponse.recommendedFile);
      
      const newConversation = [
        ...conversation,
        { role: 'user' as const, content: inputText, timestamp: Date.now() },
        { role: 'assistant' as const, content: dynamicResponse, timestamp: Date.now() + 1 }
      ];
      setConversation(newConversation);
      setAiResponse(dynamicResponse);
      
    } catch (error) {
      console.error('❌ Search error:', error);
      Alert.alert('Error', 'Failed to get recommendation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDynamicResponse = (userInput: string, baseResponse: string, recommendedFile?: string) => {
    // Extract location from recommended file
    let location = '';
    if (recommendedFile) {
      const fileMap: { [key: string]: string } = {
        'avon-colorado.json': 'Avon, Colorado',
        'moab-utah.json': 'Moab, Utah',
        'glacier-montana.json': 'Glacier National Park, Montana',
        'lake-tahoe.json': 'Lake Tahoe, California',
        'sedona-arizona.json': 'Sedona, Arizona',
        'asheville-north-carolina.json': 'Asheville, North Carolina',
        'olympic-washington.json': 'Olympic Peninsula, Washington',
        'acadia-maine.json': 'Acadia National Park, Maine',
        'big-sur-california.json': 'Big Sur, California',
        'great-smoky-mountains.json': 'Great Smoky Mountains, Tennessee'
      };
      location = fileMap[recommendedFile] || '';
    }

    // Extract activity type from user input
    const input = userInput.toLowerCase();
    let activity = '';
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
      console.log('🌐 Making request to /api/groq-chat');
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

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Groq API response error:', response.status, errorText);
        throw new Error(`AI processing failed: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('📄 Raw response:', responseText.substring(0, 200) + '...');

      try {
        const jsonData = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON response');
        return jsonData;
      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError);
        console.error('❌ Response was:', responseText);
        throw new Error('Invalid JSON response from AI service');
      }
    } catch (error) {
      console.error('❌ AI processing error:', error);
      
      // Enhanced fallback logic
      const messageLower = message.toLowerCase();
      let fallbackFile = 'avon-colorado.json';
      
      if (messageLower.includes('utah') || messageLower.includes('moab')) {
        fallbackFile = 'moab-utah.json';
        console.log('🎯 Fallback detected Utah - using moab-utah.json');
      }
      
      return {
        response: "I'd love to help you plan your adventure! Let me search for some great options for you.",
        shouldSearch: true,
        recommendedFile: fallbackFile,
        extractedInfo: {}
      };
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Background Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.backgroundImage}
          />
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          <Text style={styles.title}>Plan your next adventure</Text>
          
          {/* Input Section */}
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

          {/* Action Button - VERIFIED: All text is properly wrapped in Text components */}
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

          {/* AI Response Display */}
          {aiResponse && (
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