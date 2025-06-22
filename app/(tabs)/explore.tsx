import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { createStyles, theme, combineStyles } from '@/assets/styles';

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
            <ArrowLeft size={24} color={theme.colors.text.secondary} />
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
          <ArrowLeft size={24} color={theme.colors.text.secondary} />
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

const styles = createStyles({
  container: theme.components.container,
  header: theme.components.header,
  backButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: theme.components.headerTitle,
  headerSpacer: {
    width: 48,
  },
  loadingContainer: theme.components.loadingContainer,
  loadingText: theme.components.loadingText,
  scrollView: theme.components.scrollView,
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing['4xl'],
  },
  emptyText: {
    ...theme.textStyles.body,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    ...theme.components.buttonPrimary,
    ...theme.layout.buttonPadding,
    borderRadius: theme.spacing.md,
  },
  retryButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.text.primary,
  },
  recommendationCard: {
    ...theme.components.card,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  textContent: {
    flex: 2,
    gap: theme.spacing.xs,
  },
  recommendedLabel: {
    ...theme.textStyles.caption,
    color: theme.colors.text.tertiary,
  },
  title: {
    ...theme.textStyles.h4,
    color: theme.colors.text.secondary,
  },
  description: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.tertiary,
  },
  imageContainer: {
    flex: 1,
    aspectRatio: 16 / 9,
    borderRadius: theme.spacing.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});