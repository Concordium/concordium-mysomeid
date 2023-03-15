import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    // fontFamily: "CircularStd-Book",
    fontSize: 14,
    color: '#2f354b',
    textAlign: 'center'
  },
  title: {
    color: 'white',
  },
  red: {
    color: 'red',
  },
});

export const defaultFontName = "DIN Alternate";

export const defaultFont = {
  fontFamily: defaultFontName,
};