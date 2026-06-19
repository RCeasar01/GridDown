import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

interface EmergencyBannerProps {
  message?: string;
}

export function EmergencyBanner({
  message = 'You are viewing offline content',
}: EmergencyBannerProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="wifi-outline" size={14} color={Colors.primary} />
      <Text style={styles.text}>{message}</Text>
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dangerBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primaryDim,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
