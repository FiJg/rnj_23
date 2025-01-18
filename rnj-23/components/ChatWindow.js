import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
const LOCALHOST_URL = 'http://172.22.2.61:8082';
const getAvatarUrl = (username) => `${LOCALHOST_URL}/uploads/avatars/${username}.png`;

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';


const ChatWindow = ({ user, activeChat, privateChats, setPrivateChats, sendMessage, stompClient, isConnected, }) => {
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [failedAvatars, setFailedAvatars] = useState(new Set());
  const [downloading, setDownloading] = useState(false);
  const flatListRef = useRef(null);
  const [messages, setMessages] = useState([]);
  

    // Update local messages whenever privateChats changes
    useEffect(() => {
      if (activeChat?.id) {
        const chatMessages = privateChats.get(activeChat.id) || [];
        setMessages([...chatMessages]); // Create a new array to trigger re-render
      }
    }, [privateChats, activeChat]);

     // Scroll to end when messages change
  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);
  
  const handleAvatarError = (username) => {
    setFailedAvatars((prev) => new Set([...prev, username]));
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !file) {
      Alert.alert('Validation Error', 'You cannot send an empty message.');
      return;
    }

    let fileUrl = null;
    let fileName = null;
    let fileType = null;

    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch(`${LOCALHOST_URL}/api/messages/upload`, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const result = await response.json();
        fileUrl = result.fileUrl;
        fileName = file.name;
        fileType = file.type;
      } catch (error) {
        console.error('File upload failed:', error);
        Alert.alert('Error', 'Failed to upload the file.');
        return;
      }
    }
    // **Construct the payload with senderId and chatId at the top level**
    const payload = {
      senderId: user.id,
      username: user.username,
      chatId: activeChat.id,
      content: {
        content: message.trim(),
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: fileType,
        fileSize: file ? file.size : null,
      },
      date: Date.now(),
    };

    console.log('Sending Payload:', payload);

    try {
      // Passing the entire payload as a single object
      await sendMessage(payload);
      setMessage('');
      setFile(null);
      
      setPrivateChats(prevChats => {
        const updatedChats = new Map(prevChats);
        const chatMessages = updatedChats.get(activeChat.id) || [];
        const updatedMessages = [...chatMessages, payload];
        updatedChats.set(activeChat.id, updatedMessages);
        setMessages(updatedMessages); // Update local messages state
        return updatedChats;
      });
  
      // **Scroll to end after sending**
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleDownload = async (fileUrl, fileName) => {
    try {
      setDownloading(true);
      const downloadUri = `${FileSystem.documentDirectory}${fileName}`;
      
      // Download the file
      const { uri } = await FileSystem.downloadAsync(fileUrl, downloadUri);
      console.log('Finished downloading to ', uri);
  
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('Download', `File downloaded to: ${uri}`);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      Alert.alert('Download Error', 'Failed to download the file.');
    } finally {
      setDownloading(false);
    }
  };
  
   //avatars fucntions
   const renderAvatar = (username) => {
    if (!username) {
      return (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>?</Text> {/* Default placeholder */}
        </View>
      );
    }
  
    if (!failedAvatars.has(username)) {
      return (
        <Image
          source={{ uri: getAvatarUrl(username) }}
          style={styles.avatar}
          onError={() => handleAvatarError(username)}
        />
      );
    }
  
    // Fallback to initials
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarText}>{username.charAt(0).toUpperCase()}</Text>
      </View>
    );
  };
  

  const pickFile = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }
  
    // Launch the image picker
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allows picking both images and documents
      allowsEditing: false, // Set to true if you want to allow editing
      quality: 1,
    });
  
    if (!result.canceled) {
      // The result contains the URI of the selected file
      const selectedAsset = result.assets[0];
      setFile({
        uri: selectedAsset.uri,
        name: selectedAsset.fileName || 'file',
        type: selectedAsset.type ? `image/${selectedAsset.type}` : 'image', // Adjust type as needed
        size: selectedAsset.size || 0, // Size in bytes
      });
    }
  };



  const renderMessage = ({ item }) => {
    const isSender = item.username === user.username;
  
    const formatDate = (timestamp) => {
      if (!timestamp) return 'No Date Available'; // Fallback for missing timestamps

      // Determine if the timestamp is in seconds or milliseconds
      const threshold = 946684800000; // Jan 1, 2000 in milliseconds
      const isSeconds = timestamp < threshold / 1000;

      const date = new Date(isSeconds ? timestamp * 1000 : timestamp);

      if (isNaN(date.getTime())) return 'Invalid Date'; // Fallback for invalid dates

      return date.toLocaleString(); // Format the valid date
    };
    
  
    return (
      <View
        style={[
          styles.messageRow,
          isSender ? styles.messageRowRight : styles.messageRowLeft,
        ]}
      >
        {!isSender && (
          <View style={styles.avatarContainer}>
            {renderAvatar(item.username || 'Unknown')}
          </View>
        )}
  
        <View
          style={[
            styles.messageContentContainer,
            isSender ? styles.senderMessage : styles.receiverMessage,
          ]}
        >
          <Text style={styles.username}>{isSender ? 'You' : item.username || 'Unknown'}</Text>
          <Text style={styles.timestamp}>{formatDate(item.date || item.sendTime)}</Text>

  
          {/* Render message content */}
          {typeof item.content === 'string' ? (
            <Text style={styles.messageText}>{item.content}</Text>
          ) : item.content && typeof item.content.content === 'string' ? (
            <Text style={styles.messageText}>{item.content.content}</Text>
          ) : (
            <Text style={styles.messageTextError}>Invalid content</Text>
          )}
  
          {item.fileUrl && item.fileType?.startsWith('image/') && (
            <Image
              source={{ uri: `${LOCALHOST_URL}/uploads/${item.fileUrl}` }}
              style={styles.messageImage}
            />
          )}
  
          {item.fileUrl && !item.fileType?.startsWith('image/') && (
            <TouchableOpacity
              onPress={() => handleDownload(`${LOCALHOST_URL}/uploads/${item.fileUrl}`, item.fileName)}
              style={styles.downloadButton}
            >
              {downloading ? (
                <ActivityIndicator size="small" color="#0066ff" />
              ) : (
                <Text style={styles.downloadText}>Download {item.fileName}</Text>
              )}
            </TouchableOpacity>
         )}


             {/* Display retrievedFromQueueTimestamp */}
             {/* 
            {item.retrievedFromQueueTimestamp && (
              <Text style={styles.retrievedTimestamp}>
                Retrieved from Queue:{' '}
                {formatDateToLocal(item.retrievedFromQueueTimestamp)}
              </Text>
            )} */}
      </View>
  
        {isSender && (
          <View style={styles.avatarContainer}>
            {renderAvatar(user.username)}
          </View>
        )}
      </View>
    );
  };
  

  // websockett subscription for new messages
 
 

  



