import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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

type AnnouncementType = 'info' | 'warning' | 'success' | 'urgent';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: string;
  authorName: string;
  createdAt: any;
  isActive: boolean;
  viewCount: number;
}

export default function ViewAnnouncementsScreen() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredAnnouncements(announcements);
    } else {
      const filtered = announcements.filter(
        (announcement) =>
          announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          announcement.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAnnouncements(filtered);
    }
  }, [searchQuery, announcements]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const announcementsRef = collection(db, 'announcements');
      const q = query(announcementsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);

      const announcementsData: Announcement[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        announcementsData.push({
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          type: data.type || 'info',
          priority: data.priority || 'medium',
          authorName: data.authorName || 'Admin',
          createdAt: data.createdAt,
          isActive: data.isActive !== false,
          viewCount: data.viewCount || 0,
        });
      });

      setAnnouncements(announcementsData);
      setFilteredAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      Alert.alert('Error', 'Failed to fetch announcements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!selectedAnnouncement) return;

    try {
      setDeleting(true);
      await deleteDoc(doc(db, 'announcements', selectedAnnouncement.id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== selectedAnnouncement.id));
      setModalVisible(false);
      setSelectedAnnouncement(null);
      Alert.alert('Success', 'Announcement deleted successfully');
    } catch (error) {
      console.error('Error deleting announcement:', error);
      Alert.alert('Error', 'Failed to delete announcement');
    } finally {
      setDeleting(false);
    }
  };

  const toggleActiveStatus = async (announcement: Announcement) => {
    try {
      const newStatus = !announcement.isActive;
      await updateDoc(doc(db, 'announcements', announcement.id), {
        isActive: newStatus,
      });

      setAnnouncements((prev) =>
        prev.map((a) => (a.id === announcement.id ? { ...a, isActive: newStatus } : a))
      );

      Alert.alert(
        'Success',
        `Announcement ${newStatus ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      console.error('Error updating announcement:', error);
      Alert.alert('Error', 'Failed to update announcement status');
    }
  };

  const getTypeColor = (type: AnnouncementType) => {
    switch (type) {
      case 'info':
        return '#4A90E2';
      case 'warning':
        return '#FFD700';
      case 'success':
        return '#4CAF50';
      case 'urgent':
        return '#FF4444';
      default:
        return '#4A90E2';
    }
  };

  const getTypeIcon = (type: AnnouncementType) => {
    switch (type) {
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'urgent':
        return 'alert-circle';
      default:
        return 'information-circle';
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate();
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/admin/dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Announcements</Text>
          <Text style={styles.headerSubtitle}>Manage all announcements</Text>
        </View>
        <TouchableOpacity onPress={fetchAnnouncements} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Search and Add */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search announcements..."
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
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/admin/post-announcement')}
        >
          <Ionicons name="add" size={24} color={Colors.black} />
        </TouchableOpacity>
      </View>

      {/* Count */}
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading announcements...</Text>
        </View>
      ) : filteredAnnouncements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="megaphone-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No announcements found</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/admin/post-announcement')}
          >
            <Text style={styles.createButtonText}>Create Announcement</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.announcementList} showsVerticalScrollIndicator={false}>
          {filteredAnnouncements.map((announcement) => (
            <View
              key={announcement.id}
              style={[
                styles.announcementCard,
                { borderLeftColor: getTypeColor(announcement.type) },
                !announcement.isActive && styles.inactiveCard,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.typeContainer}>
                  <Ionicons
                    name={getTypeIcon(announcement.type) as any}
                    size={20}
                    color={getTypeColor(announcement.type)}
                  />
                  <Text style={[styles.typeText, { color: getTypeColor(announcement.type) }]}>
                    {announcement.type.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.statusBadge}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: announcement.isActive ? '#4CAF50' : '#666' },
                    ]}
                  />
                  <Text style={styles.statusText}>
                    {announcement.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <Text style={styles.announcementTitle}>{announcement.title}</Text>
              <Text style={styles.announcementMessage} numberOfLines={3}>
                {announcement.message}
              </Text>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="person" size={14} color={Colors.textGray} />
                  <Text style={styles.metaText}>{announcement.authorName}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={Colors.textGray} />
                  <Text style={styles.metaText}>{formatDate(announcement.createdAt)}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="eye" size={14} color={Colors.textGray} />
                  <Text style={styles.metaText}>{announcement.viewCount} views</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => toggleActiveStatus(announcement)}
                >
                  <Ionicons
                    name={announcement.isActive ? 'pause-circle' : 'play-circle'}
                    size={20}
                    color="#FFD700"
                  />
                  <Text style={styles.actionText}>
                    {announcement.isActive ? 'Deactivate' : 'Activate'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteAnnouncement(announcement)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF4444" />
                  <Text style={[styles.actionText, { color: '#FF4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning" size={48} color="#FF4444" />
            </View>
            <Text style={styles.modalTitle}>Delete Announcement?</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to delete "{selectedAnnouncement?.title}"?
            </Text>
            <Text style={styles.modalWarning}>This action cannot be undone.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.confirmButtonText}>Delete</Text>
                )}
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
  searchRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  countText: {
    color: Colors.textGray,
    fontSize: 14,
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
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: Colors.black,
    fontSize: 16,
    fontWeight: 'bold',
  },
  announcementList: {
    flex: 1,
    paddingHorizontal: 20,
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
  inactiveCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#222',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    color: Colors.textGray,
    fontWeight: '600',
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  announcementMessage: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionText: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalIconContainer: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.textGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalWarning: {
    fontSize: 13,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
