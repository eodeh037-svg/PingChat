import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';

export function StateView({
  icon,
  title,
  description,
  loading = false,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {loading ? (
        <ActivityIndicator color="#aa96ff" size="large" />
      ) : (
        <View className="mb-5 h-14 w-14 items-center justify-center rounded-full bg-[#211d31]">
          <Ionicons name={icon} size={25} color="#aa96ff" />
        </View>
      )}
      <Text className="text-center text-xl font-semibold text-[#f4f1fb]">{title}</Text>
      <Text className="mt-2 text-center text-sm leading-6 text-[#9692a3]">{description}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-6 rounded-full bg-[#9a82f5] px-5 py-3"
          onPress={onAction}>
          <Text className="font-semibold text-white">{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
