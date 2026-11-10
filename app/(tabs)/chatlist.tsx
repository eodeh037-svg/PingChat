import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';
import { getChatReadTimestamps } from '@/lib/chatReadState';
import { getChatSummaries, type ChatSummary } from '@/lib/chatService';
import { db } from '@/lib/firebase';

function formatChatTime(timestamp: ChatSummary['lastMessageAt']): string {
  if (!timestamp) {
    return '';
  }

  const date = timestamp.toDate();
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatList() {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [readAt, setReadAt] = useState<Record<string, number>>({});
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedUid, setLoadedUid] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    let requestId = 0;
    const chatsQuery = query(collection(db, 'chats'), where('members', 'array-contains', user.uid));
    const unsubscribe = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const currentRequest = ++requestId;
        void getChatSummaries(snapshot.docs, user.uid)
          .then((summaries) => {
            if (active && currentRequest === requestId) {
              setChats(summaries);
              setError(null);
              setLoading(false);
              setLoadedUid(user.uid);
            }
          })
          .catch((cause: unknown) => {
            if (active && currentRequest === requestId) {
              setError(
                cause instanceof Error ? cause.message : 'Your conversations could not be loaded.'
              );
              setLoading(false);
              setLoadedUid(user.uid);
            }
          });
      },
      (cause) => {
        if (active) {
          setError(cause.message);
          setLoading(false);
          setLoadedUid(user.uid);
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [reloadKey, user]);

  useFocusEffect(
    useCallback(() => {
      if (!user) {
        return;
      }

      let active = true;
      void getChatReadTimestamps(user.uid)
        .then((timestamps) => {
          if (active) {
            setReadAt(timestamps);
            setReadError(null);
          }
        })
        .catch((cause: unknown) => {
          if (active) {
            setReadError(cause instanceof Error ? cause.message : 'Unread status is unavailable.');
          }
        });

      return () => {
        active = false;
      };
    }, [user])
  );

  const filteredChats = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return chats;
    }
    return chats.filter(
      (chat) => chat.title.toLowerCase().includes(term) || chat.preview.toLowerCase().includes(term)
    );
  }, [chats, search]);

  const loadingCurrentUser = loading || loadedUid !== user?.uid;

  if (loadingCurrentUser) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="chatbubble-ellipses-outline"
          title="Your conversations"
          description="Loading your chats…"
          loading
        />
      </SafeAreaView>
    );
  }

  if (error && chats.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="cloud-offline-outline"
          title="Could not load your chats"
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
    <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
      <View className="px-5 pb-4 pt-5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#a997ef]">
              Your space
            </Text>
            <Text className="mt-1 text-[32px] font-bold tracking-[-0.8px] text-[#f4f1fa]">
              Messages
            </Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Find people"
            accessibilityRole="button"
            className="h-12 w-12 items-center justify-center rounded-full bg-[#211d2b]"
            onPress={() => router.push('/(tabs)/user')}>
            <Ionicons name="create-outline" size={23} color="#c5b7ff" />
          </TouchableOpacity>
        </View>
        <Text className="mt-1 text-sm text-[#8e8a9a]">Pick up right where you left off.</Text>
        <View className="mt-5 h-12 flex-row items-center rounded-2xl border border-[#272531] bg-[#15141c] px-4">
          <Ionicons name="search" size={19} color="#8c8897" />
          <TextInput
            accessibilityLabel="Search conversations"
            value={search}
            onChangeText={setSearch}
            placeholder="Search conversations"
            placeholderTextColor="#777382"
            className="ml-3 flex-1 text-[15px] text-[#f4f1fa]"
            returnKeyType="search"
          />
          {search ? (
            <TouchableOpacity accessibilityLabel="Clear search" onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={19} color="#777382" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {error || readError ? (
        <View className="mx-5 mb-2 rounded-xl border border-[#684b58] bg-[#2b1d27] px-4 py-3">
          <Text className="text-sm leading-5 text-[#e2aebe]">{error ?? readError}</Text>
        </View>
      ) : null}

      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => {
          const lastReadAt = readAt[item.id] ?? 0;
          const isUnread =
            item.lastMessageSenderId !== null &&
            item.lastMessageSenderId !== user?.uid &&
            (item.lastMessageAt?.toMillis() ?? 0) > lastReadAt;

          return (
            <TouchableOpacity
              accessibilityRole="button"
              className="flex-row items-center border-b border-[#211f29] py-4"
              onPress={() =>
                router.push({
                  pathname: '/conversation/[chatId]',
                  params: {
                    chatId: item.id,
                    title: item.title,
                    peerIds: item.peerIds.join(','),
                  },
                })
              }>
              <Avatar label={item.title} size={54} />
              <View className="ml-3.5 min-w-0 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`flex-1 text-[16px] ${isUnread ? 'font-bold text-white' : 'font-semibold text-[#e9e6f0]'}`}
                    numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="ml-2 text-[11px] text-[#858190]">
                    {formatChatTime(item.lastMessageAt)}
                  </Text>
                </View>
                <View className="mt-1.5 flex-row items-center">
                  <Text
                    className={`flex-1 text-[13px] leading-5 ${isUnread ? 'font-medium text-[#d8d2e8]' : 'text-[#8f8b9b]'}`}
                    numberOfLines={1}>
                    {item.preview}
                  </Text>
                  {isUnread ? (
                    <View className="ml-3 h-2.5 w-2.5 rounded-full bg-[#a78bfa]" />
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <StateView
            icon={search ? 'search-outline' : 'chatbubble-ellipses-outline'}
            title={search ? 'No matches' : 'A good chat starts here'}
            description={
              search
                ? 'Try another name or message.'
                : 'Find someone you know and send the first ping.'
            }
            actionLabel={search ? undefined : 'Discover people'}
            onAction={search ? undefined : () => router.push('/(tabs)/user')}
          />
        }
      />
    </SafeAreaView>
  );
}
