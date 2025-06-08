import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, LogIn, UserPlus } from 'lucide-react-native';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <User size={24} color="#6B8E23" />
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.authSection}>
          <Text style={styles.authTitle}>Join the Adventure</Text>
          <Text style={styles.authSubtitle}>
            Sign up to save your plans and get personalized recommendations
          </Text>
          
          <TouchableOpacity style={styles.signUpButton}>
            <UserPlus size={20} color="#FFFFFF" />
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.signInButton}>
            <LogIn size={20} color="#6B8E23" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
          
          <Text style={styles.guestNote}>
            You can continue using the app as a guest
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F2D7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#6B8E23',
    marginLeft: 12,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  authSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7C9A1',
  },
  authTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B8E23',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  signUpButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B8E23',
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signInButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B8E23',
    marginLeft: 8,
  },
  guestNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8B9DC3',
    textAlign: 'center',
  },
});