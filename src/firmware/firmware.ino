/*
    This sketch is a Movuino firmware.
    It allows the Movuino to send data on a specific Wifi through an OSC protocol. (Open Sound Control)
*/

// -> todo: remove (moved to OSCServer.h)
//#include <ESP8266WiFi.h>
//#include <ESP8266WiFiMulti.h>
//#include <WiFiUdp.h>

#include "Wire.h"
//#include "I2Cdev.h"
//#include "MPU6050.h"

// -> todo: remove (moved to OSCServer.h)
//#include <OSCBundle.h>
//#include <OSCMessage.h>
//#include <OSCTiming.h>

// was this used anywhere ?
// #include <SLIPEncodedSerial.h>
// #include <SLIPEncodedUSBSerial.h>

// persist/retrieve settings to/from EEPROM
// #include "Settings.h"

#include "Controller.h"
#include "SerialCLI.h"
#include "OSCServer.h"

// Set your wifi network configuration here
//*
char *ssid = "jojojo";                          // your network SSID (name of the wifi network)
char *pass = "";                                // your network password
char *hostIP =  "192.168.0.2";                  // IP address of the host computer
unsigned int portOut = 7400;               // port on which data are sent (send OSC message)
unsigned int portIn = 7401;                // local port to listen for UDP packets (receive OSC message)
//*/
char movuinoIP[4];


// MPU6050 accelgyro;
// ESP8266WiFiMulti WiFiMulti;
// WiFiClient client; // is this used anywhere ?

int packetNumber = 0;
int16_t ax, ay, az; // store accelerometre values
int16_t gx, gy, gz; // store gyroscope values
int16_t mx, my, mz; // store magneto values
int magRange[] = {666, -666, 666, -666, 666, -666}; // magneto range values for calibration

// -> todo: remove (moved to Controller.h)
// Button variables
// const int pinBtn = 13;     // the number of the pushbutton pin
boolean isBtn = 0;         // variable for reading the pushbutton status
float pressTime = 500;     // pressure time needed to switch Movuino state
float lastButtonTime;
boolean lockPress = false; // avoid several activation on same button pressure

// -> todo: remove (moved to Controller.h)
// LEDs
//const int pinLedWifi = 2;  // wifi led indicator
//const int pinLedBat = 0;   // battery led indicator

// -> todo: remove (moved to Controller.h)
// Vibrator
//const int pinVibro = 14;  // vibrator pin
boolean isVibro = false; // true when vibrating
int dVibON = 1000; // duration of vibration when vibrator is ON
int dVibOFF = 1000; // delay between vibrations when vibrator is ON
int dVib = dVibON + dVibOFF; // time between 2 vibration cycles
float rVib = dVibON / (float)dVib; // ratio of time on which vibrations are ON
long timerVibro = 0; // time where vibrations start
int nVib = 3; // number of vibration (-1 for infinite)

// Serial variables -> todo: remove (moved to SerialCLI.h)
int inByte = 0;  // incoming serial byte
char buff[40]; // buff to store incoming bytes
int bufIndex = 0; // current index of the buff
char msgAdr = 'X'; // address of received messages
String msgVal = "X"; // values of received messages

// -> todo: remove (moved to OSCServer.h)
//WiFiUDP Udp;
//OSCErrorCode error;

Controller *controller;
SerialCLI *serialCLI;
OSCServer *oscServer;

void setup() {
  Wire.begin();
  Serial.begin(115200);
  while(!Serial) {
    ;
  }

  controller = new Controller(); // controls hardware, and local settings
  
  serialCLI = new SerialCLI(controller);
  oscServer = new OSCServer(controller);

  controller->init(serialCLI, oscServer);
  
  oscServer->startWiFi();
}

