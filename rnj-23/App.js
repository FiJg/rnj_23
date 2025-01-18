import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Home from './components/Home';
import Signup from './components/Signup';
import Navbar from './components/Navbar';

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
   const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUserToken();
  }, []);

  const setUserToken = async (userToken) => {
    try {
      await AsyncStorage.setItem('userToken', JSON.stringify(userToken));
      setUser(userToken);
    } catch (error) {
      console.error('Failed to set user token:', error);
    }
  };

  const unsetUserToken = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      setUser(null);
    } catch (error) {
      console.error('Failed to unset user token:', error);
    }
  };

  const getUserToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) setUser(JSON.parse(token));
    } catch (error) {
      console.error('Failed to get user token:', error);
    }
  };

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Navbar user={user} unsetUserToken={unsetUserToken} />
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen name="Home">
            {() => (
              <Home
                user={user}
                setUserToken={setUserToken}
                unsetUserToken={unsetUserToken}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Signup" component={Signup} />
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
