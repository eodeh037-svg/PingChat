import AsyncStorage from '@react-native-async-storage/async-storage';

function storageKey(uid: string): string {
  return `ping-chat-read:${uid}`;
}

export async function getChatReadTimestamps(uid: string): Promise<Record<string, number>> {
  const storedValue = await AsyncStorage.getItem(storageKey(uid));
  if (storedValue === null) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(storedValue);
  } catch {
    throw new Error('Saved unread status is corrupted. Clear the app storage to reset it.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Saved unread status is invalid. Clear the app storage to reset it.');
  }

  const timestamps: Record<string, number> = {};
  for (const [chatId, value] of Object.entries(parsed)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error('Saved unread status is invalid. Clear the app storage to reset it.');
    }
    timestamps[chatId] = value;
  }

  return timestamps;
}

export async function markChatRead(
  uid: string,
  chatId: string,
  timestamp: number
): Promise<Record<string, number>> {
  const timestamps = await getChatReadTimestamps(uid);
  if ((timestamps[chatId] ?? 0) >= timestamp) {
    return timestamps;
  }

  const updated = { ...timestamps, [chatId]: timestamp };
  await AsyncStorage.setItem(storageKey(uid), JSON.stringify(updated));
  return updated;
}
