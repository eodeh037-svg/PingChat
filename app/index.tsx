import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { router } from "expo-router";

function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-[#0f172a] px-6">
      <Image
        source={{ uri: "https://cdn-icons-png.flaticon.com/512/2462/2462719.png" }}
        style={{ width: 90, height: 90, tintColor: "#22c55e" }}
      />

      <Text className="text-3xl font-bold text-white text-center mt-4">
        Welcome to Ping
      </Text>

      <Text className="text-gray-500 mt-4 text-center text-lg">
        Chat with friends and stay connected anytime, anywhere. Ping makes
        messaging fast, simple, and real-time — no delays, no hassle. Join the
        conversation and experience messaging the way it should be.
      </Text>

      <TouchableOpacity className="bg-black w-[65%] h-[5.8%] items-center justify-center mt-8 rounded-lg" onPress={()=> {console.log("pressed")
router.push('/signup')

      } }>
        <Text className="text-white text-center">
          Get started
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default Index;