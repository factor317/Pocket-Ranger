import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mountain, UtensilsCrossed, Ship, Moon } from 'lucide-react-native';
import { router } from 'expo-router';

interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  icon: React.ComponentType<any>;
  isLast?: boolean;
}

const itineraryItems: ItineraryItem[] = [
  {
    id: '1',
    time: '8:00 AM - 11:00 AM',
    activity: 'Morning Hike',
    icon: Mountain,
  },
  {
    id: '2',
    time: '12:00 PM - 1:00 PM',
    activity: 'Lunch at The Summit',
    icon: UtensilsCrossed,
  },
  {
    id: '3',
    time: '2:00 PM - 4:00 PM',
    activity: 'Afternoon Kayaking',
    icon: Ship,
  },
  {
    id: '4',
    time: '6:00 PM - 7:30 PM',
    activity: 'Dinner at The Lakeside Grill',
    icon: UtensilsCrossed,
  },
  {
    id: '5',
    time: '9:00 PM - 10:00 PM',
    activity: 'Stargazing',
    icon: Moon,
    isLast: true,
  },
];

export default function ItineraryScreen() {
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
        <Text style={styles.headerTitle}>Itinerary</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Timeline Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.timelineContainer}>
          {itineraryItems.map((item, index) => (
            <View key={item.id} style={styles.timelineItem}>
              {/* Icon and Timeline Line */}
              <View style={styles.timelineIconContainer}>
                <View style={styles.iconWrapper}>
                  <item.icon size={24} color="#0e1a13" />
                </View>
                {!item.isLast && <View style={styles.timelineLine} />}
              </View>

              {/* Content */}
              <View style={styles.timelineContent}>
                <Text style={styles.activityTitle}>{item.activity}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
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
  timelineContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  timelineIconContainer: {
    alignItems: 'center',
    width: 40,
    marginRight: 16,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  timelineLine: {
    width: 1.5,
    backgroundColor: '#d1e6d9',
    flex: 1,
    minHeight: 32,
  },
  timelineContent: {
    flex: 1,
    paddingVertical: 12,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0e1a13',
    lineHeight: 22,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 16,
    color: '#51946c',
    lineHeight: 22,
    fontWeight: '400',
  },
});