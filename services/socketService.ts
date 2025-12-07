import { io, Socket } from 'socket.io-client';

// Replace with your actual server URL
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.userId = userId;
    this.socket = io(SOCKET_URL, {
      auth: {
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Course Events
  createCourse(courseData: any, callback?: (response: any) => void) {
    this.socket?.emit('course:create', courseData, callback);
  }

  onCourseCreated(callback: (course: any) => void) {
    this.socket?.on('course:created', callback);
  }

  offCourseCreated() {
    this.socket?.off('course:created');
  }

  joinCourse(courseId: string, callback?: (response: any) => void) {
    this.socket?.emit('course:join', { courseId }, callback);
  }

  onCourseJoined(callback: (data: any) => void) {
    this.socket?.on('course:joined', callback);
  }

  offCourseJoined() {
    this.socket?.off('course:joined');
  }

  leaveCourse(courseId: string) {
    this.socket?.emit('course:leave', { courseId });
  }

  // Announcement Events
  createAnnouncement(announcementData: any, callback?: (response: any) => void) {
    this.socket?.emit('announcement:create', announcementData, callback);
  }

  onAnnouncementCreated(callback: (announcement: any) => void) {
    this.socket?.on('announcement:created', callback);
  }

  offAnnouncementCreated() {
    this.socket?.off('announcement:created');
  }

  onAnnouncementUpdated(callback: (announcement: any) => void) {
    this.socket?.on('announcement:updated', callback);
  }

  offAnnouncementUpdated() {
    this.socket?.off('announcement:updated');
  }

  onAnnouncementDeleted(callback: (announcementId: string) => void) {
    this.socket?.on('announcement:deleted', callback);
  }

  offAnnouncementDeleted() {
    this.socket?.off('announcement:deleted');
  }

  // Chat Events
  sendMessage(courseId: string, message: any, callback?: (response: any) => void) {
    this.socket?.emit('message:send', { courseId, message }, callback);
  }

  onMessageReceived(callback: (message: any) => void) {
    this.socket?.on('message:received', callback);
  }

  offMessageReceived() {
    this.socket?.off('message:received');
  }

  // Typing indicator
  startTyping(courseId: string) {
    this.socket?.emit('typing:start', { courseId });
  }

  stopTyping(courseId: string) {
    this.socket?.emit('typing:stop', { courseId });
  }

  onUserTyping(callback: (data: { userId: string; userName: string; courseId: string }) => void) {
    this.socket?.on('user:typing', callback);
  }

  offUserTyping() {
    this.socket?.off('user:typing');
  }

  // Generic event listener
  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string) {
    this.socket?.off(event);
  }

  emit(event: string, data: any, callback?: (response: any) => void) {
    this.socket?.emit(event, data, callback);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export default new SocketService();