useEffect(() => {
  console.log('ChatWindow Props:', { user, activeChat, privateChats, setPrivateChats, sendMessage, stompClient });
}, [user, activeChat, privateChats, setPrivateChats, sendMessage, stompClient]);



 


  const getUTCOffset = (date) => {
    const offsetInMinutes = date.getTimezoneOffset();
    const absoluteOffset = Math.abs(offsetInMinutes);
    const sign = offsetInMinutes <= 0 ? '+' : '-';
    const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, '0');
    const minutes = String(absoluteOffset % 60).padStart(2, '0');
    return `${sign}${hours}:${minutes}`;
  };

  const formatDateToLocal = (timestamp) => {
    if (!timestamp) return 'Not Retrieved';
  
    // Determine if the timestamp is in seconds or milliseconds
    // If it's less than a certain threshold (e.g., Jan 1, 2000), assume seconds
    const threshold = 946684800000; // Jan 1, 2000 in milliseconds
    const numericTimestamp = typeof timestamp === 'number' ? timestamp : parseInt(timestamp, 10);
    const isSeconds = numericTimestamp < threshold / 1000;
  
    const date = new Date(isSeconds ? numericTimestamp * 1000 : numericTimestamp);
  
    if (isNaN(date.getTime())) return 'Invalid Date';
  
    const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      fractionalSecondDigits: 3,
      hour12: false, // Ensures 24-hour format
    };
  
    const formattedDate = date.toLocaleString(undefined, options);
    const utcOffset = getUTCOffset(date);
  
    return `${formattedDate} UTC${utcOffset}`;
  };

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  if (!activeChat) {
    return (
      <View style={styles.noChatContainer}>
        <Text style={styles.noChatText}>No chat selected.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      { !activeChat ? (
        <View style={styles.noChatContainer}>
          <Text style={styles.noChatText}>No chat selected.</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            data={messages.filter(
              (msg) => msg && typeof msg === 'object' && (typeof msg.content === 'string' || (msg.content && typeof msg.content.content === 'string'))
            )}
            keyExtractor={(item, index) => (item.id ? item.id.toString() : `message-${index}`)}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current.scrollToEnd({ animated: true })}
          />

          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={pickFile} style={styles.attachButton}>
              <Ionicons name="attach" size={24} color="#0066ff" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Write a message..."
              value={message}
              onChangeText={setMessage}
              editable={isConnected} 
            />
            <TouchableOpacity 
              style={[styles.sendButton, { opacity: isConnected ? 1 : 0.5 }]} 
              onPress={handleSendMessage}
              disabled={!isConnected} // Disable send button if not connected
            >
                <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  messageRowLeft: {
    justifyContent: 'flex-start',
  },
  messageRowRight: {
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    marginRight: 10,
    marginLeft: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bbb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageContentContainer: {
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10,
  },
  senderMessage: {
    backgroundColor: '#0066ff',
    alignSelf: 'flex-end',
  },
  receiverMessage: {
    backgroundColor: '#c9c9c9',
    alignSelf: 'flex-start',
  },
  username: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    color: '#aaa',
    marginBottom: 5,
  },
  messageText: {
    fontSize: 14,
    color: '#fff',
  },
  messageImage: {
    marginTop: 5,
    width: 150,
    height: 150,
    borderRadius: 10,
  },
  downloadText: {
    marginTop: 5,
    color: '#0066ff',
    textDecorationLine: 'underline',
  },
  noChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noChatText: {
    fontSize: 18,
    color: '#999',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  attachButton: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 10,
    backgroundColor: '#f5f5f5',
    color: '#000', // Text color
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#0066ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  downloadButton: {
    marginTop: 5,
    padding: 5,
    alignItems: 'center',
  },
  downloadText: {
    color: '#0066ff',
    textDecorationLine: 'underline',
  },
  retrievedTimestamp: {
    marginTop: 5,
    fontSize: 10,
    color: 'lightgray',
  },
});

export default ChatWindow;
