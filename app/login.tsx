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
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      Alert.alert("Success", "Logged in successfully!");

      setEmail("");
      setPassword("");

      router.replace('/(tabs)/chatlist');
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
           style={{ width: 90, height: 90, tintColor: "#22c55e" }}
        />

        <Text className="text-4xl font-extrabold text-white mt-3 mb-6">
          Ping Chat
        </Text>

        {/* Card */}
      <View className="bg-[#1e293b] w-full rounded-3xl p-6">
          <Text className="text-2xl font-bold text-white mb-6 text-center">
            Welcome Back
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-[#334155] text-white px-4 py-3 rounded-xl mb-4"
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            className="bg-[#334155] text-white px-4 py-3 rounded-xl mb-4"
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
          className="bg-green-500 py-3 rounded-xl flex-row justify-center items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">
                Login
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            className="mt-5"
          >
           <Text className="text-center text-gray-400">
              Don’t have an account?{" "}
               <Text className="text-green-400 font-semibold">Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}