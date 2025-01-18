import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';

const LOGIN_URL = 'http://172.22.2.61:8082/login';

const Login = ({ setUserToken}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async () => {
    if (!username || !password) {
      Alert.alert('Validation Error', 'Username and Password are required.');
      return;
    }
  
    setIsSubmitting(true);
  
    const loginBody = {
      username: username.trim(),
      password: password,
    };
  
    try {
      const response = await fetch(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginBody),
      });
  
      const contentType = response.headers.get('Content-Type');
      const responseText = await response.text(); // Get raw response
  
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = JSON.parse(responseText); // Parse JSON
        setUserToken(data); // Save token
        navigation.navigate('Home'); // Navigate to Home
      } else {
        console.error('Server Error:', responseText);
        Alert.alert('Error', 'Unexpected response from server.');
      }
    } catch (error) {
     // Alert.alert('Error', 'Failed to connect to the server.');
     // console.error('Fetch Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Log In</Text>

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

      {/* Login Button */}
      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.disabledButton]}
        onPress={login}
        disabled={isSubmitting}
      >
        <Text style={styles.buttonText}>
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </Text>
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

export default Login;
