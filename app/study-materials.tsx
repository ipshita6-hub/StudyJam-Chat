import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/colors';

interface Material {
  id: string;
  title: string;
  course: string;
  type: 'pdf' | 'video' | 'link';
  size?: string;
  duration?: string;
  date: string;
}

export default function StudyMaterialsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'pdf' | 'video'>('all');

  const materials: Material[] = [
    {
      id: '1',
      title: 'Chapter 7: The Roman Empire',
      course: 'World History',
      type: 'pdf',
      size: '2.4 MB',
      date: '2 days ago',
    },
    {
      id: '2',
      title: 'Calculus I - Limits and Continuity',
      course: 'Advanced Mathematics',
      type: 'video',
      duration: '45:20',
      date: '3 days ago',
    },
    {
      id: '3',
      title: 'Linear Algebra Cheat Sheet',
      course: 'Advanced Mathematics',
      type: 'pdf',
      size: '1.1 MB',
      date: '1 week ago',
    },
    {
      id: '4',
      title: 'French Revolution Documentary',
      course: 'World History',
      type: 'video',
      duration: '1:12:00',
      date: '1 week ago',
    },
    {
      id: '5',
      title: 'Physics Lab Report Template',
      course: 'Physics',
      type: 'pdf',
      size: '500 KB',
      date: '2 weeks ago',
    },
  ];

  const filteredMaterials =
    activeTab === 'all' ? materials : materials.filter((m) => m.type === activeTab);

  const getIcon = (type: Material['type']) => {
    switch (type) {
      case 'pdf':
        return 'document-text';
      case 'video':
        return 'play-circle';
      case 'link':
        return 'link';
      default:
        return 'document';
    }
  };

  const getIconColor = (type: Material['type']) => {
    switch (type) {
      case 'pdf':
        return '#FF6B6B';
      case 'video':
        return '#4ECDC4';
      case 'link':
        return '#45B7D1';
      default:
        return Colors.textGray;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Materials</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pdf' && styles.activeTab]}
          onPress={() => setActiveTab('pdf')}
        >
          <Text style={[styles.tabText, activeTab === 'pdf' && styles.activeTabText]}>PDFs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'video' && styles.activeTab]}
          onPress={() => setActiveTab('video')}
        >
          <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Videos</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredMaterials.map((item) => (
          <TouchableOpacity key={item.id} style={styles.materialItem}>
            <View style={styles.iconContainer}>
              <Ionicons name={getIcon(item.type)} size={28} color={getIconColor(item.type)} />
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemCourse}>{item.course}</Text>
              <Text style={styles.itemMeta}>
                {item.type === 'video' ? item.duration : item.size} • {item.date}
              </Text>
            </View>
            <TouchableOpacity style={styles.downloadButton}>
              <Ionicons name="download-outline" size={20} color={Colors.textGray} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeTab: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabText: {
    color: Colors.textGray,
    fontWeight: '600',
  },
  activeTabText: {
    color: Colors.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  materialItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  itemCourse: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textGray,
  },
  downloadButton: {
    padding: 8,
  },
});
