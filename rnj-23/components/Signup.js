import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

const SIGNUP_URL = 'http://172.22.2.61:8082/api/signup';

const Signup = ({ navigation }) => {
  // State variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form submit
  const signup = async () => {
    if (!username || !password || !email) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    setIsSubmitting(true);

    const signupBody = {
      username: username.trim(),
      password: password,
      email: email.trim(),
    };

    try {
      const response = await fetch(SIGNUP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupBody),
      });

      if (response.ok) {
        Alert.alert('Success', 'You have been successfully registered.');
        navigation.navigate('Home'); // Navigate to the Home screen
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Signup failed.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to the server.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Sign Up</Text>

      {/* Username Input */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChangeText={setUsername}
      />

      {/* Password Input */}
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {/* Email Input */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={signup}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Submitting...' : 'Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Login Redirect */}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.redirectText}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
    color: '#333',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#0066ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  redirectText: {
    color: '#0066ff',
    textDecorationLine: 'underline',
  },
});

export default Signup;
