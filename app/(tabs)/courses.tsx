import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { arrayRemove, collection, doc, increment, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';

interface Course {
  id: string;
  name: string;
  description: string;
  categoryIcon: string;
  categoryColor: string;
  members: string[];
  enrolledCount: number;
  maxMembers: number;
  isActive: boolean;
}

export default function CoursesScreen() {
  const router = useRouter();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingCourse, setLeavingCourse] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to courses where user is a member
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('members', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setMyCourses(coursesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: '/course-chat',
      params: {
        courseId: course.id,
        courseName: course.name,
        members: course.enrolledCount?.toString() || '0',
      },
    });
  };

  const handleLeaveCourse = (course: Course) => {
    if (!currentUser) return;

    Alert.alert(
      'Leave Course',
      `Are you sure you want to leave "${course.name}"? You will need to request to join again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLeavingCourse(course.id);
              console.log('Leaving course:', course.id);
              const courseRef = doc(db, 'courses', course.id);
              await updateDoc(courseRef, {
                members: arrayRemove(currentUser.uid),
                enrolledCount: increment(-1),
              });
              console.log('Successfully left course');
              Alert.alert('Success', 'You have left the course. You can request to join again from Browse Courses.');
            } catch (error) {
              console.error('Error leaving course:', error);
              Alert.alert('Error', 'Failed to leave course. Please try again.');
            } finally {
              setLeavingCourse(null);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Courses</Text>
        <TouchableOpacity onPress={() => router.push('/browse-courses')} style={styles.addButton}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : myCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No courses yet</Text>
          <Text style={styles.emptySubtext}>Join a course to get started</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/browse-courses')}>
            <Text style={styles.browseButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {myCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <TouchableOpacity
                style={styles.courseContent}
                onPress={() => handleCoursePress(course)}
                activeOpacity={0.7}
              >
                <View style={[styles.courseIcon, { backgroundColor: course.categoryColor || Colors.primary }]}>
                  <Text style={styles.courseEmoji}>{course.categoryIcon || '📚'}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDescription} numberOfLines={2}>
                    {course.description}
                  </Text>
                  <View style={styles.courseMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="people" size={14} color={Colors.textGray} />
                      <Text style={styles.metaText}>{course.enrolledCount || 0} members</Text>
                    </View>
                    <View style={[styles.statusBadge, course.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                      <Text style={styles.statusText}>{course.isActive ? 'Active' : 'Inactive'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leaveButton}
                onPress={() => handleLeaveCourse(course)}
                disabled={leavingCourse === course.id}
              >
                {leavingCourse === course.id ? (
                  <ActivityIndicator size="small" color="#FF4444" />
                ) : (
                  <Ionicons name="exit-outline" size={24} color="#FF4444" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textGray,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    color: '#555',
    fontSize: 18,
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  browseButtonText: {
    color: Colors.black,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  courseContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseEmoji: {
    fontSize: 24,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 13,
    color: Colors.textGray,
    marginBottom: 8,
    lineHeight: 18,
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#666',
  },
  statusText: {
    fontSize: 10,
    color: Colors.white,
    fontWeight: '600',
  },
  leaveButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});
