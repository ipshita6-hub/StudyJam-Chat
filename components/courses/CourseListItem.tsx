import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/colors';

interface Course {
  id: string;
  title: string;
  description: string;
  members: number;
  status: 'joined' | 'not-joined';
  icon: string;
}

interface CourseListItemProps {
  course: Course;
  onPress: () => void;
}

export default function CourseListItem({ course, onPress }: CourseListItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.content}>
        <Text style={styles.title}>{course.title}</Text>
        <Text style={styles.description}>{course.description}</Text>
        
        <View style={styles.footer}>
          <View style={styles.membersContainer}>
            <Ionicons name="people" size={14} color={Colors.textGray} />
            <Text style={styles.membersText}>{course.members} members</Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            course.status === 'joined' ? styles.joinedBadge : styles.notJoinedBadge
          ]}>
            <Text style={[
              styles.statusText,
              course.status === 'joined' ? styles.joinedText : styles.notJoinedText
            ]}>
              {course.status === 'joined' ? 'Joined' : 'Not Joined'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.black,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 16,
    marginBottom: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  joinedBadge: {
    backgroundColor: Colors.primary,
  },
  notJoinedBadge: {
    backgroundColor: Colors.border,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  joinedText: {
    color: Colors.black,
  },
  notJoinedText: {
    color: Colors.textGray,
  },
});
