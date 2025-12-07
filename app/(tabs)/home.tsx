import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';

interface Course {
  id: string;
  name: string;
  description: string;
  categoryIcon: string;
  categoryColor: string;
  enrolledCount: number;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: any;
}

export default function HomeScreen() {
  const router = useRouter();
  const currentUser = auth.currentUser;
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    // Subscribe to user's courses
    const coursesRef = collection(db, 'courses');
    const coursesQuery = query(coursesRef, where('members', 'array-contains', currentUser.uid));

    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setMyCourses(coursesData);
      setLoading(false);
    });

    // Subscribe to active announcements
    const announcementsRef = collection(db, 'announcements');
    const announcementsQuery = query(
      announcementsRef,
      where('isActive', '==', true)
    );

    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
      const announcementsData: Announcement[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
      
      // Sort by createdAt in JavaScript and limit to 3
      const sortedAnnouncements = announcementsData
        .sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        })
        .slice(0, 3);
      
      setAnnouncements(sortedAnnouncements);
    });

    return () => {
      unsubscribeCourses();
      unsubscribeAnnouncements();
    };
  }, [currentUser]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return 'warning';
      case 'success': return 'checkmark-circle';
      case 'urgent': return 'alert-circle';
      default: return 'information-circle';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'warning': return '#FFD700';
      case 'success': return '#4CAF50';
      case 'urgent': return '#FF4444';
      default: return '#4A90E2';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{currentUser?.displayName?.split(' ')[0] || 'Student'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="book" size={24} color={Colors.primary} />
            <Text style={styles.statValue}>{myCourses.length}</Text>
            <Text style={styles.statLabel}>Courses</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="chatbubbles" size={24} color="#4CAF50" />
            <Text style={styles.statValue}>{myCourses.length}</Text>
            <Text style={styles.statLabel}>Chats</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="megaphone" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{announcements.length}</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </View>
        </View>

        {/* Announcements */}
        {announcements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Latest Announcements</Text>
            {announcements.map((announcement) => (
              <View key={announcement.id} style={[styles.announcementCard, { borderLeftColor: getTypeColor(announcement.type) }]}>
                <View style={styles.announcementHeader}>
                  <Ionicons name={getTypeIcon(announcement.type) as any} size={20} color={getTypeColor(announcement.type)} />
                  <Text style={styles.announcementTitle}>{announcement.title}</Text>
                </View>
                <Text style={styles.announcementMessage} numberOfLines={2}>{announcement.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* My Courses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Courses</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : myCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No courses yet</Text>
              <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/browse-courses')}>
                <Text style={styles.browseButtonText}>Browse Courses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            myCourses.slice(0, 3).map((course) => (
              <TouchableOpacity
                key={course.id}
                style={styles.courseCard}
                onPress={() => router.push({
                  pathname: '/course-chat',
                  params: { courseId: course.id, courseName: course.name, members: course.enrolledCount?.toString() || '0' },
                })}
              >
                <View style={[styles.courseIcon, { backgroundColor: course.categoryColor || Colors.primary }]}>
                  <Text style={styles.courseEmoji}>{course.categoryIcon || '📚'}</Text>
                </View>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseName}>{course.name}</Text>
                  <Text style={styles.courseDescription} numberOfLines={1}>{course.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/browse-courses')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#FFD700' }]}>
                <Ionicons name="search" size={24} color={Colors.black} />
              </View>
              <Text style={styles.quickActionLabel}>Browse</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/chats')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="chatbubbles" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>Chats</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/profile')}>
              <View style={[styles.quickActionIcon, { backgroundColor: '#9B59B6' }]}>
                <Ionicons name="person" size={24} color={Colors.white} />
              </View>
              <Text style={styles.quickActionLabel}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  greeting: {
    fontSize: 14,
    color: Colors.textGray,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textGray,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  announcementCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  announcementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
  },
  announcementMessage: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    color: Colors.textGray,
    marginBottom: 12,
  },
  browseButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: Colors.black,
    fontWeight: 'bold',
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  courseIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseEmoji: {
    fontSize: 20,
  },
  courseInfo: {
    flex: 1,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 2,
  },
  courseDescription: {
    fontSize: 13,
    color: Colors.textGray,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAction: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    color: Colors.textGray,
  },
});
