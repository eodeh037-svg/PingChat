import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { router } from "expo-router";

export default function Profile() {
  const [userData, setUserData] = useState<any>(null);
  const user = auth.currentUser;

  
  useEffect(() => {
    if (!user) return;

    const fetchUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        setUserData(snap.data());
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <View className="flex-1 bg-[#020617] px-6 pt-12">

      
      <Text className="text-white text-3xl font-bold mb-8">
        Profile
      </Text>

      
      <View className="bg-[#0f172a] rounded-3xl p-6 items-center shadow-lg">

        {/* Avatar */}
        <View className="w-24 h-24 bg-green-500 rounded-full justify-center items-center mb-4">
          <Text className="text-white text-3xl font-bold">
            {userData?.username?.charAt(0).toUpperCase()}
          </Text>
        </View>

        
        <Text className="text-white text-2xl font-bold">
          {userData?.username || "Username"}
        </Text>

        
        <Text className="text-gray-400 mt-2">
          {user?.email}
        </Text>

      </View>

      
      <View className="mt-10">

      
        <TouchableOpacity
          onPress={handleLogout}
          className="bg-red-500 py-4 rounded-2xl items-center"
        >
          <Text className="text-white font-bold text-lg">
            Logout
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}
