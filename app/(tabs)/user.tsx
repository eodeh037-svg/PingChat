import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";

import { auth, db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";

export default function Chat() {
  const { chatId, username: otherUsername } = useLocalSearchParams();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [username, setUsername] = useState("");

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const getUser = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) setUsername(snap.data().username);
    };

    getUser();
  }, []);

  useEffect(() => {
    if (!chatId || !user) return;

    setDoc(
      doc(db, "chats", chatId as string),
      { members: [user.uid] },
      { merge: true }
    );
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId as string, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    });

    return unsubscribe;
  }, [chatId]);

  const sendMessage = async () => {
    if (!message.trim()) return;

    await addDoc(
      collection(db, "chats", chatId as string, "messages"),
      {
        text: message,
        uid: user!.uid,
        username,
        createdAt: serverTimestamp(),
      }
    );

    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#020617" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1 }}>

        {/* HEADER */}
        <View
          style={{
            padding: 15,
            backgroundColor: "#0f172a",
          }}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {otherUsername}
          </Text>
        </View>

        {/* MESSAGES */}
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isMe = item.uid === user?.uid;

            return (
              <View
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  backgroundColor: isMe ? "#22c55e" : "#1e293b",
                  padding: 10,
                  borderRadius: 16,
                  marginBottom: 10,
                  maxWidth: "75%",
                }}
              >
                <Text style={{ color: "white" }}>{item.text}</Text>
              </View>
            );
          }}
        />

        {/* INPUT (FIXED POSITION STYLE) */}
        <View
          style={{
            flexDirection: "row",
            padding: 10,
            backgroundColor: "#0f172a",
            alignItems: "center",
          }}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type message..."
            placeholderTextColor="#94a3b8"
            style={{
              flex: 1,
              backgroundColor: "#1e293b",
              color: "white",
              padding: 10,
              borderRadius: 12,
              marginRight: 8,
            }}
          />

          <TouchableOpacity
            onPress={sendMessage}
            style={{
              backgroundColor: "#22c55e",
              padding: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}