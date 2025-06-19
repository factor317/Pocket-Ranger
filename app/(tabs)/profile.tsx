import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogIn, UserPlus, Calendar, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const handleMyPlansPress = () => {
    router.push('/plans');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#51946c" />
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        {/* My Plans Option */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuItem} onPress={handleMyPlansPress}>
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Calendar size={20} color="#51946c" />
              </View>
              <Text style={styles.menuItemText}>My Plans</Text>
            </View>
            <ChevronRight size={20} color="#51946c" />
          </TouchableOpacity>
        </View>

        {/* Authentication Section */}
        <View style={styles.authSection}>
          <Text style={styles.authTitle}>Join the Adventure</Text>
          <Text style={styles.authSubtitle}>
            Sign up to save your plans and get personalized recommendations
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  authSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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