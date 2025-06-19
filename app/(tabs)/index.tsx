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
  description?: string;
  partnerLink?: string;
  partnerName?: string;
}

export default function ExploreScreen() {
  const [userInput, setUserInput] = useState('');
  const [recommendation, setRecommendation] = useState<LocationRecommendation | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleSearch = async () => {
    if (!userInput.trim()) {
      Alert.alert('Input Required', 'Please enter your activity preference');
      return;
    }

    setLoading(true);
    setIsExpanded(false); // Collapse the input area
    
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
      setIsExpanded(true); // Re-expand on error
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

  const handleNewSearch = () => {
    setRecommendation(null);
    setIsExpanded(true);
    setUserInput('');
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
            <Text style={styles.subtitle}>Your outdoor adventure companion</Text>
          </View>
        </View>

        {/* Search Container */}
        <View style={[
          styles.searchContainer,
          isExpanded ? styles.searchContainerExpanded : styles.searchContainerCollapsed
        ]}>
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
              placeholder="What's your next adventure? (e.g., hiking for 3 days near Avon Colorado, suggest hikes under 6 miles and at least one under 2. suggest breweries for 1 night, a place with bison burgers and a tourist must see attraction and build the itinerary)"
              value={userInput}
              onChangeText={setUserInput}
              placeholderTextColor="#8B9DC3"
              multiline={isExpanded}
              numberOfLines={isExpanded ? 8 : 1}
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

          {recommendation && (
            <TouchableOpacity
              style={styles.newSearchButton}
              onPress={handleNewSearch}
            >
              <Text style={styles.newSearchButtonText}>New Search</Text>
            </TouchableOpacity>
          )}
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
    minHeight: '60vh', // 3/4 of remaining screen after header
  },
  searchContainerCollapsed: {
    minHeight: 'auto',
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
    minHeight: 300,
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