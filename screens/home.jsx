import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {gql,useLazyQuery } from '@apollo/client'
import * as Location from 'expo-location';

const GET_RESTAURANT = gql`
 query Search($term: String, $latitude: Float!, $longitude: Float!, $price: String){
    search(
        term: $term
        latitude: $latitude,
        longitude: $longitude,
        price: $price,
        open_now: true,
        radius: 25000,
        ) {
        total
        business {
            name
            rating
            review_count
            location {
                address1
                city
                state
                country
            }
        }
    }
 }
`

export default function HomeScreen() {
    const [location, setLocation] = useState(null);
    const [termText, onChangeTermText] = useState(null);
    const [open, setOpen] = useState(false);
    const [priceValue, setPriceValue] = useState(null);
    const [priceItems, setPriceItems] = useState([
        {label: '$', value: '$'},
        {label: '$$', value: '$$'},
        {label: '$$$', value: '$$$'}
    ]);
    const [showResults, setShowResults] = useState(false);
    const [results, setResults] = useState({});
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
    if(data){
        console.log(data);
        setShowResults(true);
        setResults(data);
    }  
    if (loading) (<View><Text>Loading...</Text></View>);
    if(error)console.log(error)
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
        {showResults && 
            <Text>{results}</Text>
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