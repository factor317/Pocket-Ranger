import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, MapPin, Trash2 } from 'lucide-react-native';
import { router } from 'expo-router';

interface SavedAdventure {
  id: string;
  name: string;
  city: string;
  description: string;
  activity: string;
  savedAt: string;
  schedule: any[];
}

export default function PlansScreen() {
  const [savedAdventures, setSavedAdventures] = useState<SavedAdventure[]>([]);
  const [planTermPreference, setPlanTermPreference] = useState<'Plans' | 'Adventures'>('Adventures');

  useEffect(() => {
    // Load saved adventures from global state
    if (global.savedAdventures) {
      setSavedAdventures(global.savedAdventures);
    }
    
    // Load user preference
    if (global.planTermPreference) {
      setPlanTermPreference(global.planTermPreference);
    }
  }, []);

  const handleAdventurePress = (adventure: SavedAdventure) => {
    // Load the saved adventure into current state
    global.currentRecommendation = adventure;
    global.isUnsavedItinerary = false;
    router.push('/itinerary');
  };

  const handleDeleteAdventure = (adventureId: string) => {
    const adventure = savedAdventures.find(a => a.id === adventureId);
    if (!adventure) return;

    Alert.alert(
      `Delete ${planTermPreference.slice(0, -1)}`,
      `Are you sure you want to delete "${adventure.name}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedAdventures = savedAdventures.filter(a => a.id !== adventureId);
            setSavedAdventures(updatedAdventures);
            global.savedAdventures = updatedAdventures;
          },
        },
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
        <Text style={styles.headerTitle}>My {planTermPreference}</Text>
        <View style={styles.headerSpacer} />
      </View>
      
      <ScrollView style={styles.scrollView}>
        {savedAdventures.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#51946c" />
            <Text style={styles.emptyTitle}>No {planTermPreference.toLowerCase()} yet</Text>
            <Text style={styles.emptySubtitle}>
              Start exploring to create your first saved {planTermPreference.toLowerCase().slice(0, -1)}
            </Text>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.exploreButtonText}>Plan Adventure</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.adventuresList}>
            <Text style={styles.listTitle}>
              {savedAdventures.length} Saved {planTermPreference}
            </Text>
            
            {savedAdventures.map((adventure) => (
              <View key={adventure.id} style={styles.adventureCard}>
                <TouchableOpacity
                  style={styles.adventureContent}
                  onPress={() => handleAdventurePress(adventure)}
                >
                  <View style={styles.adventureHeader}>
                    <Text style={styles.adventureName}>{adventure.name}</Text>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteAdventure(adventure.id)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.adventureDetails}>
                    <View style={styles.adventureLocation}>
                      <MapPin size={16} color="#51946c" />
                      <Text style={styles.adventureLocationText}>{adventure.city}</Text>
                    </View>
                    
                    <View style={styles.adventureDate}>
                      <Calendar size={16} color="#51946c" />
                      <Text style={styles.adventureDateText}>
                        Saved {new Date(adventure.savedAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.adventureDescription} numberOfLines={2}>
                    {adventure.description}
                  </Text>
                  
                  <View style={styles.adventureFooter}>
                    <View style={styles.activityBadge}>
                      <Text style={styles.activityText}>{adventure.activity}</Text>
                    </View>
                    <Text style={styles.scheduleCount}>
                      {adventure.schedule?.length || 0} activities
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
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
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0e1a13',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#51946c',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  exploreButton: {
    backgroundColor: '#94e0b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreButtonText: {
    color: '#121714',
    fontSize: 16,
    fontWeight: '600',
  },
  adventuresList: {
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 16,
  },
  adventureCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  adventureContent: {
    padding: 16,
  },
  adventureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  adventureName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0e1a13',
    flex: 1,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  adventureDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  adventureLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adventureLocationText: {
    fontSize: 14,
    color: '#51946c',
    fontWeight: '500',
  },
  adventureDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adventureDateText: {
    fontSize: 14,
    color: '#51946c',
  },
  adventureDescription: {
    fontSize: 14,
    color: '#688273',
    lineHeight: 20,
    marginBottom: 12,
  },
  adventureFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activityBadge: {
    backgroundColor: '#f1f4f2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activityText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121714',
    textTransform: 'capitalize',
  },
  scheduleCount: {
    fontSize: 12,
    color: '#688273',
  },
});