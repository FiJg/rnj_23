import React, { useEffect, useLayoutEffect, useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Animated, 
  Dimensions 
} from 'react-native';
import ChatSelection from './ChatSelection'; 
import ChatWindow from './ChatWindow'; 
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const LOCALHOST_URL = 'http://172.22.2.61:8082';
const { width } = Dimensions.get('window');
const CHAT_SELECTION_WIDTH = width * 0.8; 

const Menu = ({ user }) => {
  const [notifications, setNotifications] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [privateChats, setPrivateChats] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // For slide-out chat selection
  const [isChatSelectionVisible, setIsChatSelectionVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-CHAT_SELECTION_WIDTH)).current;

  // Use useRef to store the stompClient instance
  const stompClientRef = useRef(null);

  // Initialize stompClient only once
  useEffect(() => {
    const sock = new SockJS(`${LOCALHOST_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => sock,
      debug: (str) => console.log('STOMP Debug:', str),
      onConnect: () => {
        console.log('STOMP Connected');

        // Subscribe to user notifications
        client.subscribe(`/user/${user.username}/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          const chatId = notification.chatRoomId;

          // Set notifications for chats not currently active
          setNotifications((prev) => {
            if (activeChat && chatId === activeChat.id) {
              return prev;
            }
            return { ...prev, [chatId]: true };
          });
        });

        // Subscribe to active chat messages
        if (activeChat) {
          client.subscribe(`/topic/chatroom/${activeChat.id}`, (message) => {
            const newMessage = JSON.parse(message.body);
            console.log('Received Message:', newMessage); 
  
            setPrivateChats(prevChats => {
              const chatMessages = prevChats.get(activeChat.id) || [];
              const exists = chatMessages.some(msg => msg.id === newMessage.id);
  
              if (!exists) {
                const updatedMessages = [...chatMessages, newMessage];
                const updatedChats = new Map(prevChats);
                updatedChats.set(activeChat.id, updatedMessages);
                return updatedChats;
              }
  
              return prevChats;
            });
          });
        }
      },
      onStompError: (frame) => {
        console.error('STOMP Error:', frame);
        Alert.alert('Error', 'WebSocket connection error.');
      },
    });

    client.activate();
    stompClientRef.current = client;
   

    // Cleanup on unmount
    return () => {
      if (client && client.active) {
        client.deactivate();
      }
    };
  }, [user.username]);

  // Handle subscriptions when activeChat changes
  useEffect(() => {
    const client = stompClientRef.current;
    let subscription = null;
 
    if (client && client.connected && activeChat) {
      // Subscribe to the new active chat
      subscription = client.subscribe(`/topic/chatroom/${activeChat.id}`, (message) => {
        const newMessage = JSON.parse(message.body);
        console.log('Received Message:', newMessage); 

        setPrivateChats(prevChats => {
          const chatMessages = prevChats.get(activeChat.id) || []; // Corrected here
          // Prevent duplicate messages
          const exists = chatMessages.some(msg => msg.id === newMessage.id);

          if (!exists) {
            const updatedMessages = [...chatMessages, newMessage];
            const updatedChats = new Map(prevChats);
            updatedChats.set(activeChat.id, updatedMessages);
            return updatedChats;
          }

          return prevChats;
        });
      });
    
  // Cleanup: Unsubscribe from previous chat when activeChat changes
      return () => {
        if (subscription) {
          subscription.unsubscribe();
        }
      };
    }
  }, [activeChat]);

  const handleChatChange = async (newChatId) => {
    if (!newChatId || activeChat?.id === newChatId) {
      return;
    }
    try {
      const response = await fetch(`${LOCALHOST_URL}/api/chatroom/${newChatId}`);
      const result = await response.json();
      setActiveChat(result);

      // Clearing notifications for the selected chat
      setNotifications((prev) => {
        const updated = { ...prev, [newChatId]: false };
        return updated;
      });

        // Optionally, fetch existing messages for the new chat
        const existingMessages = result.messages || [];
        setPrivateChats(prevChats => {
          const updatedChats = new Map(prevChats);
          updatedChats.set(newChatId, existingMessages);
          return updatedChats;
        });
  
        setIsLoading(false);
    } catch (error) {
      console.error('Error changing chat:', error);
      Alert.alert('Error', 'Failed to change chat.');
    }
  };

  const checkReceivedMessages = async () => {
    if (isLoading) return;

    try {
      const response = await fetch(`${LOCALHOST_URL}/api/queue?username=${user.username}`);
      const result = await response.json();
      const updatedChats = new Map(privateChats);

      result.forEach((msg) => {
        if (!updatedChats.has(msg.room.id)) {
          updatedChats.set(msg.room.id, []);
        }
        updatedChats.get(msg.room.id).push(msg);
      });

      setPrivateChats(updatedChats);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to fetch messages.');
    }
  };

  useEffect(() => {
    if (!isLoading) {
      checkReceivedMessages();
    }
  }, [isLoading]);

  const sendMessage = (payload) => {
    if (!activeChat) return;
  
    const destination = activeChat.isPublic
      ? '/app/message'
      : activeChat.isGroup
      ? '/app/group-message'
      : '/app/private-message';
  
    const client = stompClientRef.current;
  
    if (client && client.connected) {
      try {
        client.publish({ destination, body: JSON.stringify(payload) });
        console.log('Message sent successfully:', payload);
      } catch (error) {
        console.error('Error in stompClient.publish:', error);
        Alert.alert('Send Error', 'Failed to send the message.');
      }
    } else {
      Alert.alert('Connection Error', 'WebSocket connection is not established.');
    }
  };

  const toggleChatSelection = () => {
    if (isChatSelectionVisible) {
      // Hiding menu
      Animated.timing(slideAnim, {
        toValue: -CHAT_SELECTION_WIDTH,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setIsChatSelectionVisible(false);
      });
    } else {
      // Show menu
      setIsChatSelectionVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };
 

  return (
    <View style={styles.container}>
      {/* Toggle Button */}
      <TouchableOpacity style={styles.toggleButton} onPress={toggleChatSelection}>
        <Ionicons name="menu" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Overlay when menu is open */}
      {isChatSelectionVisible && (
        <TouchableOpacity
          style={styles.overlay}
          onPress={toggleChatSelection}
          activeOpacity={1}
        />
      )}

      {/* Animated ChatSelection Drawer */}
      {isChatSelectionVisible && (
        <Animated.View style={[styles.chatSelectionDrawer, { transform: [{ translateX: slideAnim }] }]}>
          <ChatSelection
            activeChat={activeChat}
            setActiveChat={handleChatChange}
            handleChatChange={handleChatChange}
            user={user}
            notifications={notifications}
            privateChats={privateChats}
            setPrivateChats={setPrivateChats}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />
        </Animated.View>
      )}

      {/* ChatWindow Component */}
      <View style={styles.chatWindowContainer}>
        <ChatWindow
          activeChat={activeChat}
          user={user}
          privateChats={privateChats}
          setPrivateChats={setPrivateChats}
          sendMessage={sendMessage}
          stompClient={stompClientRef.current} // Pass the current stompClient
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  toggleButton: {
    position: 'absolute',
    top: 40, 
    left: 10,
    zIndex: 3, // has to be both above overlay and drawer
    backgroundColor: '#0066ff',
    padding: 10,
    borderRadius: 5,
  },
  chatSelectionDrawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: CHAT_SELECTION_WIDTH,
    backgroundColor: '#d0d0d0',
    zIndex: 2, // so it is above the overlay
    elevation: 5, //  Android shadow
    shadowColor: '#000', //  iOS shadow
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  chatWindowContainer: {
    flex: 1,
    // Keeps ChatWindow full-screen, overlays with drawer
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: CHAT_SELECTION_WIDTH, // Starts after the drawer
    width: width - CHAT_SELECTION_WIDTH, // Covers the rest of the screen
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 1, // Below drawer
  },
});

export default Menu;
