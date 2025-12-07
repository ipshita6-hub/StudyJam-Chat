import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
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

const COURSE_CATEGORIES = [
  { id: 'history', label: 'History', icon: '📚', color: '#E74C3C' },
  { id: 'math', label: 'Mathematics', icon: '📐', color: '#3498DB' },
  { id: 'science', label: 'Science', icon: '🔬', color: '#2ECC71' },
  { id: 'computer', label: 'Computer Science', icon: '💻', color: '#9B59B6' },
  { id: 'language', label: 'Languages', icon: '🗣️', color: '#F39C12' },
  { id: 'art', label: 'Art & Design', icon: '🎨', color: '#E91E63' },
  { id: 'music', label: 'Music', icon: '🎵', color: '#00BCD4' },
  { id: 'business', label: 'Business', icon: '💼', color: '#795548' },
  { id: 'other', label: 'Other', icon: '📖', color: '#607D8B' },
];

export default function CreateCourseScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [maxMembers, setMaxMembers] = useState('50');
  const [loading, setLoading] = useState(false);

  const handleCreateCourse = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a course name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a course description');
      return;
    }

    if (!category) {
      Alert.alert('Error', 'Please select a category');
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to create a course');
      return;
    }

    try {
      setLoading(true);

      const selectedCategory = COURSE_CATEGORIES.find((c) => c.id === category);

      await addDoc(collection(db, 'courses'), {
        name: name.trim(),
        description: description.trim(),
        category,
        categoryIcon: selectedCategory?.icon || '📖',
        categoryColor: selectedCategory?.color || '#607D8B',
        maxMembers: parseInt(maxMembers) || 50,
        members: [currentUser.uid],
        enrolledCount: 1,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName || 'Admin',
        createdByEmail: currentUser.email,
        isActive: true,
        lastMessage: null,
        lastMessageTime: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        'Success',
        'Course created successfully!',
        [
          {
            text: 'Create Another',
            onPress: () => {
              setName('');
              setDescription('');
              setCategory('');
              setMaxMembers('50');
            },
          },
          {
            text: 'Go Back',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating course:', error);
      Alert.alert('Error', error.message || 'Failed to create course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.replace("/admin/dashboard")} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Create Course</Text>
            <Text style={styles.headerSubtitle}>Add a new study group</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Course Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Course Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter course name"
              placeholderTextColor={Colors.textGray}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
            <Text style={styles.charCount}>{name.length}/50</Text>
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe what this course is about..."
              placeholderTextColor={Colors.textGray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={300}
            />
            <Text style={styles.charCount}>{description.length}/300</Text>
          </View>

          {/* Category Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryGrid}>
              {COURSE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    category === cat.id && styles.categoryCardActive,
                    category === cat.id && { borderColor: cat.color },
                  ]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.categoryIcon}>{cat.icon}</Text>
                  <Text
                    style={[
                      styles.categoryLabel,
                      category === cat.id && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Max Members */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Maximum Members</Text>
            <View style={styles.memberInputRow}>
              <TouchableOpacity
                style={styles.memberButton}
                onPress={() => setMaxMembers(String(Math.max(5, parseInt(maxMembers) - 5)))}
              >
                <Ionicons name="remove" size={20} color={Colors.white} />
              </TouchableOpacity>
              <TextInput
                style={styles.memberInput}
                value={maxMembers}
                onChangeText={(text) => setMaxMembers(text.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                maxLength={4}
              />
              <TouchableOpacity
                style={styles.memberButton}
                onPress={() => setMaxMembers(String(Math.min(1000, parseInt(maxMembers) + 5)))}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Preview */}
          <View style={styles.previewContainer}>
            <Text style={styles.previewLabel}>Preview</Text>
            <View style={styles.previewCard}>
              <View
                style={[
                  styles.previewAvatar,
                  {
                    backgroundColor:
                      COURSE_CATEGORIES.find((c) => c.id === category)?.color || '#FFD700',
                  },
                ]}
              >
                <Text style={styles.previewEmoji}>
                  {COURSE_CATEGORIES.find((c) => c.id === category)?.icon || '📖'}
                </Text>
              </View>
              <View style={styles.previewContent}>
                <Text style={styles.previewName}>{name || 'Course Name'}</Text>
                <Text style={styles.previewDescription} numberOfLines={2}>
                  {description || 'Course description will appear here...'}
                </Text>
                <View style={styles.previewMeta}>
                  <Ionicons name="people" size={14} color={Colors.textGray} />
                  <Text style={styles.previewMetaText}>0/{maxMembers || 50} members</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createButton, loading && styles.createButtonDisabled]}
            onPress={handleCreateCourse}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.black} />
            ) : (
              <>
                <Ionicons name="add-circle" size={24} color={Colors.black} />
                <Text style={styles.createButtonText}>Create Course</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    height: 100,
    paddingTop: 16,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 4,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '31%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  categoryCardActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryLabel: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    fontWeight: '600',
  },
  memberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberInput: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    color: Colors.white,
    fontSize: 18,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333',
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
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewEmoji: {
    fontSize: 28,
  },
  previewContent: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  previewDescription: {
    fontSize: 13,
    color: Colors.textGray,
    marginBottom: 8,
    lineHeight: 18,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetaText: {
    fontSize: 12,
    color: Colors.textGray,
  },
  createButton: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
});
