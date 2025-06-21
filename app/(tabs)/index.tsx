import React, { useState } from 'react';
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
import AiResponseDisplay from '../../components/AiResponseDisplay';
import RecommendationDisplay from '../../components/RecommendationDisplay';

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

export default function ExploreScreen() {
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState<LocationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showConversation, setShowConversation] = useState(false);

  const handleSearch = async (searchText?: string) => {
    const inputText = searchText || userInput.trim();
    
    if (!inputText) {
      Alert.alert('Input Required', 'Please enter your activity preference');
      return;
    }

    setLoading(true);
    
    try {
      // First, process with Groq AI for conversation
      const aiResponse = await processWithAI(inputText);
      
      if (aiResponse.shouldSearch) {
        // Then search for adventure recommendations
        const response = await fetch('/api/pocPlan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userInput: inputText }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch recommendation');
        }

        const data = await response.json();
        setRecommendation(data);
      }
      
      // Update conversation
      const newConversation = [
        ...conversation,
        { role: 'user' as const, content: inputText, timestamp: Date.now() },
        { role: 'assistant' as const, content: aiResponse.response, timestamp: Date.now() + 1 }
      ];
      setConversation(newConversation);
      setAiResponse(aiResponse.response);
      setShowConversation(true);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendation. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWithAI = async (message: string) => {
    try {
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
        throw new Error('AI processing failed');
      }

      return await response.json();
    } catch (error) {
      console.error('AI processing error:', error);
      return {
        response: "I'd love to help you plan your adventure! Let me search for some great options for you.",
        shouldSearch: true,
        extractedInfo: {}
      };
    }
  };

  const handleNewSearch = () => {
    setRecommendation(null);
    setUserInput('');
    setShowConversation(false);
    setAiResponse('');
  };

  const toggleConversation = () => {
    setShowConversation(!showConversation);
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

          {/* Action Button */}
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

          {/* AI Response Component */}
          <AiResponseDisplay
            aiResponse={aiResponse}
            conversation={conversation}
            showConversation={showConversation}
            toggleConversation={toggleConversation}
          />

          {/* Adventure Recommendation Component */}
          <RecommendationDisplay
            recommendation={recommendation}
            onNewSearch={handleNewSearch}
          />
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
});