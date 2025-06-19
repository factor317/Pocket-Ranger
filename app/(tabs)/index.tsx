import React, { useState } from 'react';
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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, ExternalLink, MessageCircle } from 'lucide-react-native';

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
          conversationHistory: conversation.slice(-6), // Keep last 6 messages for context
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

  const openPartnerLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open link');
      }
    } catch (error) {
      console.error('Link error:', error);
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

          {/* AI Response */}
          {aiResponse && (
            <View style={styles.aiResponseContainer}>
              <View style={styles.aiResponseHeader}>
                <MessageCircle size={20} color="#121714" />
                <Text style={styles.aiResponseTitle}>Pocket Ranger Assistant</Text>
                {conversation.length > 2 && (
                  <TouchableOpacity onPress={toggleConversation}>
                    <Text style={styles.conversationToggle}>
                      {showConversation ? 'Hide' : 'Show'} Conversation
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.aiResponseText}>{aiResponse}</Text>
              
              {showConversation && conversation.length > 2 && (
                <View style={styles.conversationContainer}>
                  <Text style={styles.conversationTitle}>Conversation History</Text>
                  {conversation.slice(0, -2).map((message, index) => (
                    <View key={index} style={[
                      styles.conversationMessage,
                      message.role === 'user' ? styles.userMessage : styles.assistantMessage
                    ]}>
                      <Text style={[
                        styles.conversationMessageText,
                        message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
                      ]}>
                        {message.content}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Adventure Recommendation */}
          {recommendation && (
            <View style={styles.recommendationContainer}>
              <View style={styles.recommendationHeader}>
                <MapPin size={24} color="#121714" />
                <View style={styles.recommendationHeaderText}>
                  <Text style={styles.recommendationTitle}>{recommendation.name}</Text>
                  <Text style={styles.recommendationLocation}>{recommendation.city}</Text>
                </View>
              </View>
              
              <Text style={styles.recommendationDescription}>
                {recommendation.description}
              </Text>

              <View style={styles.scheduleContainer}>
                <View style={styles.scheduleHeader}>
                  <Clock size={20} color="#121714" />
                  <Text style={styles.scheduleTitle}>Your Itinerary</Text>
                </View>
                
                {recommendation.schedule.map((item, index) => (
                  <View key={index} style={styles.scheduleItem}>
                    <View style={styles.scheduleTime}>
                      <Text style={styles.scheduleTimeText}>{item.time}</Text>
                    </View>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleActivity}>{item.activity}</Text>
                      <Text style={styles.scheduleLocation}>{item.location}</Text>
                      {item.description && (
                        <Text style={styles.scheduleDescription}>{item.description}</Text>
                      )}
                      {item.partnerLink && (
                        <TouchableOpacity
                          style={styles.partnerLink}
                          onPress={() => openPartnerLink(item.partnerLink!)}
                        >
                          <Text style={styles.partnerLinkText}>
                            View on {item.partnerName}
                          </Text>
                          <ExternalLink size={14} color="#94e0b2" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>

              {/* New Search Button */}
              <TouchableOpacity
                style={styles.newSearchButton}
                onPress={handleNewSearch}
              >
                <Text style={styles.newSearchButtonText}>Plan Another Adventure</Text>
              </TouchableOpacity>
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
  aiResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  aiResponseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121714',
    marginLeft: 8,
    flex: 1,
  },
  conversationToggle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#688273',
    textDecorationLine: 'underline',
  },
  aiResponseText: {
    fontSize: 15,
    color: '#121714',
    lineHeight: 22,
    fontWeight: '400',
  },
  conversationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e8f0ea',
  },
  conversationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#688273',
    marginBottom: 12,
  },
  conversationMessage: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#ffffff',
    alignSelf: 'flex-end',
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e8f0ea',
  },
  assistantMessage: {
    backgroundColor: '#f1f4f2',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  conversationMessageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  userMessageText: {
    color: '#121714',
  },
  assistantMessageText: {
    color: '#121714',
  },
  recommendationContainer: {
    margin: 16,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e8f0ea',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
      },
    }),
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recommendationHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121714',
    lineHeight: 26,
  },
  recommendationLocation: {
    fontSize: 14,
    color: '#688273',
    marginTop: 2,
    fontWeight: '500',
  },
  recommendationDescription: {
    fontSize: 16,
    color: '#121714',
    lineHeight: 24,
    marginBottom: 24,
    fontWeight: '400',
  },
  scheduleContainer: {
    marginTop: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121714',
    marginLeft: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f4f2',
  },
  scheduleTime: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121714',
    backgroundColor: '#f1f4f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textAlign: 'center',
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 16,
  },
  scheduleActivity: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121714',
    marginBottom: 4,
    lineHeight: 22,
  },
  scheduleLocation: {
    fontSize: 14,
    color: '#688273',
    marginBottom: 4,
    fontWeight: '500',
  },
  scheduleDescription: {
    fontSize: 13,
    color: '#688273',
    marginBottom: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  partnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  partnerLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94e0b2',
  },
  newSearchButton: {
    backgroundColor: '#94e0b2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  newSearchButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#121714',
    letterSpacing: 0.15,
  },
});