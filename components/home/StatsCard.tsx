import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface StatsCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  value: number;
  label: string;
  iconColor?: string;
}

export default function StatsCard({ icon, value, label, iconColor = Colors.primary }: StatsCardProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
  },
  label: {
    fontSize: 12,
    color: Colors.textGray,
    marginTop: 4,
  },
});
