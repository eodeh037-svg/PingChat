import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';

export default function TabLayout() {
  const { user, loading, error } = useAuth();

  if (loading) {
    return (
      <StateView
        icon="chatbubble-ellipses-outline"
        title="Getting Ping ready"
        description="Connecting to your account…"
        loading
      />
    );
  }

  if (error) {
    return (
      <StateView
        icon="alert-circle-outline"
        title="Could not restore your session"
        description={error.message}
      />
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#b5a3ff',
        tabBarInactiveTintColor: '#777382',
        tabBarStyle: {
          backgroundColor: '#111018',
          borderTopColor: '#252330',
          paddingTop: 7,
          paddingBottom: Platform.OS === 'ios' ? 18 : 8,
          height: Platform.OS === 'ios' ? 76 : 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="chatlist"
        options={{
          title: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}
