import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MessageCircle } from 'lucide-react-native';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AiResponseDisplayProps {
  aiResponse: string;
  conversation: ConversationMessage[];
  showConversation: boolean;
  toggleConversation: () => void;
}

export default function AiResponseDisplay({
  aiResponse,
  conversation,
  showConversation,
  toggleConversation,
}: AiResponseDisplayProps) {
  if (!aiResponse) {
    return null;
  }

  return (
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
});