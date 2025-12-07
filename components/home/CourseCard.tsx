import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface CourseCardProps {
  title: string;
  subtitle: string;
  students: number;
  comments: number;
  dueCount?: number;
  progress?: number;
  status?: 'active' | 'inactive';
  onPress?: () => void;
  onContinue?: () => void;
}

export default function CourseCard({
  title,
  subtitle,
  students,
  comments,
  dueCount,
  progress,
  status = 'active',
  onPress,
  onContinue,
}: CourseCardProps) {
  return (
    <TouchableOpacity
      style={[styles.container, status === 'inactive' && styles.inactiveContainer]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, status === 'inactive' && styles.inactiveIcon]}>
          <Ionicons name="book" size={24} color={status === 'active' ? Colors.primary : Colors.textGray} />
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{progress || 0}%</Text>
        </View>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="people" size={14} color={Colors.textGray} />
          <Text style={styles.statText}>{students}</Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="chatbubble" size={14} color={Colors.textGray} />
          <Text style={styles.statText}>{comments}</Text>
        </View>
        {dueCount !== undefined && (
          <View style={styles.stat}>
            <Ionicons name="time" size={14} color="#FF6B6B" />
            <Text style={[styles.statText, styles.dueText]}>{dueCount} Due</Text>
          </View>
        )}
        {status === 'active' && (
          <View style={styles.stat}>
            <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
            <Text style={[styles.statText, styles.activeText]}>Active</Text>
          </View>
        )}
      </View>

      {status === 'active' && onContinue ? (
        <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
          <Text style={styles.continueButtonText}>Continue Study</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.joinButton} onPress={onPress}>
          <Text style={styles.joinButtonText}>Join Course</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 16,
    marginBottom: 16,
  },
  inactiveContainer: {
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveIcon: {
    backgroundColor: 'rgba(136, 136, 136, 0.1)',
  },
  progressBadge: {
    backgroundColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  progressText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textGray,
    marginBottom: 12,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  dueText: {
    color: '#FF6B6B',
  },
  activeText: {
    color: '#4CAF50',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: 'bold',
  },
  joinButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  joinButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
