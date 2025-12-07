import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { arrayRemove, arrayUnion, collection, doc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';

interface Course {
  id: string;
  name: string;
  description: string;
  categoryIcon: string;
  members: string[];
  enrolledCount: number;
  lastMessage: string | null;
  lastMessageTime: string | null;
  pinnedBy?: string[];
}

export default function ChatsScreen() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptionsFor, setShowOptionsFor] = useState<string | null>(null);
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
      
      // Sort: pinned courses first, then by last message time
      const sortedCourses = coursesData.sort((a, b) => {
        const aIsPinned = a.pinnedBy?.includes(currentUser.uid) || false;
        const bIsPinned = b.pinnedBy?.includes(currentUser.uid) || false;
        
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;
        
        // Sort by last message time
        const aTime = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const bTime = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return bTime - aTime;
      });
      
      setCourses(sortedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleChatPress = (course: Course) => {
    router.push({
      pathname: '/course-chat',
      params: {
        courseId: course.id,
        courseName: course.name,
        members: course.enrolledCount?.toString() || '0',
        from: 'student',
      },
    });
  };

  const handleTogglePin = async (courseId: string, isPinned: boolean) => {
    if (!currentUser) return;
    
    try {
      const courseRef = doc(db, 'courses', courseId);
      
      await updateDoc(courseRef, {
        pinnedBy: isPinned ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
      });
      setShowOptionsFor(null);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const handleLeaveCourse = async (courseId: string, courseName: string) => {
    if (!currentUser) return;

    const confirmLeave = Platform.OS === 'web'
      ? window.confirm(`Are you sure you want to leave "${courseName}"?`)
      : true;

    if (!confirmLeave && Platform.OS === 'web') return;

    if (Platform.OS !== 'web') {
      Alert.alert(
        'Leave Course',
        `Are you sure you want to leave "${courseName}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Leave',
            style: 'destructive',
            onPress: async () => {
              await performLeave(courseId);
            },
          },
        ]
      );
    } else {
      await performLeave(courseId);
    }
  };

  const performLeave = async (courseId: string) => {
    if (!currentUser) return;
    
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        members: arrayRemove(currentUser.uid),
        enrolledCount: courses.find(c => c.id === courseId)?.enrolledCount ? 
          (courses.find(c => c.id === courseId)!.enrolledCount - 1) : 0,
      });
      setShowOptionsFor(null);
    } catch (error) {
      console.error('Error leaving course:', error);
      if (Platform.OS === 'web') {
        alert('Failed to leave course. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to leave course. Please try again.');
      }
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (days === 1) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString();
      }
    } catch {
      return '';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Chats</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => router.push('/browse-courses')}>
          <Ionicons name="add" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Backdrop */}
      {showOptionsFor && (
        <TouchableWithoutFeedback onPress={() => setShowOptionsFor(null)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading chats...</Text>
        </View>
      ) : courses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubtext}>Join a course and wait for admin approval to start chatting</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => router.push('/browse-courses')}>
            <Text style={styles.browseButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {courses.map((course) => {
            const isPinned = course.pinnedBy?.includes(currentUser?.uid || '') || false;
            
            return (
              <View key={course.id} style={styles.chatItemWrapper}>
                {isPinned && (
                  <View style={styles.pinnedBadge}>
                    <Ionicons name="pin" size={12} color={Colors.primary} />
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[styles.chatItem, isPinned && styles.chatItemPinned]}
                  onPress={() => handleChatPress(course)}
                  onLongPress={() => setShowOptionsFor(course.id)}
                  delayLongPress={500}
                  activeOpacity={0.7}
                >
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{course.categoryIcon || '📚'}</Text>
                    </View>
                  </View>

                  <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                      <Text style={styles.courseName}>{course.name}</Text>
                      <Text style={styles.time}>{formatTime(course.lastMessageTime)}</Text>
                    </View>

                    <View style={styles.chatFooter}>
                      <Text style={styles.lastMessage} numberOfLines={1}>
                        {course.lastMessage || 'No messages yet'}
                      </Text>
                    </View>

                    <View style={styles.membersInfo}>
                      <Ionicons name="people" size={12} color={Colors.textGray} />
                      <Text style={styles.membersText}>{course.enrolledCount || 0} members</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setShowOptionsFor(course.id)}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textGray} />
                  </TouchableOpacity>
                </TouchableOpacity>

                {showOptionsFor === course.id && (
                  <View style={styles.optionsMenu}>
                    <TouchableOpacity
                      style={styles.optionItem}
                      onPress={() => handleTogglePin(course.id, isPinned)}
                    >
                      <Ionicons 
                        name={isPinned ? "pin" : "pin-outline"} 
                        size={20} 
                        color={Colors.white} 
                      />
                      <Text style={styles.optionText}>
                        {isPinned ? 'Unpin' : 'Pin'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.optionItem, styles.optionItemDanger]}
                      onPress={() => handleLeaveCourse(course.id, course.name)}
                    >
                      <Ionicons name="exit-outline" size={20} color="#FF4444" />
                      <Text style={[styles.optionText, styles.optionTextDanger]}>Leave Course</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
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
  },
  chatItemWrapper: {
    position: 'relative',
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatItemPinned: {
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  pinnedText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  time: {
    fontSize: 12,
    color: Colors.textGray,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lastMessage: {
    fontSize: 14,
    color: Colors.textGray,
    flex: 1,
    marginRight: 8,
  },
  membersInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  membersText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  moreButton: {
    padding: 8,
    justifyContent: 'center',
  },
  optionsMenu: {
    position: 'absolute',
    right: 20,
    top: 60,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 8,
    zIndex: 1000,
    minWidth: 160,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  optionItemDanger: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 4,
  },
  optionText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '500',
  },
  optionTextDanger: {
    color: '#FF4444',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
