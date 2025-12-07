import { useEffect, useState } from 'react';
import realtimeService from '../services/realtimeService';

// Hook for courses
export function useCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = realtimeService.subscribeToAllCourses((updatedCourses) => {
      setCourses(updatedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { courses, loading };
}

// Hook for user's enrolled courses
export function useUserCourses(userId: string) {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeService.subscribeToUserCourses(userId, (updatedCourses) => {
      setCourses(updatedCourses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { courses, loading };
}

// Hook for announcements
export function useAnnouncements(activeOnly = true) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = activeOnly
      ? realtimeService.subscribeToAnnouncements((updatedAnnouncements) => {
          setAnnouncements(updatedAnnouncements);
          setLoading(false);
        })
      : realtimeService.subscribeToAllAnnouncements((updatedAnnouncements) => {
          setAnnouncements(updatedAnnouncements);
          setLoading(false);
        });

    return () => unsubscribe();
  }, [activeOnly]);

  return { announcements, loading };
}

// Hook for course messages
export function useCourseMessages(courseId: string) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const unsubscribe = realtimeService.subscribeToCourseMessages(courseId, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [courseId]);

  return { messages, loading };
}

// Hook for user status
export function useUserStatus(userId: string) {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = realtimeService.subscribeToUserStatus(userId, (updatedStatus) => {
      setStatus(updatedStatus);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { status, loading };
}
