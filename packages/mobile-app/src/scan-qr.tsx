import React, { Component, useEffect, useState } from "react";
import { Modal, Pressable, Text, View, StyleSheet, Button,} from "react-native";
import { BarCodeScanner } from 'expo-barcode-scanner';
// import {styles} from './styles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Platform } from 'react-native';
// import { useTimeout } from "./use-interval";
import * as Device from 'expo-device';

const styles = StyleSheet.create({
  modalContent: {
    height: '100%',
    width: '100%',
    backgroundColor: '#25292e',
    borderTopRightRadius: 18,
    borderTopLeftRadius: 18,
    position: 'absolute',
    bottom: 0,
  },
  title: {
    color: '#fff',
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 50,
    paddingVertical: 20,
  },
});

export const ScanQRDevice = ({isVisible, onCloseWithResult}: any) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState<boolean>(false);

  const returnWithResult = (res: any) => {
    onCloseWithResult && onCloseWithResult(res);
    onCloseWithResult = null;
  };

  useEffect(() => {
    if ( isVisible ) {
      setScanned(false);
    }
  }, [isVisible]);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission( `${status}` === 'granted');
      return `${status}` === 'granted';
    })().then((granted) => {
      if ( !granted ) {
        returnWithResult({error: 'Permissions not granted'});
      }
    }).catch(() => {
      returnWithResult({error: 'Exception getting permissions'});
    })
  }, []);

  const handleBarCodeScanned = ({ type, data }: {type: any, data: any}) => {
    if (scanned){
      console.log('Already scanned');
      return;
    }
    setScanned(true);
    returnWithResult({type, data});
  };

  if ( !hasPermission ) {
    return (
      <View>
        <Text>Please grant permissions to accesss the Camera to scan the QR code.</Text>
      </View>
    );
  }
      
  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={styles.modalContent}>
        {!scanned && <BarCodeScanner
          onBarCodeScanned={handleBarCodeScanned}
          style={{
            ...StyleSheet.absoluteFillObject,
            top: 0,
            backgroundColor: 'transparent',
          }}
        />}

        <View style={{
            height: '12%',
            backgroundColor: 'black',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.title}>Detect QR Code</Text>
          <Pressable onPress={() => {
            returnWithResult({cancelled: true});
          }}>
            <MaterialIcons name="close" color="#fff" size={22} />
          </Pressable>
        </View>

      </View>
    </Modal>
  );
}

const TestQRScan = ({isVisible, onCloseWithResult}: {isVisible: boolean, onCloseWithResult: any}) => {
  const returnWithResult = (res: any) => {
    onCloseWithResult && onCloseWithResult(res);
    onCloseWithResult = null;
  };

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible}>
      <View style={styles.modalContent}>
        <View style={{
            height: '12%',
            backgroundColor: 'black',
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text style={styles.title}>Detect QR Code</Text>
          <Pressable onPress={() => {
            returnWithResult({cancelled: true});
          }}>
            <MaterialIcons name="close" color="#fff" size={22} />
          </Pressable>
        </View>
        <View>
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate Scan QR Code - Ok"
            onPress={() => returnWithResult({type: 'qr', data: 'https://app.mysomeid.dev/view/PuKBjRT1?p=li&u=kristian-mortensen-22a59b266'})}
          />
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate Error - unknown"
            onPress={() => returnWithResult({error: 'Unknown error'})}
          />
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate Error - invalid data, not url"
            onPress={() => returnWithResult({type: 'qr', data: 'asdsadsadasd'})}
          />
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate Error - invalid data, url is not mysome"
            onPress={() => returnWithResult({type: 'qr', data: 'https://app.asdasdad.dev/view/dsadsadasdsda'})}
          />
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate Error - invalid data, url but no proof id"
            onPress={() => returnWithResult({type: 'qr', data: 'https://app.mysomeid.dev/view'})}
          />
          <View style={{marginTop: 13}}></View>
          <Button
            title="Simulate cancel"
            onPress={() => returnWithResult({cancelled: true})}
          />
        </View>
      </View>
    </Modal>
  );
};

export const ScanQR = ({isVisible, onCloseWithResult}: any) => {
  const isIOS = Platform.OS === 'ios';
  const isAndroid = Platform.OS === 'android';
  const isSimulator = (isIOS || isAndroid) && !Device.isDevice;

  if ( !isVisible ) {
    return null;
  }

  if ( Platform.OS === 'web' || isSimulator ) {
    return <TestQRScan {...{isVisible, onCloseWithResult}} />;
  }

  return <ScanQRDevice {...{isVisible, onCloseWithResult}} />;
}

