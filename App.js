import React from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink} from '@apollo/client';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/home'
import { REACT_APP_API_KEY,REACT_APP_ENDPOINT } from '@env'

const client = new ApolloClient({
  cache: new InMemoryCache(),
  link: new HttpLink({   
    uri: REACT_APP_ENDPOINT, 
    headers: {
      authorization: `Bearer ${REACT_APP_API_KEY}`,
    }, 
    onError: ({ networkError, graphQLErrors }) => {       
      console.log('graphQLErrors', graphQLErrors)       
      console.log('networkError', networkError)     
    }   
  })
});

const Stack = createStackNavigator();

export default function App() {
  return (
    <ApolloProvider client={client}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="U-Pick" component={HomeScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ApolloProvider>
  );
}
