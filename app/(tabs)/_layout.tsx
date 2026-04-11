import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import {Ionicons} from "@expo/vector-icons"

export default function Rootlayout() {
  return (
    <Tabs screenOptions={{headerShown:false, animation: "none"}} >
          <Tabs.Screen name='chatlist' options={{title : "chats", 
            tabBarIcon : ({color, size}) => (
<Ionicons name='chatbubbles' size={size} color={color}/>
            )
          }}/>

        <Tabs.Screen name='profile' options={{
          title:"Profile",
          
          tabBarIcon: ({color, size, }) => (
            <Ionicons name='person' size={size} color={color}/>
          )
        }}/>
      
    </Tabs>
  )
}