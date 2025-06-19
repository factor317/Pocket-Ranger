import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map } from 'lucide-react-native';

export default function ItineraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Map size={24} color="#51946c" />
        <Text style={styles.title}>Itinerary</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.emptyState}>
          <Map size={48} color="#51946c" />
          <Text style={styles.emptyTitle}>No itinerary yet</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring to create your first adventure itinerary
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
  },
});