import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'content' | 'group' | 'assignment' | 'system';
  read: boolean;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'World History - New Content',
      description: 'Sarah posted lecture notes for Chapter 5',
      time: '2 minutes ago',
      type: 'content',
      read: false,
    },
    {
      id: '2',
      title: 'Advanced Mathematics',
      description: 'Mike Rodriguez joined your study group',
      time: '1 hour ago',
      type: 'group',
      read: true,
    },
    {
      id: '3',
      title: 'Physics Study Group',
      description: 'Assignment due tomorrow: Quantum Mechanics',
      time: '3 hours ago',
      type: 'assignment',
      read: false,
    },
    {
      id: '4',
      title: 'System Announcement',
      description: 'Scheduled maintenance tonight 11 PM - 1 AM',
      time: '1 day ago',
      type: 'system',
      read: true,
    },
  ]);

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationPress = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'content':
        return 'book';
      case 'group':
        return 'person-add';
      case 'assignment':
        return 'calendar';
      case 'system':
        return 'megaphone';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'content':
        return '#FFD700'; // Yellow
      case 'group':
        return '#4CAF50'; // Green
      case 'assignment':
        return '#FF9800'; // Orange
      case 'system':
        return '#9C27B0'; // Purple
      default:
        return Colors.primary;
    }
  };

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item.id)}
    >
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.type) }]}>
        <Ionicons name={getIcon(item.type)} size={24} color={Colors.black} />
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{item.title}</Text>
          {!item.read ? (
            <View style={styles.unreadDot} />
          ) : (
            <View style={styles.readDot} />
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity style={styles.footerButton}>
            <Text style={styles.footerButtonText}>View all notifications</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A', // Dark background as per design
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#222',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 4,
  },
  markReadText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 20,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    backgroundColor: '#1A1A1A',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    flex: 1,
    marginRight: 8,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  readDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#555',
  },
  description: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#666',
  },
  footerButton: {
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#222',
  },
  footerButtonText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});
