import { useState } from "react";
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image,
  Platform,
} from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";

import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

  import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);


const handleSignup = async () => {
  if (!email || !password || !username) {
    Alert.alert("Error", "Please fill all fields");
    return;
  }

  const cleanUsername = username.toLowerCase().trim();

  setLoading(true);

  try {
    // ✅ STEP 1: Check if username exists
    const usernameRef = doc(db, "usernames", cleanUsername);
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      Alert.alert("Error", "Username already taken");
      setLoading(false);
      return;
    }

    // ✅ STEP 2: Create auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    const user = userCredential.user;

    // ✅ STEP 3: Save in users collection
    await setDoc(doc(db, "users", user.uid), {
      username: cleanUsername,
      email,
      createdAt: serverTimestamp(),
    });

    // ✅ STEP 4: Save in usernames collection
    await setDoc(usernameRef, {
      uid: user.uid,
    });

    // ✅ SUCCESS
    Alert.alert("Success", "Account created successfully!")
     router.replace('/(tabs)/chatlist')

  } catch (error: any) {
    Alert.alert("Error", error.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView className="flex-1 bg-[#020617] justify-center items-center px-5">
        {/* Logo */}
        <Image
          source={{
            uri: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png",
          }}
          style={{
            width: 90,
            height: 90,
            tintColor: "#22c55e",
          }}
        />

        <Text className="text-4xl font-extrabold text-white mt-3 mb-6">
          Ping Chat
        </Text>

        {/* Card */}
        <View className="bg-[#0f172a] w-full rounded-3xl p-6">
          <Text className="text-2xl font-bold text-white mb-6 text-center">
            Create Account
          </Text>

          <TextInput
            placeholder="Username"
            placeholderTextColor="#94a3b8"
            value={username}
            onChangeText={setUsername}
            className="bg-[#1e293b] text-white px-4 py-3 rounded-xl mb-4"
          />

          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-[#1e293b] text-white px-4 py-3 rounded-xl mb-4"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-[#1e293b] text-white px-4 py-3 rounded-xl mb-6"
          />

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="bg-green-500 py-3 rounded-xl flex-row justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/login")}
            className="mt-5"
          >
            <Text className="text-center text-gray-400">
              Already have an account?{" "}
              <Text className="text-green-400 font-semibold">Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}