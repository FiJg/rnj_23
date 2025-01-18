import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';

const LOCALHOST_URL = 'http://172.22.2.61:8082';

const ChatSelection = ({
  user,
  activeChat,
  setActiveChat,
  handleChatChange,
  notifications,
  privateChats,
  setPrivateChats,
  isLoading,
  setIsLoading,
}) => {
  const [rooms, setChatRooms] = useState([]);

  useEffect(() => {
    fetchChatRooms();
  }, [notifications]);

  const fetchChatRooms = async () => {
    const url = `${LOCALHOST_URL}/chatrooms?username=${user.username}`;
    try {
      const response = await fetch(url);
      const chatRooms = await response.json();
      const formattedRooms = chatRooms.map((room) => ({
        id: room.id,
        name: room.name,
        messages: room.messages,
        date: Date.now(),
      }));
      setChatRooms(formattedRooms);

      if (!activeChat && formattedRooms.length > 0) {
        handleChatChange(formattedRooms[0]?.id);
      }

      const chatMap = new Map(
        formattedRooms.map((room) => [room.id, room.messages || []])
      );
      setPrivateChats(chatMap);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setIsLoading(false);
    }
  };

  const addGroupChat = () => {
    const name = prompt('Enter the name of the group chat');
    const users = prompt('Enter the usernames of users to add, separated by commas');

    if (!name || !users) {
      Alert.alert('Validation Error', 'Group chat name and users are required.');
      return;
    }

    const userArray = users.split(',').map((u) => u.trim());

    fetch(`${LOCALHOST_URL}/api/chatroom/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        isGroup: true,
        joinedUserNames: userArray,
        createdBy: user.id,
      }),
    })
      .then(() => fetchChatRooms())
      .catch((error) => console.error('Error creating group chat:', error));
  };

  const renderChatRoom = ({ item }) => {
    const hasNotification = notifications[item.id];
    return (
      <TouchableOpacity
        style={[
          styles.chatRoom,
          activeChat?.id === item.id && styles.activeChatRoom,
        ]}
        onPress={() => handleChatChange(item.id)}
      >
        <Text style={styles.chatName}>
          {item.name}
          {hasNotification && <Text style={styles.notificationDot}> ●</Text>}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066ff" />
        <Text>Loading chatrooms...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>ChatRooms</Text>
        <TouchableOpacity style={styles.addButton} onPress={addGroupChat}>
          <Text style={styles.addButtonText}>+ Add Group</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderChatRoom}
        contentContainerStyle={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d0d0d0',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#0066ff',
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 16,
  },
  chatRoom: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 8,
  },
  activeChatRoom: {
    backgroundColor: '#0066ff',
  },
  chatName: {
    fontSize: 16,
    color: '#333',
  },
  notificationDot: {
    color: '#ff0000',
    fontSize: 18,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatSelection;
