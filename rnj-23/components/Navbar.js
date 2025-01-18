import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Navbar = ({ user, unsetUserToken }) => {
  const [avatar, setAvatar] = useState(user?.avatarUrl || null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (user?.username) {
        try {
          const response = await fetch(`http://172.22.2.61:8082/api/users/${user.username}/avatar`);
          const result = await response.json();
          if (result.avatarUrl) {
            setAvatar(result.avatarUrl);
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
      const response = await fetch(`http://172.22.2.61:8082/api/users/${user.username}/avatar`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const result = await response.json();
      setAvatar(result.avatarUrl);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating avatar:', error);
      Alert.alert('Error', 'Failed to update avatar. Please try again.');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      unsetUserToken();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.navbar}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>ChatApp</Text>
      </View>

      {user ? (
        <View style={styles.userSection}>
          <TouchableOpacity
            onPress={() => Alert.alert('Upload Avatar', 'Avatar upload is not yet implemented.')}
          >
            <Image
              source={{ uri: avatarPreview || avatar }}
              style={styles.avatar}
            />
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
