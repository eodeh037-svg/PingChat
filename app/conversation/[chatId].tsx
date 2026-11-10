import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';
import { markChatRead } from '@/lib/chatReadState';
import { messageFromDocument, sendChatMessage, type ChatMessage } from '@/lib/chatService';
import { db } from '@/lib/firebase';
import { formatDisplayName, getUserProfile } from '@/lib/userService';

const PAGE_SIZE = 50;

function formatMessageTime(message: ChatMessage): string {
  if (!message.createdAt) {
    return 'Sending';
  }
  return message.createdAt.toDate().toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function Conversation() {
  const { user, loading: authLoading } = useAuth();
  const params = useLocalSearchParams<{
    chatId: string;
    title?: string;
    peerIds?: string;
  }>();
  const chatId = Array.isArray(params.chatId) ? params.chatId[0] : params.chatId;
  const titleParam = Array.isArray(params.title) ? params.title[0] : params.title;
  const peerIdsParam = Array.isArray(params.peerIds) ? params.peerIds[0] : params.peerIds;
  const peerIds = (peerIdsParam ?? '').split(',').filter(Boolean);
  const peerId = peerIds[0] ?? '';
  const participantIds = [
    ...new Set([user?.uid, ...peerIds].filter((id): id is string => Boolean(id))),
  ];
  const [username, setUsername] = useState('');
  const [title, setTitle] = useState(titleParam ?? 'Conversation');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlderMessages, setHasOlderMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const oldestMessage = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const initialScrollDone = useRef(false);
  const lastMarkedAt = useRef(0);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    void getUserProfile(user.uid)
      .then((profile) => {
        if (active) {
          if (profile) {
            setUsername(profile.username);
          } else {
            setError('Your profile could not be found, so messages cannot be sent.');
          }
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? `Your profile could not be loaded: ${cause.message}`
              : 'Your profile could not be loaded.'
          );
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!chatId || !user) {
      return;
    }

    let active = true;
    let isFirstSnapshot = true;
    oldestMessage.current = null;
    initialScrollDone.current = false;
    lastMarkedAt.current = 0;
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );
    const unsubscribe = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const latestMessages = snapshot.docs.map(messageFromDocument).reverse();
        if (isFirstSnapshot) {
          isFirstSnapshot = false;
          oldestMessage.current = snapshot.docs.at(-1) ?? null;
          setHasOlderMessages(snapshot.docs.length === PAGE_SIZE);
          setMessages(latestMessages);
          setLoadedChatId(chatId);
        } else {
          const latestIds = new Set(latestMessages.map((message) => message.id));
          setMessages((previous) => [
            ...previous.filter((message) => !latestIds.has(message.id)),
            ...latestMessages,
          ]);
        }

        const latestTime = snapshot.docs.reduce((newest, document) => {
          const value = document.data().createdAt;
          return value && typeof value.toMillis === 'function'
            ? Math.max(newest, value.toMillis())
            : newest;
        }, 0);
        if (latestTime > lastMarkedAt.current) {
          lastMarkedAt.current = latestTime;
          void markChatRead(user.uid, chatId, latestTime)
            .then(() => setReadError(null))
            .catch((cause: unknown) => {
              setReadError(
                cause instanceof Error ? cause.message : 'Unread status could not be updated.'
              );
            });
        }

        if (isFirstSnapshot === false && !initialScrollDone.current) {
          initialScrollDone.current = true;
          requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
        }
      },
      (cause) => {
        if (active) {
          setError(cause.message);
        }
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [chatId, reloadKey, user]);

  useEffect(() => {
    if (!titleParam || peerIds.length !== 1 || !peerId) {
      return;
    }
    let active = true;
    void getUserProfile(peerId)
      .then((profile) => {
        if (active && profile) {
          setTitle(profile.username);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? `Conversation details could not be loaded: ${cause.message}`
              : 'Conversation details could not be loaded.'
          );
        }
      });
    return () => {
      active = false;
    };
  }, [peerId, peerIds.length, titleParam]);

  const loadOlderMessages = async () => {
    if (!chatId || !oldestMessage.current || loadingOlder || !hasOlderMessages) {
      return;
    }

    setLoadingOlder(true);
    try {
      const olderQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        orderBy('createdAt', 'desc'),
        startAfter(oldestMessage.current),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(olderQuery);
      if (snapshot.docs.length > 0) {
        oldestMessage.current = snapshot.docs.at(-1) ?? oldestMessage.current;
        const olderMessages = snapshot.docs.map(messageFromDocument).reverse();
        setMessages((previous) => {
          const existingIds = new Set(previous.map((message) => message.id));
          return [...olderMessages.filter((message) => !existingIds.has(message.id)), ...previous];
        });
      }
      setHasOlderMessages(snapshot.docs.length === PAGE_SIZE);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Earlier messages could not be loaded.');
    } finally {
      setLoadingOlder(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !chatId || !messageText.trim() || sending || !username) {
      return;
    }

    setSending(true);
    setError(null);
    try {
      await sendChatMessage({
        chatId,
        uid: user.uid,
        username,
        text: messageText,
        participantIds,
      });
      setMessageText('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Your message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/chatlist');
    }
  }, []);
  const loadingMessages = loadedChatId !== chatId && !error;

  if (authLoading) {
    return (
      <StateView
        icon="chatbubble-ellipses-outline"
        title="Opening conversation"
        description="Restoring your account…"
        loading
      />
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!chatId) {
    return (
      <StateView
        icon="alert-circle-outline"
        title="Conversation unavailable"
        description="This conversation link is incomplete."
        actionLabel="Back to chats"
        onAction={goBack}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View className="flex-row items-center border-b border-[#252330] px-4 py-3">
          <TouchableOpacity
            accessibilityLabel="Back to chats"
            accessibilityRole="button"
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            onPress={goBack}>
            <Ionicons name="chevron-back" size={25} color="#eae6f3" />
          </TouchableOpacity>
          <Avatar label={title} size={42} />
          <View className="ml-3 flex-1">
            <Text className="text-[16px] font-semibold text-[#f3f0f8]" numberOfLines={1}>
              {title}
            </Text>
            <Text className="mt-0.5 text-xs text-[#8e8a9a]">A private conversation</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel="Conversation options"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full"
            onPress={() =>
              Alert.alert('Conversation options', 'More conversation options are coming soon.')
            }>
            <Ionicons name="ellipsis-horizontal" size={22} color="#aaa5b5" />
          </TouchableOpacity>
        </View>

        {error || readError ? (
          <View className="mx-4 mt-3 rounded-xl border border-[#684b58] bg-[#2b1d27] px-4 py-3">
            <Text className="text-sm leading-5 text-[#e2aebe]">{error ?? readError}</Text>
            {error ? (
              <TouchableOpacity
                className="mt-2 self-start"
                onPress={() => {
                  setError(null);
                  setLoadedChatId(null);
                  setReloadKey((value) => value + 1);
                }}>
                <Text className="font-semibold text-[#d8b0c0]">Retry</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {loadingMessages ? (
          <StateView
            icon="chatbubble-ellipses-outline"
            title="Loading messages"
            description="Getting your conversation…"
            loading
          />
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: messages.length === 0 ? 'center' : 'flex-end',
              paddingHorizontal: 16,
              paddingVertical: 18,
            }}
            maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              hasOlderMessages ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  className="mb-5 self-center rounded-full border border-[#302d3b] px-4 py-2"
                  disabled={loadingOlder}
                  onPress={() => void loadOlderMessages()}>
                  <Text className="text-xs font-semibold text-[#b8a8ef]">
                    {loadingOlder ? 'Loading…' : 'Load earlier messages'}
                  </Text>
                </TouchableOpacity>
              ) : undefined
            }
            ListEmptyComponent={
              <View className="items-center px-6 py-10">
                <View className="mb-4 h-14 w-14 items-center justify-center rounded-full bg-[#211d31]">
                  <Ionicons name="chatbubble-outline" size={25} color="#aa96ff" />
                </View>
                <Text className="text-lg font-semibold text-[#f1edf7]">Say hello to {title}</Text>
                <Text className="mt-2 text-center text-sm leading-6 text-[#908c9a]">
                  Your messages will appear here. Keep it simple and say hi.
                </Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMine = item.uid === user.uid;
              return (
                <View className={`mb-3 max-w-[82%] ${isMine ? 'self-end' : 'self-start'}`}>
                  {!isMine && item.username ? (
                    <Text className="mb-1 ml-2 text-[11px] font-medium text-[#a69fae]">
                      {formatDisplayName(item.username)}
                    </Text>
                  ) : null}
                  <View
                    className={`rounded-[20px] px-4 py-3 ${isMine ? 'rounded-br-[7px] bg-[#735bc2]' : 'rounded-bl-[7px] border border-[#302d3b] bg-[#1b1922]'}`}>
                    <Text className="text-[15px] leading-[22px] text-[#fbfaff]">{item.text}</Text>
                    <Text
                      className={`mt-1.5 self-end text-[10px] ${isMine ? 'text-[#e1d9ff]' : 'text-[#8f8b9b]'}`}>
                      {formatMessageTime(item)}
                    </Text>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View className="flex-row items-end border-t border-[#252330] bg-[#111018] px-3 py-3">
          <TouchableOpacity
            accessibilityLabel="Attachment options"
            accessibilityRole="button"
            className="mb-1 mr-2 h-10 w-10 items-center justify-center rounded-full bg-[#211d2b]"
            onPress={() => Alert.alert('Attachments', 'File sharing is not available yet.')}>
            <Ionicons name="add" size={24} color="#b5a3ff" />
          </TouchableOpacity>
          <TextInput
            accessibilityLabel="Write a message"
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Write a message"
            placeholderTextColor="#777382"
            multiline
            maxLength={4000}
            editable={!sending}
            className="max-h-28 min-h-11 flex-1 rounded-[20px] border border-[#302d3b] bg-[#1b1922] px-4 py-3 text-[15px] leading-5 text-[#f4f1fa]"
            selectionColor="#b5a3ff"
          />
          <TouchableOpacity
            accessibilityLabel="Send message"
            accessibilityRole="button"
            disabled={!messageText.trim() || sending || !username}
            className={`mb-1 ml-2 h-10 w-10 items-center justify-center rounded-full ${messageText.trim() && !sending && username ? 'bg-[#9b83f4]' : 'bg-[#302d3b]'}`}
            onPress={() => void sendMessage()}>
            {sending ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons
                name="arrow-up"
                size={21}
                color={messageText.trim() && username ? '#ffffff' : '#858190'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
