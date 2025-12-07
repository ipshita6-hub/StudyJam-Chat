import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
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
import { Colors } from '../constants/colors';
import { auth, db } from '../FirebaseConfig';

interface Course {
  id: string;
  name: string;
  description: string;
  category: string;
  categoryIcon: string;
  categoryColor: string;
  members: string[];
  enrolledCount: number;
  maxMembers: number;
  isActive: boolean;
}

interface PendingRequest {
  courseId: string;
  status: 'pending' | 'approved' | 'rejected';
}

export default function BrowseCoursesScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const currentUser = auth.currentUser;

  const categories = ['All', 'history', 'math', 'science', 'computer', 'language', 'art', 'music', 'business'];

  useEffect(() => {
    const coursesRef = collection(db, 'courses');
    const unsubscribeCourses = onSnapshot(coursesRef, (snapshot) => {
      const coursesData: Course[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Course[];
      setCourses(coursesData);
      setLoading(false);
    });

    // Subscribe to user's pending join requests
    let unsubscribeRequests: (() => void) | undefined;
    if (currentUser) {
      const requestsRef = collection(db, 'joinRequests');
      const requestsQuery = query(
        requestsRef,
        where('userId', '==', currentUser.uid),
        where('status', '==', 'pending')
      );
      unsubscribeRequests = onSnapshot(requestsQuery, (snapshot) => {
        const requests: PendingRequest[] = snapshot.docs.map((doc) => ({
          courseId: doc.data().courseId,
          status: doc.data().status,
        }));
        setPendingRequests(requests);
      });
    }

    return () => {
      unsubscribeCourses();
      if (unsubscribeRequests) unsubscribeRequests();
    };
  }, [currentUser]);

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory && course.isActive;
  });

  const isJoined = (course: Course) => {
    if (!currentUser) return false;
    const members = course.members || [];
    return Array.isArray(members) && members.includes(currentUser.uid);
  };

  const isPending = (course: Course) => {
    return pendingRequests.some((req) => req.courseId === course.id);
  };

  const getButtonState = (course: Course): 'joined' | 'pending' | 'join' => {
    if (isJoined(course)) return 'joined';
    if (isPending(course)) return 'pending';
    return 'join';
  };

  const handleJoinCourse = async (course: Course) => {
    if (!currentUser) {
      Alert.alert('Error', 'Please login to join courses');
      return;
    }

    const buttonState = getButtonState(course);

    if (buttonState === 'joined') {
      // Navigate to chat
      router.push({
        pathname: '/course-chat',
        params: { courseId: course.id, courseName: course.name, members: course.enrolledCount?.toString() || '0', from: 'student' },
      });
      return;
    }

    if (buttonState === 'pending') {
      Alert.alert('Request Pending', 'Your request is awaiting admin approval. Please wait.');
      return;
    }

    try {
      setJoining(course.id);
      
      console.log('Join button pressed for course:', course.id);
      console.log('Current user:', currentUser.uid);
      console.log('Course members:', course.members);
      console.log('Is user in members?', course.members?.includes(currentUser.uid));
      
      // Check if user already has a pending request for this course
      const requestsRef = collection(db, 'joinRequests');
      const existingRequestQuery = query(
        requestsRef,
        where('userId', '==', currentUser.uid),
        where('courseId', '==', course.id),
        where('status', '==', 'pending')
      );
      const existingRequests = await getDocs(existingRequestQuery);
      
      if (!existingRequests.empty) {
        Alert.alert('Request Pending', 'You already have a pending request for this course. Please wait for admin approval.');
        return;
      }

      // Create join request (NOT adding to members directly)
      await addDoc(collection(db, 'joinRequests'), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: currentUser.displayName || 'Unknown User',
        courseId: course.id,
        courseName: course.name,
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      console.log('Join request created successfully');
      Alert.alert('Request Sent', `Your request to join "${course.name}" has been sent to the admin for approval.`);
    } catch (error) {
      console.error('Error sending join request:', error);
      Alert.alert('Error', 'Failed to send join request. Please try again.');
    } finally {
      setJoining(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/home")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Browse Courses</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
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
        </View>
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Courses List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading courses...</Text>
        </View>
      ) : filteredCourses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="book-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No courses found</Text>
        </View>
      ) : (
        <ScrollView style={styles.coursesList} showsVerticalScrollIndicator={false}>
          {filteredCourses.map((course) => (
            <View key={course.id} style={styles.courseCard}>
              <View style={[styles.courseIcon, { backgroundColor: course.categoryColor || Colors.primary }]}>
                <Text style={styles.courseEmoji}>{course.categoryIcon || '📚'}</Text>
              </View>
              <View style={styles.courseInfo}>
                <Text style={styles.courseName}>{course.name}</Text>
                <Text style={styles.courseDescription} numberOfLines={2}>{course.description}</Text>
                <View style={styles.courseMeta}>
                  <View style={styles.metaItem}>
                    <Ionicons name="people" size={14} color={Colors.textGray} />
                    <Text style={styles.metaText}>{course.enrolledCount || 0}/{course.maxMembers || 50}</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.joinButton,
                  getButtonState(course) === 'joined' && styles.joinedButton,
                  getButtonState(course) === 'pending' && styles.pendingButton,
                ]}
                onPress={() => handleJoinCourse(course)}
                disabled={joining === course.id}
              >
                {joining === course.id ? (
                  <ActivityIndicator size="small" color={Colors.black} />
                ) : (
                  <Text style={[
                    styles.joinButtonText,
                    getButtonState(course) === 'joined' && styles.joinedButtonText,
                    getButtonState(course) === 'pending' && styles.pendingButtonText,
                  ]}>
                    {getButtonState(course) === 'joined' ? 'Open' : getButtonState(course) === 'pending' ? 'Pending' : 'Join'}
                  </Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
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
  categoriesContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxHeight: 40,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryText: {
    color: Colors.textGray,
    fontSize: 14,
  },
  categoryTextActive: {
    color: Colors.black,
    fontWeight: '600',
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
  },
  emptyText: {
    color: '#555',
    fontSize: 18,
    marginTop: 16,
  },
  coursesList: {
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
  joinButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  joinedButton: {
    backgroundColor: '#333',
  },
  pendingButton: {
    backgroundColor: '#FFA500',
  },
  joinButtonText: {
    color: Colors.black,
    fontWeight: 'bold',
    fontSize: 14,
  },
  joinedButtonText: {
    color: Colors.white,
  },
  pendingButtonText: {
    color: Colors.black,
  },
});
