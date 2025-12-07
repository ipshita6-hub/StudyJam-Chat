import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalCourses: 0,
    activeUsers: 0,
    activeAnnouncements: 0,
    pendingRequests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      // Fetch total courses
      const coursesSnapshot = await getDocs(collection(db, 'courses'));
      const totalCourses = coursesSnapshot.size;

      // Fetch active users (users with status 'Active' or without status field)
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let activeUsers = 0;
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        // Count as active if status is 'Active' or status field doesn't exist
        if (!data.status || data.status === 'Active') {
          activeUsers++;
        }
      });

      // Fetch active announcements
      const announcementsRef = collection(db, 'announcements');
      const activeAnnouncementsQuery = query(announcementsRef, where('isActive', '==', true));
      const activeAnnouncementsSnapshot = await getDocs(activeAnnouncementsQuery);
      const activeAnnouncements = activeAnnouncementsSnapshot.size;

      // Fetch pending join requests
      const requestsRef = collection(db, 'joinRequests');
      const pendingRequestsQuery = query(requestsRef, where('status', '==', 'pending'));
      const pendingRequestsSnapshot = await getDocs(pendingRequestsQuery);
      const pendingRequests = pendingRequestsSnapshot.size;

      setStats({
        totalCourses,
        activeUsers,
        activeAnnouncements,
        pendingRequests,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      setShowLogoutModal(true);
    } else {
      Alert.alert('Logout', 'Are you sure you want to logout?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: confirmLogout,
        },
      ]);
    }
  };

  const confirmLogout = async () => {
    try {
      setShowLogoutModal(false);
      
      // Try to clear storage, but don't fail if it errors
      try {
        await AsyncStorage.clear();
      } catch (storageError) {
        console.log('Storage clear error (non-critical):', storageError);
      }
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Force navigation to login
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      if (Platform.OS === 'web') {
        alert('Failed to logout. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to logout. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>StudyJam Course Management</Text>
          </View>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#FF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Action Cards */}
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/join-requests')}>
            <View style={[styles.iconCircle, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="person-add-outline" size={24} color={Colors.white} />
            </View>
            <Text style={styles.cardTitle}>Join Requests</Text>
            <Text style={styles.cardSubtitle}>Approve new members</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/create-course')}>
            <View style={[styles.iconCircle, { backgroundColor: '#FFD700' }]}>
              <Ionicons name="add" size={24} color={Colors.black} />
            </View>
            <Text style={styles.cardTitle}>Create Course</Text>
            <Text style={styles.cardSubtitle}>Add new study group</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/remove-users')}>
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="person-remove-outline" size={24} color="#FF4444" />
            </View>
            <Text style={styles.cardTitle}>Remove Users</Text>
            <Text style={styles.cardSubtitle}>Manage memberships</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/post-announcement')}>
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="megaphone-outline" size={24} color="#FFD700" />
            </View>
            <Text style={styles.cardTitle}>Post Announcement</Text>
            <Text style={styles.cardSubtitle}>Notify all groups</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/user-management')}>
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="people-outline" size={24} color="#FFD700" />
            </View>
            <Text style={styles.cardTitle}>User Management</Text>
            <Text style={styles.cardSubtitle}>View all members</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/chat')}>
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="chatbubbles-outline" size={24} color="#FFD700" />
            </View>
            <Text style={styles.cardTitle}>Chat</Text>
            <Text style={styles.cardSubtitle}>View course chats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => router.push('/admin/view-announcements')}>
            <View style={[styles.iconCircle, { backgroundColor: '#333' }]}>
              <Ionicons name="list-outline" size={24} color="#FFD700" />
            </View>
            <Text style={styles.cardTitle}>View Announcements</Text>
            <Text style={styles.cardSubtitle}>Manage announcements</Text>
          </TouchableOpacity>
        </View>

        {/* Platform Statistics */}
        <View style={styles.statsHeader}>
          <Text style={styles.sectionTitle}>Platform Statistics</Text>
          <TouchableOpacity onPress={fetchStatistics} style={styles.refreshIconButton}>
            <Ionicons name="refresh" size={20} color="#FFD700" />
          </TouchableOpacity>
        </View>
        
        {loading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color="#FFD700" />
            <Text style={styles.statsLoadingText}>Loading statistics...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="book-outline" size={24} color="#FFD700" style={styles.statIcon} />
                <Text style={styles.statNumber}>{stats.totalCourses}</Text>
                <Text style={styles.statLabel}>Total Courses</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={24} color="#4CAF50" style={styles.statIcon} />
                <Text style={styles.statNumber}>{stats.activeUsers}</Text>
                <Text style={styles.statLabel}>Active Users</Text>
              </View>
            </View>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="megaphone-outline" size={24} color="#4A90E2" style={styles.statIcon} />
                <Text style={styles.statNumber}>{stats.activeAnnouncements}</Text>
                <Text style={styles.statLabel}>Announcements</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="person-add-outline" size={24} color="#FF9800" style={styles.statIcon} />
                <Text style={styles.statNumber}>{stats.pendingRequests}</Text>
                <Text style={styles.statLabel}>Pending Requests</Text>
              </View>
            </View>
          </>
        )}





      </ScrollView>

      {/* Logout Confirmation Modal for Web */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="log-out-outline" size={48} color="#FF4444" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalLogoutButton}
                onPress={confirmLogout}
              >
                <Text style={styles.modalLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  header: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  logoutText: {
    color: '#FF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFD700',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  card: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 12,
    color: Colors.textGray,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textGray,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshIconButton: {
    padding: 4,
  },
  statIcon: {
    marginBottom: 8,
  },
  statsLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  statsLoadingText: {
    color: Colors.textGray,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  modalLogoutButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  modalLogoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
