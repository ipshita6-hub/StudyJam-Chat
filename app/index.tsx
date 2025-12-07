import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Colors } from '../constants/colors';

export default function Index() {
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Wait for the navigation to be ready
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 0);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}