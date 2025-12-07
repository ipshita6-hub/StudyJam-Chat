import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { Colors } from '../../constants/colors';

interface Course {
  id: string;
  title: string;
  description: string;
  members: number;
  status: 'joined' | 'not-joined';
  icon: string;
}

interface CourseDetailModalProps {
  visible: boolean;
  course: Course;
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  role: 'admin' | 'member';
  avatar: string;
}

export default function CourseDetailModal({ visible, course, onClose }: CourseDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'members' | 'about'>('chat');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const members: Member[] = [
    { id: '1', name: 'Sarah Chen', role: 'admin', avatar: 'S' },
    { id: '2', name: 'Mike Rodriguez', role: 'member', avatar: 'M' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.white} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Course Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>{course.icon}</Text>
            </View>
            <Text style={styles.title}>{course.title}</Text>
            <Text style={styles.description}>
              Explore the fascinating journey of human civilization from ancient times to the modern world.
            </Text>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'chat' && styles.activeTab]}
              onPress={() => setActiveTab('chat')}
            >
              <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>
                Chat
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'members' && styles.activeTab]}
              onPress={() => setActiveTab('members')}
            >
              <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>
                Members
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'about' && styles.activeTab]}
              onPress={() => setActiveTab('about')}
            >
              <Text style={[styles.tabText, activeTab === 'about' && styles.activeTabText]}>
                About
              </Text>
            </TouchableOpacity>
          </View>

          {/* Chat Tab Content */}
          {activeTab === 'chat' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Study Group Chat</Text>
              <Text style={styles.sectionSubtitle}>Course • {course.members} members</Text>
              <View style={styles.divider} />
              <View style={styles.chatPlaceholder}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textGray} />
                <Text style={styles.placeholderText}>No messages yet</Text>
                <Text style={styles.placeholderSubtext}>Start a conversation with your study group</Text>
              </View>
            </View>
          )}

          {/* Members Tab Content */}
          {activeTab === 'members' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Study Group Chat</Text>
              <Text style={styles.sectionSubtitle}>Course • {course.members} members</Text>

              <View style={styles.divider} />

              {/* Members List */}
              {members.map((member) => (
                <View key={member.id} style={styles.memberItem}>
                  <View style={styles.memberLeft}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{member.avatar}</Text>
                    </View>
                    <View>
                      <Text style={styles.memberName}>{member.name}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleText}>{member.role}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="ellipsis-vertical" size={20} color={Colors.textGray} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.showAllButton}>
                <Text style={styles.showAllText}>Show all {course.members} members</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* About Tab Content */}
          {activeTab === 'about' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Course</Text>
              <View style={styles.divider} />
              <Text style={styles.aboutText}>{course.description}</Text>
              <View style={styles.aboutStats}>
                <View style={styles.statItem}>
                  <Ionicons name="people" size={20} color={Colors.primary} />
                  <Text style={styles.statValue}>{course.members}</Text>
                  <Text style={styles.statLabel}>Members</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="book" size={20} color={Colors.primary} />
                  <Text style={styles.statValue}>12</Text>
                  <Text style={styles.statLabel}>Lessons</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={20} color={Colors.primary} />
                  <Text style={styles.statValue}>24h</Text>
                  <Text style={styles.statLabel}>Duration</Text>
                </View>
              </View>
            </View>
          )}

          {/* Group Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Group Settings</Text>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications" size={20} color={Colors.primary} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: Colors.border, true: Colors.primary }}
                thumbColor={Colors.white}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="folder" size={20} color={Colors.primary} />
                <Text style={styles.settingText}>Media & Files</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="volume-mute" size={20} color={Colors.primary} />
                <Text style={styles.settingText}>Mute Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="flag" size={20} color={Colors.primary} />
                <Text style={styles.settingText}>Report Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textGray} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.settingItem, styles.dangerItem]}>
              <View style={styles.settingLeft}>
                <Ionicons name="exit" size={20} color="#FF4444" />
                <Text style={[styles.settingText, styles.dangerText]}>Leave Group</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
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
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 24,
  },
  tab: {
    paddingBottom: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: Colors.textGray,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: Colors.textGray,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.primary,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  memberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.black,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.black,
  },
  showAllButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  showAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  dangerItem: {
    borderBottomWidth: 0,
  },
  dangerText: {
    color: '#FF4444',
  },
  chatPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginTop: 16,
  },
  placeholderSubtext: {
    fontSize: 14,
    color: Colors.textGray,
    marginTop: 8,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textGray,
    lineHeight: 22,
    marginBottom: 24,
  },
  aboutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textGray,
  },

});
