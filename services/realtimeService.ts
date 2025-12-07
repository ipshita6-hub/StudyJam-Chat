import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../FirebaseConfig';

class RealtimeService {
  // Course listeners
  subscribeToAllCourses(callback: (courses: any[]) => void): Unsubscribe {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(courses);
    });
  }

  subscribeToUserCourses(userId: string, callback: (courses: any[]) => void): Unsubscribe {
    const coursesRef = collection(db, 'courses');
    const q = query(coursesRef, where('members', 'array-contains', userId));

    return onSnapshot(q, (snapshot) => {
      const courses = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(courses);
    });
  }

  // Create course
  async createCourse(courseData: {
    name: string;
    description: string;
    createdBy: string;
    createdByName: string;
  }) {
    try {
      const docRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        members: [courseData.createdBy],
        enrolledCount: 1,
        isActive: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, courseId: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Join course
  async joinCourse(courseId: string, userId: string) {
    try {
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        members: [...(await this.getCourseMembers(courseId)), userId],
        enrolledCount: (await this.getCourseEnrolledCount(courseId)) + 1,
        updatedAt: serverTimestamp(),
      });

      // Add enrollment record
      await addDoc(collection(db, 'courses', courseId, 'enrollments'), {
        userId,
        enrolledAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Announcement listeners
  subscribeToAnnouncements(callback: (announcements: any[]) => void): Unsubscribe {
    const announcementsRef = collection(db, 'announcements');
    const q = query(
      announcementsRef,
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(announcements);
    });
  }

  subscribeToAllAnnouncements(callback: (announcements: any[]) => void): Unsubscribe {
    const announcementsRef = collection(db, 'announcements');
    const q = query(announcementsRef, orderBy('createdAt', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const announcements = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(announcements);
    });
  }

  // Create announcement
  async createAnnouncement(announcementData: {
    title: string;
    message: string;
    type: string;
    priority: string;
    authorId: string;
    authorName: string;
  }) {
    try {
      const docRef = await addDoc(collection(db, 'announcements'), {
        ...announcementData,
        isActive: true,
        viewCount: 0,
        createdAt: serverTimestamp(),
      });
      return { success: true, announcementId: docRef.id };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Update announcement
  async updateAnnouncement(announcementId: string, updates: any) {
    try {
      const announcementRef = doc(db, 'announcements', announcementId);
      await updateDoc(announcementRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Delete announcement
  async deleteAnnouncement(announcementId: string) {
    try {
      await deleteDoc(doc(db, 'announcements', announcementId));
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Chat messages listener
  subscribeToCourseMessages(
    courseId: string,
    callback: (messages: any[]) => void
  ): Unsubscribe {
    const messagesRef = collection(db, 'courses', courseId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    });
  }

  // Send message
  async sendMessage(courseId: string, messageData: {
    senderId: string;
    senderName: string;
    content: string;
    type: 'text' | 'file' | 'video';
  }) {
    try {
      await addDoc(collection(db, 'courses', courseId, 'messages'), {
        ...messageData,
        timestamp: serverTimestamp(),
        reactions: [],
      });

      // Update course last message
      await updateDoc(doc(db, 'courses', courseId), {
        lastMessage: messageData.content,
        lastMessageTime: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  private async getCourseMembers(courseId: string): Promise<string[]> {
    // Implementation to get current members
    return [];
  }

  private async getCourseEnrolledCount(courseId: string): Promise<number> {
    // Implementation to get current enrolled count
    return 0;
  }

  // User status listener
  subscribeToUserStatus(userId: string, callback: (status: any) => void): Unsubscribe {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (snapshot) => {
      callback(snapshot.data());
    });
  }

  // Update user status
  async updateUserStatus(userId: string, status: 'online' | 'offline') {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status,
        lastSeen: serverTimestamp(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

export default new RealtimeService();