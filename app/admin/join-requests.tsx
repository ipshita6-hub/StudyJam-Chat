import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
    arrayUnion,
    collection,
    doc,
    increment,
    onSnapshot,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
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
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { db } from '../../FirebaseConfig';

interface JoinRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  courseId: string;
  courseName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
}

export default function JoinRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [confirmReject, setConfirmReject] = useState<JoinRequest | null>(null);

  useEffect(() => {
    const requestsRef = collection(db, 'joinRequests');

    // Fetch all requests and filter client-side
    const unsubscribe = onSnapshot(requestsRef, (snapshot) => {
      console.log('Total documents in joinRequests:', snapshot.docs.length);
      
      const allRequests = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        console.log('Request:', docSnap.id, 'Status:', data.status, 'Data:', data);
        return {
          id: docSnap.id,
          ...data,
        };
      }) as JoinRequest[];
      
      // Filter for pending requests
      const pendingRequests = allRequests.filter(req => req.status === 'pending');
      console.log('Pending requests:', pendingRequests.length);
      
      // Sort by createdAt client-side (newest first)
      pendingRequests.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || 0;
        const timeB = b.createdAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      
      setRequests(pendingRequests);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching join requests:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  const handleApprove = async (request: JoinRequest) => {
    try {
      setProcessing(request.id);
      console.log('Approving request:', request.id, 'for user:', request.userId, 'to course:', request.courseId);

      // Step 1: Add user to course members
      const courseRef = doc(db, 'courses', request.courseId);
      await updateDoc(courseRef, {
        members: arrayUnion(request.userId),
        enrolledCount: increment(1),
      });
      console.log('User added to course members');

      // Step 2: Update request status to approved
      const requestRef = doc(db, 'joinRequests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        approvedAt: serverTimestamp(),
      });
      console.log('Request status updated to approved');

      Alert.alert('Success', `${request.userName} has been added to ${request.courseName}`);
    } catch (error) {
      console.error('Error approving request:', error);
      Alert.alert('Error', 'Failed to approve request. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: JoinRequest) => {
    if (Platform.OS === 'web') {
      // Use custom modal for web
      setConfirmReject(request);
    } else {
      // Use native Alert for mobile
      Alert.alert(
        'Reject Request',
        `Are you sure you want to reject ${request.userName}'s request to join ${request.courseName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => confirmRejectRequest(request),
          },
        ]
      );
    }
  };

  const confirmRejectRequest = async (request: JoinRequest) => {
    try {
      setProcessing(request.id);
      setConfirmReject(null);
      const requestRef = doc(db, 'joinRequests', request.id);
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
      });
      
      if (Platform.OS === 'web') {
        alert('Request rejected successfully');
      } else {
        Alert.alert('Request Rejected', 'The join request has been rejected.');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      if (Platform.OS === 'web') {
        alert('Failed to reject request. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to reject request.');
      }
    } finally {
      setProcessing(null);
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
        <TouchableOpacity onPress={() => router.replace('/admin/dashboard')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Join Requests</Text>
          <Text style={styles.headerSubtitle}>{requests.length} pending request{requests.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle-outline" size={64} color="#555" />
          <Text style={styles.emptyText}>No pending requests</Text>
          <Text style={styles.emptySubtext}>All join requests have been processed</Text>
        </View>
      ) : (
        <ScrollView style={styles.requestsList} showsVerticalScrollIndicator={false}>
          {requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {request.userName?.charAt(0)?.toUpperCase() || '?'}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{request.userName}</Text>
                  <Text style={styles.userEmail}>{request.userEmail}</Text>
                </View>
              </View>

              <View style={styles.courseInfo}>
                <Ionicons name="book-outline" size={16} color="#FFD700" />
                <Text style={styles.courseName}>Wants to join: {request.courseName}</Text>
              </View>

              <View style={styles.timeInfo}>
                <Ionicons name="time-outline" size={14} color={Colors.textGray} />
                <Text style={styles.timeText}>{formatDate(request.createdAt)}</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleReject(request)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color="#FF4444" />
                  ) : (
                    <>
                      <Ionicons name="close" size={18} color="#FF4444" />
                      <Text style={styles.rejectText}>Reject</Text>
                    </>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApprove(request)}
                  disabled={processing === request.id}
                >
                  {processing === request.id ? (
                    <ActivityIndicator size="small" color={Colors.black} />
                  ) : (
                    <>
                      <Ionicons name="checkmark" size={18} color={Colors.black} />
                      <Text style={styles.approveText}>Approve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Confirmation Modal for Web */}
      <Modal
        visible={confirmReject !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmReject(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reject Request</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to reject {confirmReject?.userName}'s request to join {confirmReject?.courseName}?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setConfirmReject(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRejectButton}
                onPress={() => confirmReject && confirmRejectRequest(confirmReject)}
              >
                <Text style={styles.modalRejectText}>Reject</Text>
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
  },
  emptySubtext: {
    color: '#444',
    fontSize: 14,
    marginTop: 8,
  },
  requestsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.black,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.textGray,
    marginTop: 2,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  courseName: {
    fontSize: 14,
    color: Colors.white,
    flex: 1,
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  timeText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#222',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  rejectText: {
    fontSize: 14,
    color: '#FF4444',
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    paddingVertical: 12,
    borderRadius: 8,
  },
  approveText: {
    fontSize: 14,
    color: Colors.black,
    fontWeight: '600',
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
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 15,
    color: Colors.textGray,
    lineHeight: 22,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
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
  modalRejectButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  modalRejectText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
