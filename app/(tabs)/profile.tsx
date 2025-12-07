import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { collection, getCountFromServer, getDocs, query, where } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';
import { useAuth } from '../../hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [stats, setStats] = useState({
    studyGroups: 0,
    messages: 0,
    filesShared: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const scrollViewRef = React.useRef<ScrollView>(null);

  const fetchUserStats = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setStatsLoading(true);

      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Stats loading timeout')), 10000)
      );

      const statsPromise = (async () => {
        // Count study groups (courses where user is a member)
        const coursesRef = collection(db, 'courses');
        const coursesQuery = query(coursesRef, where('members', 'array-contains', user.uid));
        const coursesSnapshot = await getCountFromServer(coursesQuery);
        const studyGroups = coursesSnapshot.data().count;

        // Get course IDs for message counting
        const coursesDocsSnapshot = await getDocs(coursesQuery);
        
        // Count messages in parallel across all courses
        const messageCountPromises = coursesDocsSnapshot.docs.map(async (courseDoc) => {
          try {
            const messagesRef = collection(db, 'courses', courseDoc.id, 'messages');
            const messagesQuery = query(messagesRef, where('senderId', '==', user.uid));
            const messagesCount = await getCountFromServer(messagesQuery);
            return messagesCount.data().count;
          } catch (error) {
            console.error(`Error counting messages for course ${courseDoc.id}:`, error);
            return 0;
          }
        });

        const messageCounts = await Promise.all(messageCountPromises);
        const totalMessages = messageCounts.reduce((sum, count) => sum + count, 0);

        // For files shared, we'll use 0 for now since we don't have file tracking yet
        const filesShared = 0;

        return {
          studyGroups,
          messages: totalMessages,
          filesShared,
        };
      })();

      // Race between stats fetching and timeout
      const result = await Promise.race([statsPromise, timeoutPromise]);
      setStats(result as typeof stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Set default values on error
      setStats({
        studyGroups: 0,
        messages: 0,
        filesShared: 0,
      });
    } finally {
      setStatsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadSettings();
  }, []);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshUser = async () => {
        if (auth.currentUser) {
          await auth.currentUser.reload();
        }
      };
      refreshUser();
      fetchUserStats();
    }, [fetchUserStats])
  );

  const handleSettingsPress = () => {
    setShowSettings(!showSettings);
    if (!showSettings) {
      // Scroll to bottom to show settings
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const loadSettings = async () => {
    try {
      const theme = await AsyncStorage.getItem('theme');
      if (theme !== null) setIsDarkMode(theme === 'dark');
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkMode;
      setIsDarkMode(newTheme);
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
      
      const message = `Switched to ${newTheme ? 'Dark' : 'Light'} mode. Restart app to see full effect.`;
      if (Platform.OS === 'web') {
        alert(`Theme Changed\n\n${message}`);
      } else {
        Alert.alert('Theme Changed', message);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: Colors.white }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.headerButton} onPress={handleSettingsPress}>
            <Ionicons 
              name={showSettings ? "settings" : "settings-outline"} 
              size={24} 
              color={Colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>
                  {(user?.displayName || user?.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.name}>{user?.displayName || 'Student'}</Text>
          <Text style={styles.bio}>
            Computer Science Student | Study Group Enthusiast | Always ready to help with algorithms and data structures!
          </Text>
          <Text style={styles.email}>{user?.email || 'No email'}</Text>
          <Text style={styles.joinedDate}>
            Joined on {user?.metadata?.creationTime 
              ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })
              : 'Unknown'}
          </Text>
        </View>

        {/* Stats */}
        {statsLoading ? (
          <View style={styles.statsLoadingContainer}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.statsLoadingText}>Loading stats...</Text>
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.studyGroups}</Text>
              <Text style={styles.statLabel}>Study Groups</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.messages}</Text>
              <Text style={styles.statLabel}>Messages</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.filesShared}</Text>
              <Text style={styles.statLabel}>Files Shared</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('/edit-profile')}
          >
            <Text style={styles.primaryButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Settings Section - Toggle visibility */}
        {showSettings && (
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            
            <TouchableOpacity style={styles.settingItem} onPress={toggleTheme}>
              <View style={styles.settingLeft}>
                <Ionicons name={isDarkMode ? 'moon' : 'sunny'} size={22} color={Colors.primary} />
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <View style={[styles.toggleButton, isDarkMode && styles.toggleButtonActive]}>
                <View style={[styles.toggleCircle, isDarkMode && styles.toggleCircleActive]} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="lock-closed" size={22} color={Colors.primary} />
                <Text style={styles.settingText}>Privacy</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle" size={22} color={Colors.primary} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="information-circle" size={22} color={Colors.primary} />
                <Text style={styles.settingText}>About</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomWidth: 0 }]}
              onPress={handleLogout}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out" size={22} color="#FF4444" />
                <Text style={[styles.settingText, { color: '#FF4444' }]}>Logout</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
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
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  profileInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.primary,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: Colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  email: {
    fontSize: 14,
    color: Colors.textGray,
    marginBottom: 4,
  },
  joinedDate: {
    fontSize: 12,
    color: '#555',
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginTop: 32,
    marginBottom: 32,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textGray,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  settingsSection: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    color: Colors.white,
  },
  toggleButton: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    padding: 2,
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.primary,
  },
  toggleCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.white,
  },
  toggleCircleActive: {
    alignSelf: 'flex-end',
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
