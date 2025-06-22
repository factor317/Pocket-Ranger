import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';

interface Recommendation {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  searchQuery: string;
}

export default function ExploreScreen() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading recommendations from API...');
      
      const response = await fetch('/api/ai-recommendations');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Recommendations loaded successfully:', data);
      
      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
      } else {
        console.warn('Invalid recommendations format:', data);
        setRecommendations([]);
      }
    } catch (error) {
      console.error('❌ Error loading recommendations:', error);
      Alert.alert('Error', 'Failed to load recommendations. Please try again.');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationPress = async (recommendation: Recommendation) => {
    try {
      console.log('🎯 Adventure selected:', recommendation.title);
      console.log('🔍 Search query:', recommendation.searchQuery);
      
      // CRITICAL: Clear any existing recommendation first
      global.currentRecommendation = null;
      global.isUnsavedItinerary = false;
      
      console.log('🧹 Cleared existing global state');
      
      // Step 1: Get AI recommendation for the search query
      console.log('🤖 Step 1: Calling Groq Chat API...');
      const aiResponse = await fetch('/api/groq-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: recommendation.searchQuery,
          conversationHistory: []
        }),
      });

      if (!aiResponse.ok) {
        throw new Error(`AI API failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      console.log('✅ AI response received:', {
        shouldSearch: aiData.shouldSearch,
        recommendedFile: aiData.recommendedFile
      });

      // Step 2: Get adventure data using the recommended file
      console.log('🎯 Step 2: Calling POC Plan API with recommended file...');
      const response = await fetch('/api/pocPlan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userInput: recommendation.searchQuery,
          recommendedFile: aiData.recommendedFile
        }),
      });

      if (!response.ok) {
        throw new Error(`Adventure API failed: ${response.status}`);
      }

      const adventureData = await response.json();
      
      console.log('✅ Adventure data received:', {
        name: adventureData.name,
        city: adventureData.city,
        scheduleLength: adventureData.schedule?.length || 0
      });
      
      // CRITICAL: Validate adventure data before storing
      if (!adventureData.name || !adventureData.city || !adventureData.schedule) {
        throw new Error('Invalid adventure data received');
      }
      
      // Store the recommendation globally and navigate to itinerary
      global.currentRecommendation = adventureData;
      global.isUnsavedItinerary = true;
      
      console.log('💾 Stored new adventure in global state');
      console.log('🧭 Navigating to itinerary tab...');
      
      // Navigate to itinerary tab to show results
      router.push('/itinerary');
      
    } catch (error) {
      console.error('❌ Adventure loading error:', error);
      Alert.alert('Error', 'Failed to load adventure details. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#0e1a13" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Recommendations</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recommendations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#0e1a13" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Recommendations</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Recommendations List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {recommendations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recommendations available</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadRecommendations}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          recommendations.map((recommendation) => (
            <TouchableOpacity
              key={recommendation.id}
              style={styles.recommendationCard}
              onPress={() => handleRecommendationPress(recommendation)}
            >
              <View style={styles.cardContent}>
                <View style={styles.textContent}>
                  <Text style={styles.recommendedLabel}>Recommended</Text>
                  <Text style={styles.title}>{recommendation.title}</Text>
                  <Text style={styles.description}>{recommendation.description}</Text>
                </View>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: recommendation.imageUrl }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f8fbfa',
  },
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e1a13',
    letterSpacing: -0.015,
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#51946c',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#51946c',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#94e0b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#121714',
    fontSize: 16,
    fontWeight: '600',
  },
  recommendationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  textContent: {
    flex: 2,
    gap: 4,
  },
  recommendedLabel: {
    fontSize: 14,
    color: '#51946c',
    fontWeight: '400',
    lineHeight: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0e1a13',
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#51946c',
    fontWeight: '400',
    lineHeight: 20,
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});