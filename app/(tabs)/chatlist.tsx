import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { router } from "expo-router";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));

      const list = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((u) => u.id !== currentUser?.uid);

      setUsers(list);
    };

    fetchUsers();
  }, []);

  const getChatId = (uid1: string, uid2: string) => {
    return uid1 > uid2 ? uid1 + "_" + uid2 : uid2 + "_" + uid1;
  };

  // 🔥 FILTER USERS
  const filteredUsers = users.filter((user) =>
    user.username?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View className="flex-1 bg-[#020617] px-4 pt-6">
      
      <Text className="text-white text-3xl font-bold mb-4">
        Chats
      </Text>

      {/* 🔍 SEARCH BAR */}
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Search users..."
        placeholderTextColor="#64748b"
        className="bg-[#1e293b] text-white px-4 py-3 rounded-2xl mb-4"
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-[#0f172a] p-4 rounded-2xl mb-3 flex-row items-center"
            onPress={() => {
              const chatId = getChatId(currentUser!.uid, item.id);

              router.push({
                pathname: "/(tabs)/user",
                params: {
                  chatId,
                  username: item.username,
                },
              });
            }}
          >
            <View className="w-12 h-12 bg-green-500 rounded-full justify-center items-center mr-4">
              <Text className="text-white font-bold">
                {item.username?.charAt(0).toUpperCase()}
              </Text>
            </View>

            <Text className="text-white text-lg font-semibold">
              {item.username}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}