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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, Clock, ExternalLink } from 'lucide-react-native';

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
  partnerLink?: string;
  partnerName?: string;
}

export default function ExploreScreen() {
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState<LocationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!userInput.trim()) {
      Alert.alert('Input Required', 'Please enter your activity preference');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/pocPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userInput: userInput.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation');
      }

      const data = await response.json();
      setRecommendation(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to get recommendation. Please try again.');
      console.error('Search error:', error);
    } finally {
      setLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Pocket Ranger</Text>
          <Text style={styles.subtitle}>Your outdoor adventure companion</Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <Search size={20} color="#6B8E23" style={styles.searchIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="What's your next adventure? (e.g., hiking near Madison)"
              value={userInput}
              onChangeText={setUserInput}
              placeholderTextColor="#8B9DC3"
              multiline
            />
          </View>
          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}
          >
            <Text style={styles.searchButtonText}>
              {loading ? 'Planning...' : 'Find Adventure'}
            </Text>
          </TouchableOpacity>
        </View>

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
  header: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#6B8E23',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8B9DC3',
    textAlign: 'center',
  },
  searchContainer: {
    padding: 24,
    paddingTop: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#BFD3C1',
  },
  searchIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#333333',
    minHeight: 24,
  },
  searchButton: {
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#8B9DC3',
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  recommendationContainer: {
    margin: 24,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E7C9A1',
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
    marginBottom: 8,
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