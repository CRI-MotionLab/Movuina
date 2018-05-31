#ifndef _CONTROLLER_H_
#define _CONTROLLER_H_

#include "I2Cdev.h"
#include "MPU6050.h"

#include "Settings.h"
#include "SerialCLI.h"
#include "OSCServer.h"

const int pinBtn = 13;     // the number of the pushbutton pin
const int pinLedWifi = 2;  // wifi led indicator
const int pinLedBat = 0;   // battery led indicator
const int pinVibro = 14;   // vibrator pin

enum oscAddress {
  oscAddrSensors = 0,
  oscAddrSettings,
  oscAddrHeartBeat,
  oscAddrVibroPulse,
  oscAddrVibroNow
};

class Controller : public Settings {
private:
  MPU6050 accelGyro;
  int packetNumber;
  int16_t ax, ay, az; // store accelerometre values
  int16_t gx, gy, gz; // store gyroscope values
  int16_t mx, my, mz; // store magneto values
  float sensors[9];
  int magRange[6];// = {666, -666, 666, -666, 666, -666}; // magneto range values for calibration
  uint8_t magBuffer[14];

  bool forceVibrating;
  bool isVibrating;
  unsigned long dVibOn, dVibOff, dVibTotal;
  float rVib;
  unsigned long vibTimer;
  unsigned int nVib;

  bool btnOn;
  bool lockPress;
  unsigned long btnPressTimeThresh; // pressure time needed to switch Movuino state
  unsigned long lastBtnDate;

  SerialCLI *serialCLI;
  OSCServer *oscServer;
  bool initialized;

  unsigned int framePeriod;

  unsigned long heartBeatPeriod; // ms period for executing various tasks at a lower rate
  unsigned long lastHeartBeatDate;

  int readMagState;
  unsigned long readMagPeriod;
  unsigned long lastReadMagDate;

public:
  char oscAddresses[MAX_OSC_ADDRESSES][MAX_OSC_ADDRESS_SIZE];

public:
  Controller() :
  //------------
  packetNumber(0),
  ax(0), ay(0), az(0),
  gx(0), gy(0), gz(0),
  mx(0), my(0), mz(0),
  sensors({ 0, 0, 0, 0, 0, 0, 0, 0, 0 }),
  magRange({ 666, -666, 666, -666, 666, -666 }),
  //------------
  forceVibrating(false),
  isVibrating(false),
  dVibOn(1000),
  dVibOff(1000),
  dVibTotal(2000),
  rVib(0.5),
  vibTimer(0),
  nVib(3),
  //------
  btnOn(false),
  btnPressTimeThresh(500),
  lastBtnDate(0),
  lockPress(false),
  initialized(false),
  framePeriod(10), // ms
  heartBeatPeriod(1000), // ms
  lastHeartBeatDate(millis()),
  readMagState(0),
  readMagPeriod(10), // ms
  lastReadMagDate(millis()) {
    pinMode(pinBtn, INPUT_PULLUP); // pin for the button
    pinMode(pinLedWifi, OUTPUT); // pin for the wifi led
    pinMode(pinLedBat, OUTPUT); // pin for the battery led
    pinMode(pinVibro, OUTPUT); // pin for the vibrator
  }

  ~Controller() {}

  void init(SerialCLI *s, OSCServer *o);
  void update();
  void setWiFi(bool on);

  // void enableSendingOSCSensors(bool b);
  // void enableSendingSerialSensors(bool b);
  // void enableReadingMagnetometer(bool b);

  //---------------------------------- OSC -------------------------------------//

  bool routeOSCMessage(OSCMessage &msg);
  bool sendOSCMessage(OSCMessage &msg);
  bool oscErrorCallback(OSCMessage &msg);
  bool sendOSCSettings();
  bool sendOSCHeartBeat();
  bool sendOSCSensors();

  //--------------------------------- SERIAL -----------------------------------//

  bool sendSerialCommand(String &msg);
  bool sendSerialMessage(String &target, String &msg);  
  bool sendSerialSettings();
  bool sendSerialHeartBeat();
  bool sendSerialMacAddress();
  bool sendSerialIPAddress();
  bool sendSerialSensors();

  // auto restarts WiFi if any value in [ ssid, pass, portIn, portOut ] changed and WiFi enabled
  bool setSerialSettings(String *parameters, int n);

  //--------------------------------- VIBRATOR ---------------------------------//

  void vibrationPulseCallback(OSCMessage &msg);
  void vibrationPulse(int onDuration, int offDuration, int nb);
  void vibrateNowCallback(OSCMessage &msg);
  void vibrateNow(bool vibOnOff);

//=================================== PRIVATE ==================================//

private:
  void readAccelGyroValues();
  void readMagnetometerValues();
  void sendFrame();

  void updateVibrator();
  void updateButton();  
  void updateOSCAddresses();

  void magnetometerAutoCalibration();
  float splitFloatDecimal(float f);
};

#endif /* _CONTROLLER_H_ */

