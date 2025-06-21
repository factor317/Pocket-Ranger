import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { MapPin, Clock, ExternalLink } from 'lucide-react-native';

interface ScheduleItem {
  time: string;
  activity: string;
  location: string;
  description?: string;
  partnerLink?: string;
  partnerName?: string;
}

interface LocationRecommendation {
  name: string;
  activity: string;
  city: string;
  description: string;
  schedule: ScheduleItem[];
}

interface RecommendationDisplayProps {
  recommendation: LocationRecommendation;
  onNewSearch: () => void;
}

export default function RecommendationDisplay({
  recommendation,
  onNewSearch,
}: RecommendationDisplayProps) {
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

  if (!recommendation) {
    return null;
  }

  return (
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

      <TouchableOpacity
        style={styles.newSearchButton}
        onPress={onNewSearch}
      >
        <Text style={styles.newSearchButtonText}>Plan Another Adventure</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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