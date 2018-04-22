#ifndef _CONTROLLER_H_
#define _CONTROLLER_H_

#include "I2Cdev.h"
#include "MPU6050.h"

#include <OSCMessage.h>
#include "Settings.h"
#include "SerialCLI.h"
#include "OSCServer.h"

const int pinBtn = 13;     // the number of the pushbutton pin
const int pinLedWifi = 2;  // wifi led indicator
const int pinLedBat = 0;   // battery led indicator
const int pinVibro = 14;   // vibrator pin

class Controller : public Settings {
private:
  MPU6050 accelGyro;
  int packetNumber;// = 0;
  int16_t ax, ay, az; // store accelerometre values
  int16_t gx, gy, gz; // store gyroscope values
  int16_t mx, my, mz; // store magneto values
  int magRange[6];// = {666, -666, 666, -666, 666, -666}; // magneto range values for calibration

  boolean isVibrating;
  int dVibOn, dVibOff, dVibTotal;
  float rVib;
  long vibTimer;
  int nVib;

  bool btnOn;
  float btnPressTimeThresh; // pressure time needed to switch Movuino state
  float lastBtnDate;
  bool lockPress;

  SerialCLI *serialCLI;
  OSCServer *oscServer;
  bool initialized;

public:
  Controller() :
  //------------
  packetNumber(0),
  magRange({ 666, -666, 666, -666, 666, -666 }),
  //------------
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
  initialized(false) {
    pinMode(pinBtn, INPUT_PULLUP); // pin for the button
    pinMode(pinLedWifi, OUTPUT);   // pin for the wifi led
    pinMode(pinLedBat, OUTPUT);    // pin for the battery led
    pinMode(pinVibro, OUTPUT);    // pin for the vibrator
  }

  ~Controller() {}

  void init(SerialCLI *s, OSCServer *o);
  void update();

  bool sendOSCMessage(OSCMessage &msg);
  bool oscErrorCallback(OSCMessage &msg);
  bool sendOSCSettings();
  bool sendOSCSensors();

  bool sendSerialCommand(String &msg);
  bool sendSerialMessage(String &target, String &msg);
  bool setSerialSettings(String *parameters, int n);
  
  bool sendSerialSettings();
  bool sendSerialSensors();

  // HARDWARE CONTROL
  void vibrationPulseCallback(OSCMessage &msg);
  void vibrationPulse(int onDuration, int offDuration, int nb);
  void vibrateNowCallback(OSCMessage &msg);
  void vibrateNow(bool vibOnOff);

//=================================== PRIVATE ==================================//

private:
  void updateSensors();
  void updateVibrator();
  void updateButton();
  
  void sendFrame();

  float splitFloatDecimal(float f);
  void magnetometerAutoCalibration();
};

#endif /* _CONTROLLER_H_ */

