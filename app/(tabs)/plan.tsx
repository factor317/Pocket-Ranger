import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin } from 'lucide-react-native';

export default function PlanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Calendar size={24} color="#6B8E23" />
        <Text style={styles.title}>My Plans</Text>
      </View>
      <ScrollView style={styles.scrollView}>
        <View style={styles.emptyState}>
          <MapPin size={48} color="#D4A5A5" />
          <Text style={styles.emptyTitle}>No plans yet</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring to create your first adventure plan
          </Text>
        </View>
      </ScrollView>
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
    fontFamily: 'Inter-SemiBold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8B9DC3',
    textAlign: 'center',
    lineHeight: 24,
  },
});