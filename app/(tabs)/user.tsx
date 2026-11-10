import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '@/components/Avatar';
import { StateView } from '@/components/StateView';
import { useAuth } from '@/app/context/AuthContext';
import { getOrCreateDirectChat } from '@/lib/chatService';
import {
  formatDisplayName,
  searchUsers,
  type UserProfile,
  type UserSearchPage,
} from '@/lib/userService';

export default function UserDirectory() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [startingUid, setStartingUid] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const cursor = useRef<UserSearchPage['cursor']>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      setStartError(null);
      cursor.current = null;
      void searchUsers({ search, excludeUid: user.uid })
        .then((page) => {
          if (!active) {
            return;
          }
          setUsers(page.users);
          cursor.current = page.cursor;
          setHasMore(page.hasMore);
          setLoading(false);
        })
        .catch((cause: unknown) => {
          if (active) {
            setError(cause instanceof Error ? cause.message : 'People could not be loaded.');
            setLoading(false);
          }
        });
    }, 220);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [reloadKey, search, user]);

  const loadMore = async () => {
    if (!hasMore || loadingMore || !cursor.current || !user) {
      return;
    }

    const requestedSearch = search.trim().toLowerCase();
    const requestedCursor = cursor.current;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await searchUsers({
        search: requestedSearch,
        excludeUid: user.uid,
        after: requestedCursor,
      });
      if (search.trim().toLowerCase() !== requestedSearch) {
        return;
      }
      setUsers((previous) => [
        ...previous,
        ...page.users.filter((item) => !previous.some((existing) => existing.id === item.id)),
      ]);
      cursor.current = page.cursor ?? cursor.current;
      setHasMore(page.hasMore);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'More people could not be loaded.');
    } finally {
      setLoadingMore(false);
    }
  };

  const startConversation = async (person: UserProfile) => {
    if (!user || startingUid) {
      return;
    }

    setStartingUid(person.id);
    setStartError(null);
    try {
      const chatId = await getOrCreateDirectChat(user.uid, person.id);
      router.push({
        pathname: '/conversation/[chatId]',
        params: {
          chatId,
          title: person.username,
          peerIds: person.id,
        },
      });
    } catch (cause) {
      setStartError(
        cause instanceof Error ? cause.message : 'The conversation could not be opened.'
      );
    } finally {
      setStartingUid(null);
    }
  };

  if (loading && users.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="people-outline"
          title="Finding your people"
          description="Loading the directory…"
          loading
        />
      </SafeAreaView>
    );
  }

  if (error && users.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
        <StateView
          icon="cloud-offline-outline"
          title="Could not load people"
          description={error}
          actionLabel="Try again"
          onAction={() => setReloadKey((value) => value + 1)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#0b0a10]" edges={['top']}>
      <View className="px-5 pb-4 pt-5">
        <Text className="text-sm font-semibold uppercase tracking-[2px] text-[#a997ef]">
          Find your people
        </Text>
        <Text className="mt-1 text-[32px] font-bold tracking-[-0.8px] text-[#f4f1fa]">
          Discover
        </Text>
        <Text className="mt-1 text-sm text-[#8e8a9a]">
          Search by username and start a conversation.
        </Text>
        <View className="mt-5 h-12 flex-row items-center rounded-2xl border border-[#272531] bg-[#15141c] px-4">
          <Ionicons name="search" size={19} color="#8c8897" />
          <TextInput
            accessibilityLabel="Search users by username"
            value={search}
            onChangeText={setSearch}
            placeholder="Search usernames"
            placeholderTextColor="#777382"
            autoCapitalize="none"
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

      {error || startError ? (
        <View className="mx-5 mb-2 rounded-xl border border-[#684b58] bg-[#2b1d27] px-4 py-3">
          <Text className="text-sm leading-5 text-[#e2aebe]">{error ?? startError}</Text>
        </View>
      ) : null}

      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
        keyboardShouldPersistTaps="handled"
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        renderItem={({ item }) => {
          const isStarting = startingUid === item.id;
          return (
            <View className="flex-row items-center border-b border-[#211f29] py-4">
              <Avatar label={formatDisplayName(item.username)} size={50} />
              <View className="ml-3.5 min-w-0 flex-1">
                <Text className="text-[16px] font-semibold text-[#efecf5]">
                  {formatDisplayName(item.username)}
                </Text>
                <Text className="mt-1 text-[13px] text-[#858190]">@{item.username}</Text>
              </View>
              <TouchableOpacity
                accessibilityLabel={`Message ${formatDisplayName(item.username)}`}
                accessibilityRole="button"
                disabled={Boolean(startingUid)}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#2b2245]"
                onPress={() => void startConversation(item)}>
                {isStarting ? (
                  <ActivityIndicator color="#c6b8ff" size="small" />
                ) : (
                  <Ionicons name="chatbubble-ellipses-outline" size={19} color="#c6b8ff" />
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <StateView
            icon="person-add-outline"
            title={search ? 'No one found' : 'You’re all caught up'}
            description={
              search
                ? 'Check the spelling or try a shorter name or username.'
                : 'New people will appear here when they join Ping.'
            }
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View className="items-center py-5">
              <ActivityIndicator color="#aa96ff" />
            </View>
          ) : undefined
        }
      />
    </SafeAreaView>
  );
}