void loop() {
  serialCLI->updateInputBuffer();
  oscServer->readInputOSCMessages();

  controller->update(); // for vibrator and eventually other real time processes

  // controller->sendSerialSettings();
  // delay(1000);

  // char *data[] = { "aaa", "127", "ZPO!!!!" };
  // serialCLI->sendSerialCommand((char **)data, 3);
  // delay(1000);

  // getSerialMsg(); // update msgAdr & msgMsg
  // serialComm->getSerialMessage();

  // BUTTON CHECK (now done in Controller)
  // checkButton();

  // MOVUINO DATA
  if (WiFi.status() == WL_CONNECTED) {
    // IPAddress myIp = WiFi.localIP();

    // GET MOVUINO DATA
    //accelgyro.getMotion9(&ax, &ay, &az, &gx, &gy, &gz, &mx, &my, &mz); // Get all 9 axis data (acc + gyro + magneto)
    //---- OR -----//
    //accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz); // Get only axis from acc & gyr

    //delay(5);
    //magnetometerAutoCalibration();

    if (millis() < 30000) {
      // printMovuinoData(); // optional
    }

    /*
    delay(2);
    if(!digitalRead(pinVibro)){
      // SEND MOVUINO DATA
      OSCMessage msg("/movuinOSC"); // create an OSC message on address "/movuinOSC"
      msg.add(splitFloatDecimal(-ax / 32768.0));   // add acceleration X data as message
      msg.add(splitFloatDecimal(-ay / 32768.0));   // add acceleration Y data
      msg.add(splitFloatDecimal(-az / 32768.0));   // add ...
      msg.add(splitFloatDecimal(gx / 32768.0));
      msg.add(splitFloatDecimal(gy / 32768.0));
      msg.add(splitFloatDecimal(gz / 32768.0));    // you can add as many data as you want
      msg.add(splitFloatDecimal(my / 100.0));
      msg.add(splitFloatDecimal(mx / 100.0));
      msg.add(splitFloatDecimal(-mz / 100.0));
      Udp.beginPacket(hostIP, portOut); // send message to computer target with "hostIP" on "port"
      msg.send(Udp);
      Udp.endPacket();
      msg.empty();

      delay(5);
    }
    //*/

    // RECEIVE EXTERNAL OSC MESSAGES
    /*
    OSCMessage bundle;
    int size = Udp.parsePacket();
    if (size > 0) {
      while (size--) {
        bundle.fill(Udp.read()); // read incoming message into the bundle
      }
      if (!bundle.hasError()) {
        bundle.dispatch("/vibroPulse", callbackVibroPulse);
        bundle.dispatch("/vibroNow", callbackVibroNow);
      } else {
        error = bundle.getError();
        Serial.print("error: ");
        Serial.println(error);
      }
    }
    //*/

    // MANAGE VIBRATIONS (now done in Controller)
    /*
    if (isVibro) {
      vibroPulse();
    }
    //*/
  }
  else {
    delay(50); // wait more if Movuino is sleeping
  }
}

/*
void printMovuinoData() {
  Serial.print(ax / float(32768));
  Serial.print("\t ");
  Serial.print(ay / float(32768));
  Serial.print("\t ");
  Serial.print(az / float(32768));
  Serial.print("\t ");
  Serial.print(gx / float(32768));
  Serial.print("\t ");
  Serial.print(gy / float(32768));
  Serial.print("\t ");
  Serial.print(gz / float(32768));
  Serial.print("\t ");
  Serial.print(mx);
  Serial.print("\t ");
  Serial.print(my);
  Serial.print("\t ");
  Serial.print(mz);
  Serial.println();
}

float splitFloatDecimal(float f_){
  int i_ = f_ * 1000;
  return i_/1000.0f;
}

void magnetometerAutoCalibration() {
  int magVal[] = {mx, my, mz};
  for (int i = 0; i < 3; i++) {
    // Compute magnetometer range
    if (magVal[i] < magRange[2 * i]) {
      magRange[2 * i] = magVal[i]; // update minimum values on each axis
    }
    if (magVal[i] > magRange[2 * i + 1]) {
      magRange[2 * i + 1] = magVal[i]; // update maximum values on each axis
    }

    // Scale magnetometer values
    if (magRange[2*i] != magRange[2*i+1]) {
      magVal[i] = map(magVal[i], magRange[2*i], magRange[2*i+1], -100, 100);
    }
  }

  // Update magnetometer values
  mx = magVal[0];
  my = magVal[1];
  mz = magVal[2];
}
*/
