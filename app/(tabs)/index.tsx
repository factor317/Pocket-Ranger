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
import VoiceRecorder from '@/components/VoiceRecorder';
import VoiceToggle from '@/components/VoiceToggle';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [aiResponse, setAiResponse] = useState<string>('');
  const [showConversation, setShowConversation] = useState(false);

  const handleSearch = async (searchText?: string) => {
    const inputText = searchText || userInput.trim();
    
    if (!inputText) {
      Alert.alert('Input Required', 'Please enter your activity preference or use voice input');
      return;
    }

    setLoading(true);
    setIsExpanded(false);
    
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
      setIsExpanded(true);
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

  const handleVoiceTranscription = (transcribedText: string) => {
    setUserInput(transcribedText);
    // Automatically search when voice input is complete
    handleSearch(transcribedText);
  };

  const handleVoiceError = (error: string) => {
    Alert.alert('Voice Input Error', error);
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
    setIsExpanded(true);
    setUserInput('');
    setShowConversation(false);
    setAiResponse('');
  };

  const toggleConversation = () => {
    setShowConversation(!showConversation);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header with Background Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2' }}
            style={styles.backgroundImage}
          />
          <View style={styles.headerOverlay}>
            <Text style={styles.title}>Pocket Ranger</Text>
            <Text style={styles.subtitle}>Your voice-powered adventure companion</Text>
          </View>
        </View>

        {/* Search Container */}
        <View style={[
          styles.searchContainer,
          isExpanded ? styles.searchContainerExpanded : styles.searchContainerCollapsed
        ]}>
          {/* Voice/Text Toggle */}
          <VoiceToggle
            isVoiceMode={isVoiceMode}
            onToggle={setIsVoiceMode}
            disabled={loading}
          />

          {isVoiceMode ? (
            /* Voice Input */
            <View style={styles.voiceInputContainer}>
              <VoiceRecorder
                onTranscriptionComplete={handleVoiceTranscription}
                onError={handleVoiceError}
                disabled={loading}
              />
              {userInput ? (
                <View style={styles.transcriptionContainer}>
                  <Text style={styles.transcriptionLabel}>You said:</Text>
                  <Text style={styles.transcriptionText}>{userInput}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            /* Text Input */
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
                placeholder="What's your next adventure? Try: 'I want to go hiking this Saturday, somewhere with a waterfall, not too far from Brookfield'"
                value={userInput}
                onChangeText={setUserInput}
                placeholderTextColor="#8B9DC3"
                multiline={isExpanded}
                numberOfLines={isExpanded ? 6 : 1}
              />
            </View>
          )}
          
          {!isVoiceMode && (
            <TouchableOpacity
              style={[styles.searchButton, loading && styles.searchButtonDisabled]}
              onPress={() => handleSearch()}
              disabled={loading}
            >
              <Text style={styles.searchButtonText}>
                {loading ? 'Planning...' : 'Find Adventure'}
              </Text>
            </TouchableOpacity>
          )}

          {(recommendation || aiResponse) && (
            <TouchableOpacity
              style={styles.newSearchButton}
              onPress={handleNewSearch}
            >
              <Text style={styles.newSearchButtonText}>New Search</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Response */}
        {aiResponse && (
          <View style={styles.aiResponseContainer}>
            <View style={styles.aiResponseHeader}>
              <MessageCircle size={20} color="#6B8E23" />
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
              <MapPin size={24} color="#6B8E23" />
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
                <Clock size={20} color="#6B8E23" />
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
                        <ExternalLink size={14} color="#6B8E23" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2D7',
  },
  scrollView: {
    flex: 1,
  },
  headerContainer: {
    height: 200,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  headerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  searchContainerExpanded: {
    minHeight: 400,
  },
  searchContainerCollapsed: {
    minHeight: 'auto',
  },
  voiceInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BFD3C1',
    alignItems: 'center',
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
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BFD3C1',
    position: 'relative',
  },
  inputContainerExpanded: {
    minHeight: 200,
    alignItems: 'flex-start',
  },
  inputContainerCollapsed: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
  },
  searchIcon: {
    alignSelf: 'flex-start',
    marginTop: 2,
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333333',
  },
  textInputExpanded: {
    position: 'absolute',
    top: 16,
    left: 48,
    right: 16,
    bottom: 16,
    textAlignVertical: 'top',
  },
  textInputCollapsed: {
    flex: 1,
    minHeight: 24,
  },
  searchButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  searchButtonDisabled: {
    backgroundColor: '#8B9DC3',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  newSearchButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6B8E23',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  newSearchButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
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
    alignItems: 'center',
    marginBottom: 12,
  },
  aiResponseTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginLeft: 8,
    flex: 1,
  },
  conversationToggle: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    textDecorationLine: 'underline',
  },
  aiResponseText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    color: '#333333',
    lineHeight: 22,
  },
  conversationContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#BFD3C1',
  },
  conversationTitle: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginBottom: 12,
  },
  conversationMessage: {
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
  },
  userMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#F0F8F0',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  conversationMessageText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
  },
  userMessageText: {
    color: '#333333',
  },
  assistantMessageText: {
    color: '#555555',
  },
  recommendationContainer: {
    margin: 24,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7C9A1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
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
    fontFamily: 'Inter-Bold',
    color: '#333333',
  },
  recommendationLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8B9DC3',
    marginTop: 2,
  },
  recommendationDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    lineHeight: 24,
    marginBottom: 24,
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
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginLeft: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scheduleTime: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  scheduleTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    backgroundColor: '#BFD3C1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scheduleContent: {
    flex: 1,
    marginLeft: 16,
  },
  scheduleActivity: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginBottom: 4,
  },
  scheduleDescription: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#888888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  partnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerLinkText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginRight: 4,
  },
});