import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Linking, TextInput, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Clock, ExternalLink, Save, RotateCcw, Mountain as Mountains, Utensils, Waves, Moon, Compass, TreePine, Camera, Coffee, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { createStyles, theme, combineStyles } from '@/assets/styles';

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
            console.log('🗑️ Discarding current adventure and restarting...');
            
            // CRITICAL: Clear all state completely
            setCurrentItinerary(null);
            setIsUnsaved(false);
            setAdventureName('');
            setShowSaveModal(false);
            
            // CRITICAL: Clear global state completely
            global.currentRecommendation = null;
            global.isUnsavedItinerary = false;
            
            console.log('✅ All state cleared, navigating to home...');
            
            // Navigate to home and replace the current route
            router.replace('/');
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
          <MapPin size={48} color={theme.colors.primary[500]} />
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
            <MapPin size={24} color={theme.colors.text.primary} />
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
            <Clock size={20} color={theme.colors.text.primary} />
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
                        <IconComponent size={20} color={theme.colors.text.secondary} />
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
                          <ExternalLink size={14} color={theme.colors.secondary[400]} />
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
              <Save size={20} color={theme.colors.text.inverse} />
              <Text style={styles.saveButtonText}>Save Adventure</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.restartButton}
            onPress={handleDiscardAndRestart}
          >
            <RotateCcw size={20} color={theme.colors.primary[500]} />
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
                <X size={24} color={theme.colors.text.tertiary} />
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
                style={combineStyles(styles.modalSaveButton, !adventureName.trim() && styles.modalSaveButtonDisabled)}
                onPress={handleSaveFromModal}
                disabled={!adventureName.trim()}
              >
                <Text style={combineStyles(styles.modalSaveText, !adventureName.trim() && styles.modalSaveTextDisabled)}>
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

const styles = createStyles({
  container: theme.components.container,
  scrollView: theme.components.scrollView,
  emptyState: theme.components.emptyState,
  emptyTitle: theme.components.emptyTitle,
  emptySubtitle: theme.components.emptySubtitle,
  planButton: {
    ...theme.components.buttonPrimary,
    ...theme.layout.buttonPadding,
    borderRadius: theme.spacing.md,
  },
  planButtonText: {
    ...theme.textStyles.button,
    color: theme.colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border.medium,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  title: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
  },
  location: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  unsavedBadge: {
    ...theme.components.badgeWarning,
    ...theme.components.badge,
  },
  unsavedText: theme.components.badgeText,
  descriptionContainer: {
    ...theme.layout.containerPaddingLarge,
    backgroundColor: theme.colors.background.primary,
  },
  description: {
    ...theme.textStyles.body,
    color: theme.colors.text.primary,
  },
  scheduleContainer: {
    ...theme.layout.containerPaddingLarge,
    backgroundColor: theme.colors.background.primary,
    marginTop: theme.spacing.sm,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
  },
  scheduleTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  // NEW: Vertical Timeline Layout
  timelineContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: theme.spacing['2xl'],
  },
  timelineLeft: {
    width: 40,
    alignItems: 'center',
    marginRight: theme.spacing.lg,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  timelineLine: {
    width: 2,
    backgroundColor: theme.colors.border.medium,
    flex: 1,
    minHeight: 60,
  },
  timelineContent: {
    flex: 1,
    paddingTop: theme.spacing.sm,
  },
  activityTitle: {
    ...theme.textStyles.h4,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
  },
  scheduleTime: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.primary[500],
    fontWeight: '500',
    marginBottom: 6,
  },
  activityLocation: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.sm,
  },
  activityDescription: {
    ...theme.textStyles.bodySmall,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
  },
  partnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
  },
  partnerLinkText: {
    ...theme.textStyles.label,
    color: theme.colors.secondary[400],
  },
  noScheduleContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  noScheduleText: {
    ...theme.textStyles.body,
    color: theme.colors.text.tertiary,
    fontStyle: 'italic',
  },
  actionButtons: {
    ...theme.layout.containerPaddingLarge,
    gap: theme.spacing.md,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.success[500],
    ...theme.layout.buttonPaddingLarge,
    borderRadius: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    ...theme.textStyles.buttonLarge,
    color: theme.colors.text.inverse,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary[500],
    ...theme.layout.buttonPaddingLarge,
    borderRadius: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  restartButtonText: {
    ...theme.textStyles.buttonLarge,
    color: theme.colors.primary[500],
  },
  // Modal styles
  modalOverlay: theme.components.modalOverlay,
  modalContent: theme.components.modalContent,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalTitle: {
    ...theme.textStyles.h3,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.xs,
  },
  modalSubtitle: {
    ...theme.textStyles.body,
    color: theme.colors.text.tertiary,
    marginBottom: theme.spacing.xl,
  },
  modalInput: {
    ...theme.components.input,
    marginBottom: theme.spacing['2xl'],
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    ...theme.layout.buttonPadding,
    borderRadius: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border.medium,
    alignItems: 'center',
  },
  modalCancelText: {
    ...theme.textStyles.button,
    color: theme.colors.text.tertiary,
  },
  modalSaveButton: {
    flex: 1,
    ...theme.layout.buttonPadding,
    borderRadius: theme.spacing.sm,
    backgroundColor: theme.colors.success[500],
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: theme.colors.neutral[300],
  },
  modalSaveText: {
    ...theme.textStyles.button,
    color: theme.colors.text.inverse,
  },
  modalSaveTextDisabled: {
    color: theme.colors.text.tertiary,
  },
});