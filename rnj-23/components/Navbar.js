import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';

const Navbar = ({ user, unsetUserToken }) => {
  const [avatar, setAvatar] = useState(user?.avatarUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (user?.username) {
        try {
          const response = await fetch(`http://172.22.2.61:8082/api/users/${user.username}/avatar`);
          if (response.ok) {
            const data = await response.json();
            if (data.avatarUrl) {
              setAvatar(data.avatarUrl);
            }
          } else if (response.status === 404) {
            console.warn('Avatar not found for user:', user.username);
          } else {
            console.error('Error fetching avatar:', response.statusText);
          }
        } catch (error) {
          console.error('Error fetching avatar:', error);
        }
      }
    };
    fetchAvatar();
  }, [user]);


  const handleAvatarChange = async (fileUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: fileUri,
      type: 'image/jpeg', // Adjust according to the image type
      name: 'avatar.jpg',
    });

    try {
      setUploading(true);
      const response = await fetch(`http://172.22.2.61:8082/api/users/${user.username}/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setAvatar(result.avatarUrl);
        setAvatarPreview(null);
        Alert.alert('Success', 'Avatar updated successfully.');
      } else {
        const errorData = await response.json();
        console.error('Error updating avatar:', errorData);
        Alert.alert('Error', 'Failed to update avatar. Please try again.');
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      unsetUserToken();
    } catch (error) {
      console.error('Error logging out:', error);
      Alert.alert('Error', 'Failed to log out. Please try again.');
    }
  };

  const pickFile = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    try {
      // Launch the image picker
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Only images
        allowsEditing: true, // Allow user to edit (crop, etc.)
        aspect: [1, 1], // Square aspect ratio
        quality: 0.7, // Compress image quality
      });

      if (!result.canceled) {
        const selectedAsset = result.assets[0];
        setAvatarPreview(selectedAsset.uri); // Show preview
        await handleAvatarChange(selectedAsset.uri); // Upload avatar
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick the image. Please try again.');
    }
  };


  return (
    <View style={styles.navbar}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ChatApp</Text>
      </View>

      {user ? (
        <View style={styles.userSection}>
          <TouchableOpacity onPress={pickFile} style={styles.avatarTouchable}>
            {uploading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Image
                source={{ uri: avatarPreview || avatar }}
                style={styles.avatar}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.authButtons}>
          <TouchableOpacity
            style={[styles.button, styles.loginButton]}
            onPress={() => Alert.alert('Login', 'Login screen not yet implemented.')}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.signupButton]}
            onPress={() => Alert.alert('Sign Up', 'Sign-up screen not yet implemented.')}
          >
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#d0d0d0',
    borderBottomWidth: 1,
    borderColor: '#BDBDBD',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    color: '#333333',
    fontWeight: 'bold',
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarTouchable: {
    marginRight: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0066ff',
    marginRight: 16,
  },
  logoutButton: {
    padding: 10,
    backgroundColor: '#0066ff',
    borderRadius: 5,
  },
  logoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  authButtons: {
    flexDirection: 'row',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    marginLeft: 8,
  },
  loginButton: {
    backgroundColor: '#0066ff',
  },
  signupButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#0066ff',
  },
  buttonText: {
    color: '#0066ff',
    fontWeight: 'bold',
  },
});

export default Navbar;
