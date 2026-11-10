import { Ionicons } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { auth } from '@/lib/firebase';
import { registerUserProfile, UsernameTakenError } from '@/lib/userService';

export default function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<'username' | 'email' | 'password' | null>(null);

  const handleSignup = async () => {
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError('Use 3–20 characters for your username: letters, numbers, or underscores.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Choose a password with at least 6 characters.');
      return;
    }

    setLoading(true);
    setError(null);
    let createdUser: Awaited<ReturnType<typeof createUserWithEmailAndPassword>>['user'] | null =
      null;
    let completed = false;

    try {
      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = credential.user;
      await registerUserProfile({
        uid: credential.user.uid,
        username: cleanUsername,
        email: cleanEmail,
      });
      completed = true;
    } catch (cause) {
      let cleanupFailed = false;
      let cleanupFailureMessage = '';
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupCause) {
          cleanupFailed = true;
          cleanupFailureMessage = getAuthErrorMessage(cleanupCause);
        }
      }

      if (cleanupFailed) {
        setError(
          `Your account was created, but profile setup and account cleanup failed: ${cleanupFailureMessage}`
        );
      } else if (cause instanceof UsernameTakenError) {
        setError(cause.message);
      } else if (cause instanceof FirebaseError && cause.code === 'permission-denied') {
        setError(
          'Your account could not be completed because profile access was denied. Please contact support.'
        );
      } else {
        setError(getAuthErrorMessage(cause));
      }
    } finally {
      setLoading(false);
    }

    if (completed) {
      router.replace('/(tabs)/chatlist');
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0b0a10]"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled">
          <TouchableOpacity
            accessibilityRole="button"
            className="mb-9 h-11 w-11 items-center justify-center rounded-full bg-[#1b1922]"
            onPress={() => router.replace('/')}>
            <Ionicons name="chevron-back" size={22} color="#d7d2e0" />
          </TouchableOpacity>

          <View className="mb-7 h-14 w-14 items-center justify-center rounded-[20px] bg-[#2b2245]">
            <Ionicons name="sparkles-outline" size={27} color="#b5a3ff" />
          </View>
          <Text className="text-sm font-bold uppercase tracking-[3px] text-[#ad99fa]">
            Join Ping
          </Text>
          <Text className="mt-2 text-[34px] font-bold tracking-[-0.8px] text-[#f4f1fa]">
            Make yourself at home.
          </Text>
          <Text className="mt-2 text-base leading-6 text-[#9995a5]">
            Create an account and find your people.
          </Text>

          <View className="mt-8 gap-5">
            <View>
              <Text className="mb-2 ml-1 text-[13px] font-semibold text-[#cbc6d5]">Username</Text>
              <TextInput
                accessibilityLabel="Username"
                value={username}
                onChangeText={setUsername}
                placeholder="yourname"
                placeholderTextColor="#777382"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                onFocus={() => setFocusedField('username')}
                onBlur={() => setFocusedField(null)}
                selectionColor="#b5a3ff"
                className={`h-14 rounded-2xl border bg-[#15141c] px-4 text-[15px] text-[#f4f1fa] ${focusedField === 'username' ? 'border-[#9b83f4]' : 'border-[#302d3b]'}`}
              />
            </View>
            <View>
              <Text className="mb-2 ml-1 text-[13px] font-semibold text-[#cbc6d5]">
                Email address
              </Text>
              <TextInput
                accessibilityLabel="Email address"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#777382"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                selectionColor="#b5a3ff"
                className={`h-14 rounded-2xl border bg-[#15141c] px-4 text-[15px] text-[#f4f1fa] ${focusedField === 'email' ? 'border-[#9b83f4]' : 'border-[#302d3b]'}`}
              />
            </View>
            <View>
              <Text className="mb-2 ml-1 text-[13px] font-semibold text-[#cbc6d5]">Password</Text>
              <TextInput
                accessibilityLabel="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                placeholderTextColor="#777382"
                secureTextEntry
                autoComplete="new-password"
                textContentType="newPassword"
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                selectionColor="#b5a3ff"
                className={`h-14 rounded-2xl border bg-[#15141c] px-4 text-[15px] text-[#f4f1fa] ${focusedField === 'password' ? 'border-[#9b83f4]' : 'border-[#302d3b]'}`}
              />
            </View>
          </View>

          {error ? (
            <View
              accessibilityRole="alert"
              className="mt-5 rounded-xl border border-[#684b58] bg-[#2b1d27] px-4 py-3">
              <Text className="text-sm leading-5 text-[#e2aebe]">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            disabled={loading}
            className={`mt-7 h-14 flex-row items-center justify-center rounded-2xl ${loading ? 'bg-[#66558d]' : 'bg-[#9b83f4]'}`}
            onPress={() => void handleSignup()}>
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-base font-bold text-white">Create account</Text>
                <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 9 }} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            className="mt-6 self-center py-2"
            onPress={() => router.push('/login')}>
            <Text className="text-sm text-[#9995a5]">
              Already on Ping? <Text className="font-semibold text-[#c2b2ff]">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}
