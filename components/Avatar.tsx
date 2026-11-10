import { Text, View } from 'react-native';

const avatarColors = ['#59468f', '#4b477a', '#674d7c', '#574f8a'];

export function Avatar({ label, size = 52 }: { label: string; size?: number }) {
  const initial = label.trim().charAt(0).toUpperCase() || '?';
  const colorIndex =
    label.split('').reduce((total, character) => total + character.charCodeAt(0), 0) %
    avatarColors.length;

  return (
    <View
      className="items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: avatarColors[colorIndex],
      }}>
      <Text className="font-semibold text-white" style={{ fontSize: Math.max(15, size * 0.34) }}>
        {initial}
      </Text>
    </View>
  );
}
