import React from 'react';
import { View, StyleSheet } from 'react-native';
import Login from './Login'; 
import Menu from './Menu'; 

const Home = ({ user, setUserToken, unsetUserToken }) => {
  return (
    <View style={styles.container}>
      {!user ? (
        <Login setUserToken={setUserToken} unsetUserToken={unsetUserToken} />
      ) : (
        <Menu user={user} unsetUserToken={unsetUserToken} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#f5f5f5', 

  },
});

export default Home;
