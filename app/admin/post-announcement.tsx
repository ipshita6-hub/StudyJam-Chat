import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { auth, db } from '../../FirebaseConfig';

type AnnouncementType = 'info' | 'warning' | 'success' | 'urgent';
type AnnouncementPriority = 'low' | 'medium' | 'high';

export default function PostAnnouncementScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<AnnouncementType>('info');
  const [priority, setPriority] = useState<AnnouncementPriority>('medium');
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const announcementTypes: { value: AnnouncementType; label: string; icon: string; color: string }[] = [
    { value: 'info', label: 'Info', icon: 'information-circle', color: '#4A90E2' },
    { value: 'warning', label: 'Warning', icon: 'warning', color: '#FFD700' },
    { value: 'success', label: 'Success', icon: 'checkmark-circle', color: '#4CAF50' },
    { value: 'urgent', label: 'Urgent', icon: 'alert-circle', color: '#FF4444' },
  ];

  const priorities: { value: AnnouncementPriority; label: string }[] = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title');
      return;
    }

    if (!message.trim()) {
      showAlert('Error', 'Please enter a message');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      showAlert('Error', 'You must be logged in to post announcements');
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, 'announcements'), {
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Admin',
        authorEmail: currentUser.email,
        createdAt: serverTimestamp(),
        isActive: true,
        viewCount: 0,
      });

      if (Platform.OS === 'web') {
        setShowSuccessModal(true);
      } else {
        Alert.alert(
          'Success',
          'Announcement posted successfully!',
          [
            {
              text: 'Post Another',
              onPress: () => {
                setTitle('');
                setMessage('');
                setType('info');
                setPriority('medium');
              },
            },
            {
              text: 'Go Back',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      console.error('Error posting announcement:', error);
      showAlert('Error', error.message || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handlePostAnother = () => {
    setShowSuccessModal(false);
    setTitle('');
    setMessage('');
    setType('info');
    setPriority('medium');
  };

  const handleGoBack = () => {
    setShowSuccessModal(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Post Announcement</Text>
            <Text style={styles.headerSubtitle}>Notify all users</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter announcement title"
              placeholderTextColor={Colors.textGray}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <Text style={styles.charCount}>{title.length}/100</Text>
          </View>

          {/* Message Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter announcement message"
              placeholderTextColor={Colors.textGray}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.charCount}>{message.length}/500</Text>
          </View>

          {/* Type Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.typeGrid}>
              {announcementTypes.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.typeCard,
                    type === item.value && styles.typeCardActive,
                    { borderColor: type === item.value ? item.color : '#333' },
                  ]}
                  onPress={() => setType(item.value)}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={28}
                    color={type === item.value ? item.color : '#666'}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      type === item.value && { color: item.color },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Priority Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Priority</Text>
            <View style={styles.priorityRow}>
              {priorities.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.priorityButton,
                    priority === item.value && styles.priorityButtonActive,
                  ]}
                  onPress={() => setPriority(item.value)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      priority === item.value && styles.priorityTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View
              style={[
                styles.previewCard,
                {
                  borderLeftColor:
                    announcementTypes.find((t) => t.value === type)?.color || '#4A90E2',
                },
              ]}
            >
              <View style={styles.previewHeader}>
                <Ionicons
                  name={
                    (announcementTypes.find((t) => t.value === type)?.icon as any) ||
                    'information-circle'
                  }
                  size={20}
                  color={announcementTypes.find((t) => t.value === type)?.color || '#4A90E2'}
                />
                <Text style={styles.previewTitle}>{title || 'Announcement Title'}</Text>
              </View>
              <Text style={styles.previewMessage}>
                {message || 'Your announcement message will appear here...'}
              </Text>
              <View style={styles.previewFooter}>
                <Text style={styles.previewMeta}>
                  {auth.currentUser?.displayName || 'Admin'} • Just now
                </Text>
                <View
                  style={[
                    styles.priorityBadge,
                    priority === 'high' && styles.priorityBadgeHigh,
                    priority === 'low' && styles.priorityBadgeLow,
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>{priority.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Post Button */}
          <TouchableOpacity
            style={[styles.postButton, loading && styles.postButtonDisabled]}
            onPress={handlePostAnnouncement}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Ionicons name="megaphone" size={20} color={Colors.black} />
                <Text style={styles.postButtonText}>Post Announcement</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Success Modal for Web */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            </View>
            <Text style={styles.modalTitle}>Success!</Text>
            <Text style={styles.modalMessage}>
              Announcement posted successfully!
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalSecondaryButton}
                onPress={handlePostAnother}
              >
                <Text style={styles.modalSecondaryText}>Post Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryButton}
                onPress={handleGoBack}
              >
                <Text style={styles.modalPrimaryText}>Go Back</Text>
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
  keyboardView: {
    flex: 1,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    color: Colors.white,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    height: 120,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    width: '48%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  typeCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  priorityButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  priorityTextActive: {
    color: Colors.black,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
  },
  previewMessage: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMeta: {
    fontSize: 12,
    color: '#666',
  },
  priorityBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityBadgeHigh: {
    backgroundColor: '#FF4444',
  },
  priorityBadgeLow: {
    backgroundColor: '#666',
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.black,
  },
  postButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  postButtonDisabled: {
    opacity: 0.6,
  },
  postButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
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
  successIcon: {
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
  modalSecondaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#444',
    alignItems: 'center',
  },
  modalSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  modalPrimaryButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  modalPrimaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.black,
  },
});
