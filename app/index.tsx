import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, TouchableOpacity, View } from 'react-native';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';

export default function Welcome() {
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

  if (user) {
    return <Redirect href="/(tabs)/chatlist" />;
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b0a10] px-7">
      <View className="flex-1 justify-center">
        <View className="mb-9 h-20 w-20 items-center justify-center rounded-[28px] bg-[#2b2245]">
          <Ionicons name="chatbubble-ellipses" size={38} color="#b5a3ff" />
        </View>
        <Text className="text-sm font-bold uppercase tracking-[4px] text-[#ad99fa]">Ping Chat</Text>
        <Text className="mt-4 max-w-sm text-[40px] font-bold leading-[48px] tracking-[-1.2px] text-[#f5f2fb]">
          The best conversations feel effortless.
        </Text>
        <Text className="mt-4 max-w-sm text-base leading-7 text-[#9995a5]">
          A calmer place to catch up, share a thought, and stay close to your people.
        </Text>
      </View>

      <View className="pb-7">
        <TouchableOpacity
          accessibilityRole="button"
          className="h-14 items-center justify-center rounded-2xl bg-[#9b83f4]"
          onPress={() => router.push('/signup')}>
          <Text className="text-base font-bold text-white">Create your account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-4 h-14 items-center justify-center rounded-2xl border border-[#302d3b]"
          onPress={() => router.push('/login')}>
          <Text className="text-base font-semibold text-[#d3cfde]">I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
