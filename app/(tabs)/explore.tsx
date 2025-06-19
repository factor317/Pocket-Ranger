import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
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
}

const recommendations: Recommendation[] = [
  {
    id: '1',
    title: 'Yosemite National Park',
    description: 'Explore the iconic granite cliffs and giant sequoia trees of Yosemite Valley.',
    imageUrl: 'https://images.pexels.com/photos/2743287/pexels-photo-2743287.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '2',
    title: 'Zion National Park',
    description: 'Hike through the narrow canyons and towering sandstone cliffs of Zion.',
    imageUrl: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '3',
    title: 'Grand Canyon National Park',
    description: 'Witness the breathtaking views of the Grand Canyon\'s vast expanse.',
    imageUrl: 'https://images.pexels.com/photos/1770809/pexels-photo-1770809.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
  {
    id: '4',
    title: 'Acadia National Park',
    description: 'Discover the rugged coastline and granite peaks of Acadia in Maine.',
    imageUrl: 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=800',
  },
];

export default function ExploreScreen() {
  const handleRecommendationPress = (recommendation: Recommendation) => {
    Alert.alert(
      recommendation.title,
      `Would you like to learn more about ${recommendation.title}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Learn More', onPress: () => console.log('Learn more about', recommendation.title) },
      ]
    );
  };

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
        {recommendations.map((recommendation) => (
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
        ))}
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
  scrollView: {
    flex: 1,
  },
  recommendationCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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