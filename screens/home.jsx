import React, { useState, useEffect, useRef, useCallback } from "react";
import { SafeAreaView, Text, ActivityIndicator,ScrollView, StyleSheet, TextInput, Button, Linking, TouchableOpacity, Image, Alert } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import {gql,useLazyQuery } from '@apollo/client'
import * as Location from 'expo-location';
import { CloseCircleO } from '@expo/vector-icons';

const GET_RESTAURANT = gql`
 query ($term: String, $latitude: Float!, $longitude: Float!, $price: String){
    search(
        term: $term
        latitude: $latitude,
        longitude: $longitude,
        price: $price,
        open_now: true,
        radius: 16100,
        limit: 50
        ) {
        total
        business {
            name
            rating
            price
            url
            phone
            distance
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
    const [errorMsg, setErrorMsg] = useState();
    const [termText, onChangeTermText] = useState();
    const [open, setOpen] = useState(false);
    const [priceValue, setPriceValue] = useState();
    const [priceItems, setPriceItems] = useState([
        {label: '$', value: '1'},
        {label: '$$', value: '2'},
        {label: '$$$', value: '3'}
    ]);
    const ref = useRef(null);
    let controller = null; 
    const [getRestaurant, { loading, data, error }] = useLazyQuery(GET_RESTAURANT);

    useEffect(() => {
        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status && status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
          }
    
          let location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        })();
      }, []);
    if (loading) (<SafeAreaView><ActivityIndicator size="large" /></SafeAreaView>);
    if(data)ref.current = Math.floor(Math.random() * data.search.business.length)

    const OpenURLButton = ({ url, children }) => {
        const handlePress = useCallback(async () => {
          // Checking if the link is supported for links with custom URL scheme.
          const supported = await Linking.canOpenURL(url);
      
          if (supported) {
            // Opening the link with some app, if the URL scheme is "http" the web link should be opened
            // by some browser in the mobile
            await Linking.openURL(url);
          } else {
            Alert.alert(`Don't know how to open this URL: ${url}`);
          }
        }, [url]);
      
        return <Button title={children} onPress={handlePress} />;
      };
  
  return (
    <SafeAreaView style={styles.container}>
        <Image
            style={styles.logo}
            source={require('../assets/u-pick-logo.png')}
        />
        <Text style={styles.header}>Let us know what you're in the mood for and we will pick dinner for you. </Text>
        <DropDownPicker
            open={open}
            value={priceValue}
            items={priceItems}
            setOpen={setOpen}
            setValue={setPriceValue}
            setItems={setPriceItems}
            closeAfterSelecting={true}
            placeholder="Enter a price (Optional)"
            placeholderStyle={{color: "grey"}}
            controller={instance => controller = instance}
        />
        <TextInput
            style={styles.input}
            onChangeText={onChangeTermText}
            value={termText}
            placeholder="Search Term (Optional)"
        />
        <TouchableOpacity style={styles.button} onPress={() => getRestaurant({errorPolicy: 'all' ,variables: {term: termText, latitude: location?.coords.latitude, longitude: location?.coords.longitude, price: priceValue, offset: Math.floor(Math.random() * 50) + 1}})}>
            <Text style={styles.buttonTxt}>Pick Restaurant</Text>
        </TouchableOpacity>         
        <Text>{error && error.message}</Text>
        {data?.search?.total > 0 && 
        <>
            <Text>You should eat at </Text>
            <Text style={styles.results}>{data.search.business[ref.current]?.name}</Text>
            <Text>Price: {data.search.business[ref.current]?.price}</Text>
            <Text>Distance: {(data.search.business[ref.current]?.distance*0.000621371192).toFixed(2)} miles away</Text>
            <Button title="Call Business" onPress={() => Linking.openURL(`tel:${data.search.business[ref.current]?.phone}`)}>{data.search.business[ref.current]?.phone}</Button>
            <OpenURLButton url={data.search.business[ref.current]?.url}>View on Yelp</OpenURLButton>  
        </> 
        }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    header: {
        width: "100%",
        marginBottom: 20,
        fontSize: 15, 
        textAlign: "center"
    },
    results: {
        width: "100%",
        textAlign: "center", 
        fontSize: 15
    },
    button: {
        width: "100%",
        height: 40,
        padding: 10,
        marginTop: 10,
        backgroundColor: "#7AEDC5"
    },
    buttonTxt: {
        color:'#595959',
        textAlign: "center"
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        margin: 15,
    },
    input: {
        width: "100%",
        height: 40,
        borderWidth: 1,
        marginTop: 10,
        padding: 10
      },
      logo: {
          width: 100,
          height: 100
      }
  });