import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
    FlatList, 
    SafeAreaView,
    View, 
    Text, 
    ActivityIndicator,
    StyleSheet, 
    TextInput, 
    Button, 
    Linking, 
    TouchableOpacity, 
    Image, 
    Alert} from 'react-native';
import { Card, Divider } from 'react-native-elements'
import { FontAwesome5 } from '@expo/vector-icons'; 
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
            coordinates {
                latitude
                longitude
            }
            location {
                formatted_address       
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
      
    const OpenURLButton = ({ url, name }) => {
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
      
        return <FontAwesome5 style={styles.icon} name={name} size={24} color="red" onPress={handlePress} />;
    };
    const openMap = (latitude, longitude) => {
        if (Platform.OS === "ios") { 
            Linking.openURL(`http://maps.apple.com/maps?daddr=${latitude},${longitude}`) 
        }     
        else { 
            Linking.openURL(`http://maps.google.com/maps?daddr=${latitude},${longitude}`); 
        }
    }
    const getHeader = () => {
        return (
            <>
            <View style={styles.logoContainer}>
                <Image
                style={styles.logo}
                source={require('../assets/logo.png')}
                />
            </View>
            <Text style={styles.header}>Let us pick where you eat so you can just enjoy</Text>
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
            </>
        )
    };
    const getFooter = () => {
        if (loading) {        
            return (<SafeAreaView style={styles.container}><ActivityIndicator size="large" /></SafeAreaView>);
        }
        if(error){
            return (<Text>{error.message}</Text>)
        }
        if(!data){
            return(
            <View>
                <Text style={{textAlign:"center"}}>No Results</Text>
                <Image style={styles.footerImg} source={require('../assets/img/woman-thinking.png')}></Image>
            </View>)
        }
        else{
            <View>
                <Text>Cheers!</Text>
            </View>
        }
        return null
    };
  return (
    <SafeAreaView style={styles.container}>
        <FlatList 
        style={styles.flatListContainer}
        contentContainerStyle={styles.content}
        data={data?.search.business.filter(item => item === data?.search.business[ref.current])}
        ListHeaderComponent={getHeader}
        ListFooterComponent={getFooter}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({item}) => {
            return (
            data && data?.search.total > 0 &&   
                <Card wrapperStyle={styles.card}>
                    <Card.Image source={require('../assets/img/selection.jpg')}></Card.Image>
                    <Card.Divider/>
                    <Card.Title><Text style={styles.results}>{item?.name}</Text></Card.Title>
                    <Card.Divider />
                    <Text>Price: {item?.price}</Text>
                    <Text>{item?.location.formatted_address}</Text>
                    <Text>Distance: {(item?.distance*0.000621371192).toFixed(2)} miles away</Text>
                    <Card.Divider />
                    <View style={styles.iconContainer}>
                        <FontAwesome5 style={styles.icon} name="directions" size={24} color="black" onPress={() => openMap(item?.coordinates.latitude, item?.coordinates.longitude)} />
                        <FontAwesome5 style={styles.icon} name="phone" size={24} color="black" onPress={() => Linking.openURL(`tel:${item.phone}`)}/>
                        <OpenURLButton url={item?.url} name="yelp" />
                    </View>
                </Card>
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
    headerContainer: {
        flex: 1,
        justifyContent: "center",
        alignContent: "center"
    },
    footerImg: {
        width: 300,
        height: 300
    },
    results: {
        textAlign: "center", 
        fontSize: 20,
        marginBottom: 10
    },
    card: {
        width: "100%",
        height: 400
    },
    button: {
        width: 375,
        height: 50,
        padding: 10,
        marginTop: 10,
        backgroundColor: "#7AEDC5",
        alignContent: "center",
        justifyContent: "center",
        borderRadius: 10
    },
    buttonTxt: {
        color:'#595959',
        textAlign: "center"
    },
    iconContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: "center",
        justifyContent: "center",
        margin: 5
    },
    icon: {
        width: 50,
        height: 50,
        padding: 11,
        borderRadius: 25,
        borderWidth: 1,
        margin: 5
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
        marginHorizontal: 5,
        marginVertical: 5,
        backgroundColor: "white",
        width: "100%",
        height: "100%"
    },
    content: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: "center",
        height: "100%"
    },
    flatListContainer: {
        flexGrow: 0
    },
    input: {
        width: 375,
        height: 50,
        borderWidth: 1,
        marginTop: 10,
        padding: 10,
        borderRadius: 10
      },
      logo: {
          margin: "auto",
          width: 100,
          height: 100
      },
      logoContainer: {
          flex: 0,
          flexDirection: "row",
          justifyContent: "center",
          alignContent: "center"
      }
  });