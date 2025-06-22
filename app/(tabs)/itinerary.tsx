import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, ExternalLink, Save, RotateCcw, Mountain as Mountains, Utensils, Waves, Moon, Compass, TreePine, Camera, Coffee, X } from 'lucide-react-native';
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

// Helper function to get activity icon based on activity type
const getActivityIcon = (activity: string) => {
  const activityLower = activity.toLowerCase();
  
  if (activityLower.includes('hike') || activityLower.includes('trail') || activityLower.includes('mountain')) {
    return Mountains;
  } else if (activityLower.includes('lunch') || activityLower.includes('dinner') || activityLower.includes('breakfast') || activityLower.includes('meal') || activityLower.includes('restaurant')) {
    return Utensils;
  } else if (activityLower.includes('kayak') || activityLower.includes('boat') || activityLower.includes('water') || activityLower.includes('lake') || activityLower.includes('river')) {
    return Waves;
  } else if (activityLower.includes('star') || activityLower.includes('night') || activityLower.includes('evening')) {
    return Moon;
  } else if (activityLower.includes('explore') || activityLower.includes('visit') || activityLower.includes('tour')) {
    return Compass;
  } else if (activityLower.includes('forest') || activityLower.includes('tree') || activityLower.includes('nature')) {
    return TreePine;
  } else if (activityLower.includes('photo') || activityLower.includes('view') || activityLower.includes('scenic')) {
    return Camera;
  } else if (activityLower.includes('coffee') || activityLower.includes('cafe') || activityLower.includes('brew')) {
    return Coffee;
  } else {
    return Compass; // Default icon
  }
};

export default function ItineraryScreen() {
  const [currentItinerary, setCurrentItinerary] = useState<LocationRecommendation | null>(null);
  const [isUnsaved, setIsUnsaved] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [adventureName, setAdventureName] = useState('');

  useEffect(() => {
    console.log('🔍 Itinerary screen mounted, checking global state...');
    
    // Check for current recommendation from global state
    if (global.currentRecommendation) {
      console.log('✅ Found global recommendation:', {
        name: global.currentRecommendation.name,
        city: global.currentRecommendation.city,
        scheduleLength: global.currentRecommendation.schedule?.length || 0
      });
      
      setCurrentItinerary(global.currentRecommendation);
      setIsUnsaved(global.isUnsavedItinerary || false);
      setAdventureName(global.currentRecommendation.name || '');
    } else {
      console.log('❌ No global recommendation found');
    }
  }, []);

  // Add a debug effect to monitor state changes
  useEffect(() => {
    console.log('📊 Itinerary state updated:', {
      hasItinerary: !!currentItinerary,
      itineraryName: currentItinerary?.name,
      scheduleLength: currentItinerary?.schedule?.length || 0,
      isUnsaved
    });
  }, [currentItinerary, isUnsaved]);

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

    if (Platform.OS === 'web') {
      // Use custom modal for web
      setAdventureName(currentItinerary.name);
      setShowSaveModal(true);
    } else {
      // Use Alert.prompt for mobile
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
    }
  };

  const handleSaveFromModal = () => {
    if (adventureName.trim()) {
      saveItinerary(adventureName.trim());
      setShowSaveModal(false);
    }
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

  // Debug: Log the current state before rendering
  console.log('🎨 Rendering itinerary screen with state:', {
    hasItinerary: !!currentItinerary,
    itineraryName: currentItinerary?.name,
    scheduleLength: currentItinerary?.schedule?.length || 0
  });

  if (!currentItinerary) {
    console.log('📭 Showing empty state - no current itinerary');
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

  console.log('🎯 Rendering full itinerary for:', currentItinerary.name);

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
          
          {/* Debug: Show schedule length */}
          {currentItinerary.schedule && currentItinerary.schedule.length > 0 ? (
            <View style={styles.timelineContainer}>
              {currentItinerary.schedule.map((item, index) => {
                const IconComponent = getActivityIcon(item.activity);
                const isLast = index === currentItinerary.schedule.length - 1;
                
                console.log(`🎯 Rendering schedule item ${index + 1}:`, {
                  activity: item.activity,
                  time: item.time,
                  location: item.location
                });
                
                return (
                  <View key={index} style={styles.timelineItem}>
                    {/* Left side: Icon and timeline */}
                    <View style={styles.timelineLeft}>
                      <View style={styles.iconContainer}>
                        <IconComponent size={20} color="#0e1a13" />
                      </View>
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    
                    {/* Right side: Content */}
                    <View style={styles.timelineContent}>
                      <Text style={styles.activityTitle}>{item.activity}</Text>
                      <Text style={styles.scheduleTime}>{item.time}</Text>
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
                );
              })}
            </View>
          ) : (
            <View style={styles.noScheduleContainer}>
              <Text style={styles.noScheduleText}>No schedule items available</Text>
            </View>
          )}
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

      {/* Save Modal for Web */}
      <Modal
        visible={showSaveModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSaveModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save Adventure</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowSaveModal(false)}
              >
                <X size={24} color="#688273" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>What would you like to name this adventure?</Text>
            
            <TextInput
              style={styles.modalInput}
              value={adventureName}
              onChangeText={setAdventureName}
              placeholder="Adventure name"
              autoFocus={Platform.OS === 'web'}
              selectTextOnFocus={true}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowSaveModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalSaveButton, !adventureName.trim() && styles.modalSaveButtonDisabled]}
                onPress={handleSaveFromModal}
                disabled={!adventureName.trim()}
              >
                <Text style={[styles.modalSaveText, !adventureName.trim() && styles.modalSaveTextDisabled]}>
                  Save
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    marginBottom: 24,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#121714',
    marginLeft: 8,
  },
  // NEW: Vertical Timeline Layout
  timelineContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f4f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    width: 2,
    backgroundColor: '#e8f2ec',
    flex: 1,
    minHeight: 60,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 8,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 4,
    lineHeight: 24,
  },
  scheduleTime: {
    fontSize: 14,
    color: '#51946c',
    fontWeight: '500',
    marginBottom: 6,
  },
  activityLocation: {
    fontSize: 14,
    color: '#688273',
    marginBottom: 8,
    fontWeight: '400',
  },
  activityDescription: {
    fontSize: 14,
    color: '#688273',
    marginBottom: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  partnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  partnerLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94e0b2',
  },
  noScheduleContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noScheduleText: {
    fontSize: 16,
    color: '#688273',
    fontStyle: 'italic',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#121714',
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#688273',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e8f2ec',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#121714',
    backgroundColor: '#f8fbfa',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8f2ec',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#688273',
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#10b981',
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#d1e6d9',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalSaveTextDisabled: {
    color: '#688273',
  },
});