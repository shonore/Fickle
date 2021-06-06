import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {gql,useLazyQuery } from '@apollo/client'
import * as Location from 'expo-location';

const GET_RESTAURANT = gql`
 query ($term: String, $latitude: Float!, $longitude: Float!, $price: String){
    search(
        term: $term
        latitude: $latitude,
        longitude: $longitude,
        price: $price,
        open_now: true,
        radius: 40000,
        limit: 50,
        offset: 10 
        ) {
        total
        business {
            name
            rating
            price
            url
            phone
            location {
                address1
                address2
                city
                state
                
            }
        }
    }
 }
`

export default function HomeScreen() {
    const [location, setLocation] = useState();
    const [termText, onChangeTermText] = useState();
    const [open, setOpen] = useState(false);
    const [priceValue, setPriceValue] = useState();
    const [priceItems, setPriceItems] = useState([
        {label: '$', value: '1'},
        {label: '$$', value: '2'},
        {label: '$$$', value: '3'}
    ]);
    const ref = useRef(null)
    const [getRestaurant, { loading, data, error }] = useLazyQuery(GET_RESTAURANT);
    useEffect(() => {
        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
          }
    
          let location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        })();
      }, []);
    if (loading) (<View><Text>Loading...</Text></View>);
    if(data)ref.current = Math.floor(Math.random() * data.search.business.length)
  
  return (
    <View style={styles.container}>
        <Text>Let us know what your in the mood for and we will pick dinner for you. </Text>
        <DropDownPicker
            open={open}
            value={priceValue}
            items={priceItems}
            setOpen={setOpen}
            setValue={setPriceValue}
            setItems={setPriceItems}
            placeholder="Enter a price"
        />
        <TextInput
            style={styles.input}
            onChangeText={onChangeTermText}
            value={termText}
            placeholder="Search Term (Optional)"
        />
        <Button 
            title="Pick Restaurant" 
            style={styles.button}
            onPress={() => getRestaurant({errorPolicy: 'all' ,variables: {term: termText, latitude: location.coords.latitude, longitude: location.coords.longitude, price: priceValue}})}
            >           
        </Button>
        <Text>{error && error.message}</Text>
        {data?.search?.total > 0 && 
        <>
            <Text>You should eat at </Text>
            <Text>{data.search.business[ref.current]?.name}</Text>
            <Text>Phone: {data.search.business[ref.current]?.phone}</Text>
            <Text>Website: {data.search.business[ref.current]?.url}</Text>   
        </> 
        }       
    </View>
  );
}

const styles = StyleSheet.create({
    button: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        padding: 10
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 15
    },
    input: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        marginTop: 10,
      }
  });