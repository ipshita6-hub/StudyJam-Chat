import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { collection, getDocs, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
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
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { db, auth } from '../../FirebaseConfig';

interface UserData {
  id: string;
  email: string;
  displayName: string;
  role: string;
  status: string;
  course: string;
  courses: string[];
}

export default function UserManagementScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'member',
    course: '',
  });
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(
        (user) =>
          user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.course.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || data.fullName || 'Unknown User',
          role: data.role || 'member',
          status: data.status || 'Active',
          course: data.courses?.[0] || 'No Course',
          courses: data.courses || [],
        });
      });
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.displayName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setAddingUser(true);
      const userCredential = await createUserWithEmailAndPassword(auth, newUser.email, newUser.password);
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        status: 'Active',
        courses: newUser.course ? [newUser.course] : [],
        createdAt: new Date().toISOString(),
      });

      Alert.alert('Success', 'User added successfully');
      setShowAddUserModal(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'member', course: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding user:', error);
      Alert.alert('Error', error.message || 'Failed to add user');
    } finally {
      setAddingUser(false);
    }
  };

  const handleEditUser = (user: UserData) => {
    Alert.alert('Edit User', `Edit functionality for ${user.displayName} coming soon!`);
  };

  const handleDeleteUser = (user: UserData) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.id));
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
              Alert.alert('Success', 'User deleted successfully');
            } catch (error) {
              console.error('Error deleting user:', error);
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/admin/dashboard")} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>User Management</Text>
          <Text style={styles.headerSubtitle}>Manage all users</Text>
        </View>
        <TouchableOpacity onPress={fetchUsers} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color="#FFD700" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={Colors.textGray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.loadingText}>Loading users...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, styles.colUser]}>User</Text>
            <Text style={[styles.columnHeader, styles.colCourse]}>Course</Text>
            <Text style={[styles.columnHeader, styles.colRole]}>Role</Text>
            <Text style={[styles.columnHeader, styles.colStatus]}>Status</Text>
            <Text style={[styles.columnHeader, styles.colActions]}>Actions</Text>
          </View>

          {/* User Rows */}
          {filteredUsers.map((user) => (
            <View key={user.id} style={styles.userRow}>
              <View style={[styles.userCell, styles.colUser]}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{user.displayName.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.userName} numberOfLines={1}>
                  {user.displayName}
                </Text>
              </View>
              
              <Text style={[styles.cellText, styles.colCourse]} numberOfLines={1}>
                {user.course}
              </Text>
              
              <View style={styles.colRole}>
                <View
                  style={[
                    styles.badge,
                    user.role === 'admin' ? styles.adminBadge : styles.memberBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      user.role === 'admin' ? styles.adminText : styles.memberText,
                    ]}
                  >
                    {user.role}
                  </Text>
                </View>
              </View>
              
              <View style={styles.colStatus}>
                <View
                  style={[
                    styles.badge,
                    user.status === 'Active' ? styles.activeBadge : styles.inactiveBadge,
                  ]}
                >
                  <Text style={styles.badgeText}>{user.status}</Text>
                </View>
              </View>
              
              <View style={[styles.actionsCell, styles.colActions]}>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleEditUser(user)}
                >
                  <Ionicons name="create-outline" size={18} color={Colors.textGray} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionIcon}
                  onPress={() => handleDeleteUser(user)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {filteredUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#555" />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add User Modal */}
      <Modal
        visible={showAddUserModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddUserModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New User</Text>
              <TouchableOpacity onPress={() => setShowAddUserModal(false)}>
                <Ionicons name="close" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="user@example.com"
                  placeholderTextColor={Colors.textGray}
                  value={newUser.email}
                  onChangeText={(text) => setNewUser({ ...newUser, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  placeholderTextColor={Colors.textGray}
                  value={newUser.password}
                  onChangeText={(text) => setNewUser({ ...newUser, password: text })}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Display Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor={Colors.textGray}
                  value={newUser.displayName}
                  onChangeText={(text) => setNewUser({ ...newUser, displayName: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role</Text>
                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      newUser.role === 'member' && styles.roleButtonActive,
                    ]}
                    onPress={() => setNewUser({ ...newUser, role: 'member' })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        newUser.role === 'member' && styles.roleButtonTextActive,
                      ]}
                    >
                      Member
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.roleButton,
                      newUser.role === 'admin' && styles.roleButtonActive,
                    ]}
                    onPress={() => setNewUser({ ...newUser, role: 'admin' })}
                  >
                    <Text
                      style={[
                        styles.roleButtonText,
                        newUser.role === 'admin' && styles.roleButtonTextActive,
                      ]}
                    >
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Course (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., React Native"
                  placeholderTextColor={Colors.textGray}
                  value={newUser.course}
                  onChangeText={(text) => setNewUser({ ...newUser, course: text })}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowAddUserModal(false)}
                disabled={addingUser}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, addingUser && styles.submitButtonDisabled]}
                onPress={handleAddUser}
                disabled={addingUser}
              >
                {addingUser ? (
                  <ActivityIndicator size="small" color={Colors.black} />
                ) : (
                  <Text style={styles.submitButtonText}>Add User</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
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
    marginBottom: 20,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: 14,
  },
  addUserButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addUserText: {
    color: Colors.black,
    fontWeight: 'bold',
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
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#222',
    paddingHorizontal: 8,
    alignItems: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  columnHeader: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  colUser: {
    width: 100,
    marginRight: 8,
  },
  colCourse: {
    width: 90,
    marginRight: 8,
  },
  colRole: {
    width: 55,
    marginRight: 8,
  },
  colStatus: {
    width: 55,
    marginRight: 8,
  },
  colActions: {
    width: 60,
    alignItems: 'flex-end',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    paddingHorizontal: 8,
    backgroundColor: '#1A1A1A',
  },
  userCell: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '500',
    flex: 1,
  },
  cellText: {
    fontSize: 11,
    color: Colors.textGray,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  adminBadge: {
    backgroundColor: '#FFD700',
  },
  memberBadge: {
    backgroundColor: '#555',
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  inactiveBadge: {
    backgroundColor: '#FF4444',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.white,
  },
  adminText: {
    color: Colors.black,
  },
  memberText: {
    color: Colors.white,
  },
  actionsCell: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionIcon: {
    padding: 4,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#555',
    fontSize: 18,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.white,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    color: Colors.white,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  roleButtonText: {
    fontSize: 14,
    color: Colors.textGray,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: Colors.black,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFD700',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.black,
    fontSize: 14,
    fontWeight: '600',
  },
});
