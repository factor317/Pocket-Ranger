import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Home, Search, Map, User } from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Test Home Screen
function TestHomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Home Screen</Text>
        <Text style={styles.subtitle}>React Navigation Test</Text>
      </View>
    </SafeAreaView>
  );
}

// Test Explore Screen
function TestExploreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Explore Screen</Text>
        <Text style={styles.subtitle}>Search for adventures</Text>
      </View>
    </SafeAreaView>
  );
}

// Test Itinerary Screen
function TestItineraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Itinerary Screen</Text>
        <Text style={styles.subtitle}>Your planned adventures</Text>
      </View>
    </SafeAreaView>
  );
}

// Test Profile Screen
function TestProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Test Profile Screen</Text>
        <Text style={styles.subtitle}>User profile and settings</Text>
      </View>
    </SafeAreaView>
  );
}

// Tab Navigator
function TestTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0e1a13',
        tabBarInactiveTintColor: '#51946c',
        tabBarStyle: {
          backgroundColor: '#f8fbfa',
          borderTopColor: '#e8f2ec',
          borderTopWidth: 1,
          paddingBottom: 12,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          letterSpacing: 0.15,
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
      }}
    >
      <Tab.Screen
        name="TestHome"
        component={TestHomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TestExplore"
        component={TestExploreScreen}
        options={{
          title: 'Explore',
          tabBarIcon: ({ size, color }) => (
            <Search size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TestItinerary"
        component={TestItineraryScreen}
        options={{
          title: 'Itinerary',
          tabBarIcon: ({ size, color }) => (
            <Map size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="TestProfile"
        component={TestProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Main Test Navigation Component
export default function TestNavigation() {
  return (
    <NavigationContainer independent={true}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="TestTabs" component={TestTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fbfa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0e1a13',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#51946c',
    textAlign: 'center',
  },
});