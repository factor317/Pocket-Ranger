import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, ExternalLink, Save, RotateCcw } from 'lucide-react-native';
import { router } from 'expo-router';

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

export default function ItineraryScreen() {
  const [currentItinerary, setCurrentItinerary] = useState<LocationRecommendation | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);

  useEffect(() => {
    // Check for current recommendation from global state
    if (global.currentRecommendation) {
      setCurrentItinerary(global.currentRecommendation);
      setIsUnsaved(global.isUnsavedItinerary || false);
    }
  }, []);

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

  const handleSaveItinerary = () => {
    if (!currentItinerary) return;

    Alert.prompt(
      'Save Adventure',
      'What would you like to name this adventure?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Save',
          onPress: (name) => {
            if (name && name.trim()) {
              saveItinerary(name.trim());
            }
          },
        },
      ],
      'plain-text',
      currentItinerary.name
    );
  };

  const saveItinerary = (name: string) => {
    if (!currentItinerary) return;

    // Get existing saved adventures
    const savedAdventures = global.savedAdventures || [];
    
    // Create new saved adventure
    const newAdventure = {
      id: Date.now().toString(),
      name,
      ...currentItinerary,
      savedAt: new Date().toISOString(),
    };

    // Add to saved adventures
    global.savedAdventures = [...savedAdventures, newAdventure];
    
    setIsUnsaved(false);
    global.isUnsavedItinerary = false;
    
    Alert.alert('Saved!', `Your adventure "${name}" has been saved to My Plans.`);
  };

  const handleDiscardAndRestart = () => {
    Alert.alert(
      'Discard Adventure',
      'Are you sure you want to discard this itinerary and start over?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setCurrentItinerary(null);
            setIsUnsaved(false);
            global.currentRecommendation = null;
            global.isUnsavedItinerary = false;
            router.push('/');
          },
        },
      ]
    );
  };

  if (!currentItinerary) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <MapPin size={48} color="#51946c" />
          <Text style={styles.emptyTitle}>No itinerary yet</Text>
          <Text style={styles.emptySubtitle}>
            Plan an adventure from the Home tab to see your itinerary here
          </Text>
          <TouchableOpacity
            style={styles.planButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.planButtonText}>Plan Adventure</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <MapPin size={24} color="#121714" />
            <View style={styles.headerText}>
              <Text style={styles.title}>{currentItinerary.name}</Text>
              <Text style={styles.location}>{currentItinerary.city}</Text>
            </View>
          </View>
          
          {isUnsaved && (
            <View style={styles.unsavedBadge}>
              <Text style={styles.unsavedText}>Unsaved</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{currentItinerary.description}</Text>
        </View>

        {/* Schedule */}
        <View style={styles.scheduleContainer}>
          <View style={styles.scheduleHeader}>
            <Clock size={20} color="#121714" />
            <Text style={styles.scheduleTitle}>Your Itinerary</Text>
          </View>
          
          {currentItinerary.schedule.map((item, index) => (
            <View key={index} style={styles.scheduleItem}>
              <View style={styles.timelineIconContainer}>
                <View style={styles.timelineDot} />
                {index < currentItinerary.schedule.length - 1 && (
                  <View style={styles.timelineLine} />
                )}
              </View>
              
              <View style={styles.scheduleContent}>
                <View style={styles.scheduleTime}>
                  <Text style={styles.scheduleTimeText}>{item.time}</Text>
                </View>
                
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>{item.activity}</Text>
                  <Text style={styles.activityLocation}>{item.location}</Text>
                  
                  {item.description && (
                    <Text style={styles.activityDescription}>{item.description}</Text>
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
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {isUnsaved && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveItinerary}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save Adventure</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleDiscardAndRestart}
          >
            <RotateCcw size={20} color="#51946c" />
            <Text style={styles.restartButtonText}>
              {isUnsaved ? 'Discard & Restart' : 'Plan New Adventure'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
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
  planButton: {
    backgroundColor: '#94e0b2',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  planButtonText: {
    color: '#121714',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f2ec',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121714',
    lineHeight: 26,
  },
  location: {
    fontSize: 14,
    color: '#688273',
    marginTop: 2,
    fontWeight: '500',
  },
  unsavedBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  unsavedText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  descriptionContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  description: {
    fontSize: 16,
    color: '#121714',
    lineHeight: 24,
    fontWeight: '400',
  },
  scheduleContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121714',
    marginLeft: 8,
  },
  scheduleItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 20,
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#94e0b2',
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    backgroundColor: '#e8f2ec',
    flex: 1,
    minHeight: 40,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleTime: {
    backgroundColor: '#f1f4f2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  scheduleTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#121714',
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#121714',
    marginBottom: 4,
    lineHeight: 22,
  },
  activityLocation: {
    fontSize: 14,
    color: '#688273',
    marginBottom: 8,
    fontWeight: '500',
  },
  activityDescription: {
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
  actionButtons: {
    padding: 20,
    gap: 12,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#51946c',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  restartButtonText: {
    color: '#51946c',
    fontSize: 16,
    fontWeight: '600',
  },
});