import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { 
    FlatList, 
    SafeAreaView,
    View, 
    ScrollView,
    Text, 
    ActivityIndicator,
    StyleSheet, 
    TextInput,  
    Linking, 
    TouchableOpacity, 
    Image, 
    Alert} from 'react-native';
import { Card } from 'react-native-elements'
import { Formik, Field } from 'formik';
import { FontAwesome5 } from '@expo/vector-icons'; 
import SelectDropdown from 'react-native-select-dropdown'
import {gql,useLazyQuery} from '@apollo/client'
import * as Location from 'expo-location';
import {LogBox} from 'react-native';
import {
    AdMobBanner,
    setTestDeviceIDAsync
  } from 'expo-ads-admob';
import {AppStateContext} from '../appcontext'

const GET_RESTAURANT = gql`
 query GET_RESTAURANT($term: String, $latitude: Float!, $longitude: Float!, $price: String){
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
            photos
        }
    }
 }
`

export default function HomeScreen() {
    const [location, setLocation] = useState();
    const priceItems = [
        {label: 'any', value: '1,2,3'},
        {label: '$', value: '1'},
        {label: '$$', value: '2'},
        {label: '$$$', value: '3'}
    ]
    const ref = useRef();
    const appContext = useContext(AppStateContext);
    const [getRestaurant, { loading, data, error }] = useLazyQuery(GET_RESTAURANT);
    LogBox.ignoreLogs(['VirtualizedLists should never be nested']);
    
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
        (async () => {
            await setTestDeviceIDAsync('EMULATOR');
        })(); 
      }, []);

    if(data){
        ref.current = Math.floor(Math.random() * data.search.business.length);
    }
      
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
    const openMap = (restaurantLatitude, restaurantLongitude) => {
        if (Platform.OS === "ios") { 
            Linking.openURL(`http://maps.apple.com/maps?daddr=${restaurantLatitude},${restaurantLongitude}`) 
        }     
        else { 
            Linking.openURL(`http://maps.google.com/maps?daddr=${restaurantLatitude},${restaurantLongitude}`); 
        }
    }
    const getHeader = () => {;
        if (loading) {        
            return (<View style={styles.container}><ActivityIndicator size="large" /></View>);
        }
        return (
            <Formik
            initialValues={{ term: appContext.term, price: appContext.price, latitude: location?.coords.latitude, longitude: location?.coords.longitude}}
            onSubmit={values => {getRestaurant({errorPolicy: 'all' ,variables: {term: values.term, latitude: location?.coords.latitude, longitude: location?.coords.longitude, price: appContext.price.value}})}}
            >
            {({handleChange, handleSubmit, values}) => (
            <>
            <AdMobBanner
                bannerSize="smartBannerPortrait"
                adUnitID="ca-app-pub-6177909781754288/4231839886"
                servePersonalizedAds={true}
                onDidFailToReceiveAdWithError={(e) => console.log(e)} 
                />
            <View style={styles.logoContainer}>
                <Image
                style={styles.logo}
                source={require('../assets/logo.png')}
                />
            </View>
            <Text style={styles.header}>Let us pick where you eat so you can just enjoy</Text>
            <SelectDropdown 
             data={priceItems}
             onSelect={(selectedItem) => {
                 appContext.price = selectedItem
             }}
             buttonTextAfterSelection={(selectedItem) => {
                return selectedItem.label
            }}
            rowTextForSelection={(item) => {
                return item.label
            }}
            defaultButtonText={appContext.price.label ?? "Select a price (Optional)"}
            buttonTextStyle={styles.selectText}
            buttonStyle={styles.input}
            />
            <TextInput
                value={values.term}
                clearButtonMode={"always"}
                style={styles.input}
                onChangeText={handleChange('term')}
                onChange={e => appContext.term = e.nativeEvent.text}
                placeholder="Search Term (Optional)"
            />
            <Text>location: {location?.coords.latitude}, {location?.coords.longitude}</Text>
            <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={!location}>
                {location ? 
                    <Text style={styles.buttonTxt}>Feelin' Fickle</Text> 
                    :
                    <View style={styles.container}><ActivityIndicator size="large" /></View>
                }
            </TouchableOpacity>           
            </> 
            )}                
            </Formik>
        )
    };
    const getFooter = () => {        
        if(error){
            return (<Text>Looks like something went wrong. {error.message}</Text>)
        }
        if(!data){
            return(
            <View>
                <Text style={{textAlign:"center", margin: 5, fontSize: 20}}>No Results</Text>
                <Image style={styles.footerImg} source={require('../assets/img/woman-thinking.png')}></Image>
            </View>)
        }
        return null
    };
  return (
      <SafeAreaView style={styles.container}>
        <ScrollView>
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
             <View>
                <Card wrapperStyle={styles.card}>
                    
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
                    <Card.Divider/>
                    <Card.Image source={item.photos.length ? {uri:item.photos[0]} : require('../assets/img/selection.jpg')}></Card.Image>                   
                </Card>
                </View>
            )
        }}
        >    
        </FlatList>
        </ScrollView>
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
        width: 300,
        height: 400
    },
    button: {
        height: 50,
        padding: 10,
        marginTop: 10,
        marginHorizontal: 5,
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
    },
    icon: {
        width: 50,
        height: 50,
        padding: 11,
        borderRadius: 25,
        borderWidth: 1,
        marginHorizontal: 5
    },
    container: {
        flex: 1,     
        flexDirection: "row",
        backgroundColor: "white",
        margin: 5,
        alignItems: 'center',
        justifyContent: 'center',
        height: "100%",
    },
    content: {
        alignItems: 'center',
        justifyContent: 'flex-start',
        textAlign: "center",
        height: "100%"
    },
    flatListContainer: {
        marginBottom: 30
    },
    input: {
        height: 50,
        width: 350,
        borderWidth: 1,
        marginTop: 10,
        marginHorizontal: 10,
        padding: 10,
        borderRadius: 10,
        backgroundColor: '#FFFFFF'
      },
      selectText: {
          fontSize: 14,
          textAlign: 'left'
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