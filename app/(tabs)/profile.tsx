import { Ionicons } from '@expo/vector-icons';
import { sendPasswordResetEmail, signOut } from 'firebase/auth';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { auth } from '@/lib/firebase';
import { getUserProfile } from '@/lib/userService';

export default function Profile() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    void getUserProfile(user.uid)
      .then((profile) => {
        if (!active) {
          return;
        }
        if (!profile) {
          setError('Your profile could not be found.');
        } else {
          setUsername(profile.username);
        }
        setLoading(false);
        setLoadedUid(user.uid);
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'Your profile could not be loaded.');
          setLoading(false);
          setLoadedUid(user.uid);
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey, user]);

  const resetPassword = async () => {
    if (!user?.email || resettingPassword) {
      return;
    }
    setResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert('Check your email', 'We sent you a link to reset your password.');
    } catch (cause) {
      Alert.alert('Could not send reset email', getAuthErrorMessage(cause));
    } finally {
      setResettingPassword(false);
    }
  };

  const confirmSignOut = () => {
    Alert.alert('Sign out of Ping?', 'You can sign in again at any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut(auth)
            .then(() => router.replace('/login'))
            .catch((cause: unknown) =>
              Alert.alert(
                'Could not sign out',
                cause instanceof Error ? cause.message : 'Please try again.'
              )
            );
        },
      },
    ]);
  };

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (loading || loadedUid !== user.uid) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="person-circle-outline"
          title="Loading your profile"
          description="Getting your account details…"
          loading
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="alert-circle-outline"
          title="Profile unavailable"
          description={error}
          actionLabel="Try again"
          onAction={() => {
            setError(null);
            setLoading(true);
            setReloadKey((value) => value + 1);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b0a10] px-5" edges={['top']}>
      <View className="pb-5 pt-5">
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#a997ef]">
          Your account
        </Text>
        <Text className="mt-1 text-[32px] font-bold tracking-[-0.8px] text-[#f4f1fa]">Profile</Text>
      </View>

      <View className="items-center rounded-[28px] border border-[#292633] bg-[#15141c] px-6 py-7">
        <Avatar label={username} size={86} />
        <Text className="mt-4 text-2xl font-bold text-[#f4f1fa]">{username}</Text>
        <Text className="mt-1 text-sm text-[#9692a3]">Ping member</Text>
      </View>

      <View className="mt-7">
        <Text className="mb-3 ml-1 text-xs font-bold uppercase tracking-[1.5px] text-[#858190]">
          Account details
        </Text>
        <View className="overflow-hidden rounded-2xl border border-[#292633] bg-[#15141c]">
          <View className="flex-row items-center px-4 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#24212e]">
              <Ionicons name="mail-outline" size={18} color="#b5a3ff" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs text-[#858190]">Email address</Text>
              <Text className="mt-1 text-sm font-medium text-[#eae6f3]">
                {user.email ?? 'No email address'}
              </Text>
            </View>
          </View>
          <View className="mx-4 h-px bg-[#292633]" />
          <TouchableOpacity
            accessibilityRole="button"
            className="flex-row items-center px-4 py-4"
            disabled={resettingPassword || !user.email}
            onPress={() => void resetPassword()}>
            <View className="h-10 w-10 items-center justify-center rounded-full bg-[#24212e]">
              {resettingPassword ? (
                <ActivityIndicator size="small" color="#b5a3ff" />
              ) : (
                <Ionicons name="lock-closed-outline" size={18} color="#b5a3ff" />
              )}
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-[#eae6f3]">Password & security</Text>
              <Text className="mt-1 text-xs text-[#858190]">Send a password reset link</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#777382" />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        className="mt-7 h-14 flex-row items-center justify-center rounded-2xl border border-[#59404e] bg-[#241922]"
        onPress={confirmSignOut}>
        <Ionicons name="log-out-outline" size={19} color="#e2aebe" />
        <Text className="ml-2 text-sm font-semibold text-[#e2aebe]">Sign out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
