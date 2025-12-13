import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
// import Modal from 'react-native-modal';

let showAlertCallback = null;

export const CustomAlertPopup = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({
    title: '',
    message: '',
    onConfirm: null, // Callback for "Yes" button,
    onClosee: null, // Callback for "Yes" button,
    yesText: 'YES',
    noText: '',
  });

  // Function to show the alert
  showAlertCallback = ({
    title,
    message,
    onConfirm,
    onClosee,
    yesText,
    noText,
  }) => {
    setConfig({title, message, onConfirm, onClosee, yesText, noText});
    setVisible(true);
  };

  // Function to hide the alert
  const hideAlert = () => setVisible(false);

  return (
    <View>
      <Modal
        transparent
        animationType="fade"
        visible={visible}
        onRequestClose={hideAlert}
        statusBarTranslucent>
        <View style={styles.overlay}>
          <View style={styles.hide1}>
            <View style={styles.hide2}>
              <Text style={[styles.txt4, {fontWeight: 'bold'}]}>
                {config.title}
              </Text>
              <Text style={[styles.txt4, {marginTop: 5}]}>
                {config.message}
              </Text>
              <View
                style={{
                  width: '100%',
                  flexDirection: 'row',
                  justifyContent:
                    config.noText !== '' ? 'space-between' : 'center',
                  alignItems: 'center',
                }}>
                {config.noText !== '' && (
                  <TouchableOpacity
                    style={[styles.tc1, {width: '48%'}]}
                    onPress={() => {
                      if (config.onClosee) config.onClosee();
                      hideAlert();
                    }}>
                    <Text style={styles.txt5}>
                      {config.noText ? config.noText : ''}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.tc1, {width: '48%'}]}
                  onPress={() => {
                    if (config.onConfirm) config.onConfirm();
                    hideAlert();
                  }}>
                  <Text style={styles.txt5}>{config.yesText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Function to trigger the alert
export const showAlert = config => {
  if (showAlertCallback) showAlertCallback(config);
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    // height  : '100%',
    // width: '100%',

    // backgroundColor: COLORS.BACKGROUND_COLOR,
    // backgroundColor: 'pink',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertBox: {
    width: 300,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },

  hide1: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    zIndex: 2000,
    textAlignVertical: 'center',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  hide2: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderRadius: 20,
    shadowColor: 'rgba(0,0,0,0.20)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '96%',
  },
  tc1: {
    width: 160,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderColor: 'purple',
    borderWidth: 1,
    alignSelf: 'center',
    marginTop: 10,
  },
  txt5: {
    fontSize: 14,
    color: '#000',
    letterSpacing: 0.2,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  txt4: {
    fontSize: 16,
    color: '#000',
    letterSpacing: 0.2,
    fontWeight: 'medium',
  },
});
