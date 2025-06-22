import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogIn, UserPlus, Calendar, ChevronRight, Settings } from 'lucide-react-native';
import { router } from 'expo-router';

interface SavedAdventure {
  id: string;
  name: string;
  city: string;
  savedAt: string;
}

export default function ProfileScreen() {
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

  const handleMyPlansPress = () => {
    router.push('/plans');
  };

  const handlePlanTermChange = (value: boolean) => {
    const newPreference = value ? 'Adventures' : 'Plans';
    setPlanTermPreference(newPreference);
    global.planTermPreference = newPreference;
  };

  const handleSavedAdventurePress = (adventure: SavedAdventure) => {
    // Load the saved adventure into current state
    const fullAdventure = global.savedAdventures?.find(a => a.id === adventure.id);
    if (fullAdventure) {
      global.currentRecommendation = fullAdventure;
      global.isUnsavedItinerary = false;
      router.push('/itinerary');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#51946c" />
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <View style={styles.settingIcon}>
                <Settings size={20} color="#51946c" />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Call them "Adventures"</Text>
                <Text style={styles.settingSubtitle}>
                  Use "Adventures" instead of "Plans" throughout the app
                </Text>
              </View>
            </View>
            <Switch
              value={planTermPreference === 'Adventures'}
              onValueChange={handlePlanTermChange}
              trackColor={{ false: '#e8f2ec', true: '#94e0b2' }}
              thumbColor={planTermPreference === 'Adventures' ? '#51946c' : '#ffffff'}
            />
          </View>
        </View>

        {/* My Plans/Adventures Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleMyPlansPress}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Calendar size={20} color="#51946c" />
              </View>
              <Text style={styles.menuItemText}>
                My {planTermPreference}
              </Text>
            </View>
            <View style={styles.menuItemRight}>
              {savedAdventures.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{savedAdventures.length}</Text>
                </View>
              )}
              <ChevronRight size={20} color="#51946c" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Adventures Preview */}
        {savedAdventures.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent {planTermPreference}</Text>
            {savedAdventures.slice(-3).reverse().map((adventure) => (
              <TouchableOpacity
                key={adventure.id}
                style={styles.adventureItem}
                onPress={() => handleSavedAdventurePress(adventure)}
              >
                <View style={styles.adventureInfo}>
                  <Text style={styles.adventureName}>{adventure.name}</Text>
                  <Text style={styles.adventureLocation}>{adventure.city}</Text>
                  <Text style={styles.adventureDate}>
                    Saved {new Date(adventure.savedAt).toLocaleDateString()}
                  </Text>
                </View>
                <ChevronRight size={16} color="#51946c" />
              </TouchableOpacity>
            ))}
            
            {savedAdventures.length > 3 && (
              <TouchableOpacity style={styles.viewAllButton} onPress={handleMyPlansPress}>
                <Text style={styles.viewAllText}>
                  View All {savedAdventures.length} {planTermPreference}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Authentication Section */}
        <View style={styles.authSection}>
          <Text style={styles.authTitle}>Join the Adventure</Text>
          <Text style={styles.authSubtitle}>
            Sign up to sync your {planTermPreference.toLowerCase()} across devices and get personalized recommendations
          </Text>
          
          <TouchableOpacity style={styles.signUpButton}>
            <UserPlus size={20} color="#ffffff" />
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signInButton}>
            <LogIn size={20} color="#51946c" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <Text style={styles.guestNote}>
            You can continue using the app as a guest
          </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0e1a13',
    marginLeft: 12,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    padding: 16,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f4f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#51946c',
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f4f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
    backgroundColor: '#94e0b2',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#121714',
  },
  adventureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f4f2',
  },
  adventureInfo: {
    flex: 1,
  },
  adventureName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0e1a13',
    marginBottom: 2,
  },
  adventureLocation: {
    fontSize: 14,
    color: '#51946c',
    marginBottom: 2,
  },
  adventureDate: {
    fontSize: 12,
    color: '#688273',
  },
  viewAllButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f4f2',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#51946c',
  },
  authSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.05)',
    elevation: 2,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0e1a13',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#51946c',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#51946c',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 8,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#51946c',
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#51946c',
    marginLeft: 8,
  },
  guestNote: {
    fontSize: 14,
    color: '#51946c',
    textAlign: 'center',
  },
});