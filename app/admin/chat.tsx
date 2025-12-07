import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { db } from '../../FirebaseConfig';

interface Course {
  id: string;
  name: string;
  description: string;
  members: number;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isActive: boolean;
}

export default function AdminChatScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter((course) =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [searchQuery, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesRef = collection(db, 'courses');
      const querySnapshot = await getDocs(coursesRef);

      const coursesData: Course[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        coursesData.push({
          id: doc.id,
          name: data.name || data.courseName || 'Unnamed Course',
          description: data.description || 'No description',
          members: data.members || data.enrolledCount || 0,
          lastMessage: data.lastMessage || 'No messages yet',
          lastMessageTime: data.lastMessageTime || 'N/A',
          unreadCount: data.unreadCount || 0,
          isActive: data.isActive !== false,
        });
      });

      // Add mock courses if none exist
      if (coursesData.length === 0) {
        coursesData.push(
          {
            id: '1',
            name: 'World History',
            description: 'Study group for World History course',
            members: 24,
            lastMessage: "Hey everyone! Don't forget...",
            lastMessageTime: '2:26 PM',
            unreadCount: 2,
            isActive: true,
          },
          {
            id: '2',
            name: 'Advanced Mathematics',
            description: 'Advanced Math study group',
            members: 18,
            lastMessage: 'Can someone explain the last problem?',
            lastMessageTime: 'Yesterday',
            unreadCount: 0,
            isActive: true,
          },
          {
            id: '3',
            name: 'Computer Science 101',
            description: 'Introduction to programming',
            members: 32,
            lastMessage: 'Check out this resource!',
            lastMessageTime: '1 hour ago',
            unreadCount: 5,
            isActive: true,
          }
        );
      }

      setCourses(coursesData);
      setFilteredCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to fetch courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course: Course) => {
    router.push({
      pathname: '/course-chat',
      params: {
        courseId: course.id,
        courseName: course.name,
        members: course.members.toString(),
        from: 'admin',
      },
    });
  };

  const getCourseEmoji = (courseName: string) => {
    const name = courseName.toLowerCase();
    if (name.includes('history')) return '📚';
    if (name.includes('math')) return '📐';
    if (name.includes('science') || name.includes('computer')) return '💻';
    if (name.includes('art')) return '🎨';
    if (name.includes('music')) return '🎵';
    if (name.includes('language')) return '🗣️';
    return '📖';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/admin/dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Course Chats</Text>
          <Text style={styles.headerSubtitle}>Select a course to view chat</Text>
        </View>
        <TouchableOpacity onPress={fetchCourses} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor={Colors.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.textGray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : filteredCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No courses found</Text>
          <Text style={styles.emptySubtext}>Create a course to start chatting</Text>
        </View>
      ) : (
        <ScrollView style={styles.courseList} showsVerticalScrollIndicator={false}>
          {filteredCourses.map((course) => (
            <TouchableOpacity
              key={course.id}
              style={styles.courseCard}
              onPress={() => handleCoursePress(course)}
              activeOpacity={0.7}
            >
              <View style={styles.courseAvatar}>
                <Text style={styles.courseEmoji}>{getCourseEmoji(course.name)}</Text>
              </View>

              <View style={styles.courseContent}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName} numberOfLines={1}>
                    {course.name}
                  </Text>
                  {course.lastMessageTime && (
                    <Text style={styles.courseTime}>{course.lastMessageTime}</Text>
                  )}
                </View>

                <Text style={styles.courseDescription} numberOfLines={1}>
                  {course.description}
                </Text>

                {course.lastMessage && (
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {course.lastMessage}
                  </Text>
                )}

                <View style={styles.courseFooter}>
                  <View style={styles.membersInfo}>
                    <Ionicons name="people" size={14} color={Colors.textGray} />
                    <Text style={styles.membersText}>{course.members} members</Text>
                  </View>

                  {course.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{course.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
    marginTop: 2,
  },
  refreshButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.textGray,
    marginTop: 12,
    fontSize: 16,
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
  courseList: {
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
  courseAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  courseEmoji: {
    fontSize: 28,
  },
  courseContent: {
    flex: 1,
    marginRight: 8,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    marginRight: 8,
  },
  courseTime: {
    fontSize: 12,
    color: Colors.textGray,
  },
  courseDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textGray,
    marginBottom: 8,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  membersText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  unreadBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.black,
  },
});
