import React, { useState, useEffect, useRef, useCallback } from "react";
import { FlatList, SafeAreaView,View, Text, ActivityIndicator,StyleSheet, TextInput, Button, Linking, TouchableOpacity, Image, Alert } from 'react-native';
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
    const [open, setOpen] = useState(false);
    const [priceValue, setPriceValue] = useState();
    const priceItems = [
        {label: 'any', value: '1,2,3'},
        {label: '$', value: '1'},
        {label: '$$', value: '2'},
        {label: '$$$', value: '3'}
    ]
    const termText = useRef();
    const ref = useRef(null);
    const [getRestaurant, { loading, data, error }] = useLazyQuery(GET_RESTAURANT);

    useEffect(() => {
        (async () => {
          let { status } = await Location.requestForegroundPermissionsAsync();
          if (status && status !== 'granted') {
            Alert.alert('Permission to access location was denied');
            return;
          }
    
          let location = await Location.getCurrentPositionAsync({});
          setLocation(location);
        })();
      }, []);

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

    const getHeader = () => {
        return (
            <SafeAreaView style={styles.container}>
            <Image
            style={styles.logo}
            source={require('../assets/logo.png')}
        />
            <Text style={styles.header}>Let us simply pick where you eat on a whim.</Text>
            <DropDownPicker
                open={open}
                value={priceValue}
                items={priceItems}
                setOpen={setOpen}
                setValue={setPriceValue}
                closeAfterSelecting={true}
                placeholder="Enter a price (Optional)"
                placeholderStyle={{color: "grey"}}
                style={styles.input}
            />
            <TextInput
                style={styles.input}
                onChangeText={text => termText.current = text}
                placeholder="Search Term (Optional)"
            />
            <TouchableOpacity style={styles.button} onPress={() => getRestaurant({errorPolicy: 'all' ,variables: {term: termText.current, latitude: location?.coords.latitude, longitude: location?.coords.longitude, price: priceValue}})}>
                <Text style={styles.buttonTxt}>Pick Restaurant</Text>
            </TouchableOpacity>         
            </SafeAreaView>
        )
    };
    const getFooter = () => {
        if (loading) {        
            return (<SafeAreaView style={styles.container}><ActivityIndicator size="large" /></SafeAreaView>);
        }
        if(error){
            return (<Text>{error.message}</Text>)
        }
        return null
    };
  return (
    <SafeAreaView style={styles.container}>
        <FlatList 
        styles={styles.flatListContainer}
        contentContainerStyle={styles.content}
        data={data?.search.business.filter(item => item === data?.search.business[ref.current])}
        ListHeaderComponent={getHeader}
        ListFooterComponent={getFooter}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => {
            return (
            data?.search.total > 0 ?   
            <View>
                <Text style={{textAlign:"center"}}>You should eat at </Text>
                <Text style={styles.results}>{item?.name}</Text>
                <Text>Price: {item?.price}</Text>
                <Text>Distance: {(item?.distance*0.000621371192).toFixed(2)} miles away</Text>
                <Button title={item?.phone ?? ""} onPress={() => Linking.openURL(`tel:${item.phone}`)}/>
                <OpenURLButton url={item?.url}>View on Yelp</OpenURLButton>
            </View> :
            <View><Text>No Results</Text></View>
            )
        }}
        >
        </FlatList>        
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: 20,
        fontSize: 15, 
        textAlign: "center"
    },
    results: {
        textAlign: "center", 
        fontSize: 20,
        marginBottom: 10
    },
    button: {
        width: 375,
        height: 50,
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
        margin: 10
    },
    content: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: "center"    
    },
    flatListContainer: {
        margin: 15,
    },
    input: {
        width: 375,
        height: 50,
        borderWidth: 1,
        marginTop: 10,
        padding: 10
      },
      logo: {
          width: 100,
          height: 100
      }
  });