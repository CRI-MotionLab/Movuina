#include "Controller.h"

void
Controller::init(SerialCLI *s, OSCServer *o) {
  serialCLI = s;
  oscServer = o;
  
  String cmd("info");
  String msg("Initializing I2C devices ...");
  serialCLI->sendMessage(cmd, msg);
  
  accelGyro.initialize();
  // accelGyro.setRate(0);
  // accelGyro.setI2CMasterModeEnabled(false);
  // accelGyro.setI2CBypassEnabled(true);
  // accelGyro.setSleepEnabled(false);
  
  loadCredentials();
  updateOSCAddresses();
    
  initialized = true;
}

void
Controller::update() {
  unsigned long now = millis();
  
  if (now >= lastHeartBeatDate + heartBeatPeriod) {
    lastHeartBeatDate = now;

    // call whatever periodic process you like

    if (getSendOSCHeartBeat()) {
      sendOSCHeartBeat();
    }

    if (getSendSerialHeartBeat()) {
      sendSerialHeartBeat();
    }
  }

  if (now >= lastReadMagDate + readMagPeriod) {
    lastReadMagDate = now;
    readMagnetometerValues();
  }
  
  readAccelGyroValues();
  sendFrame();
  updateVibrator();
  updateButton();

  // THIS IS THE ONLY AUTHORIZED DELAY IN THE MAIN LOOP !
  delay(framePeriod);
}

void
Controller::setWiFi(bool on) {
  if (on) {
    oscServer->awakeWiFi();
  } else {
    oscServer->shutdownWiFi();
  }
}

//============================= OSC ===============================//

bool
Controller::routeOSCMessage(OSCMessage &msg) {
  if (initialized) {
    char address[MAX_OSC_ADDRESS_SIZE];
    msg.getAddress(address);
  
    //-------------------------
    if (strcmp(address, oscAddresses[oscAddrVibroPulse]) == 0) {
      vibrationPulseCallback(msg);
      // sendSerialMessage("vibro", "received pulse");
    //-------------------------------------------
    } else if (strcmp(address, oscAddresses[oscAddrVibroNow]) == 0) {
      vibrateNowCallback(msg);
      // sendSerialMessage("vibro", "received now");
    //---------------------------------------
    }      
  }

  return initialized;
}

//*
bool
Controller::sendOSCMessage(OSCMessage &msg) {
  if (initialized) {
    return oscServer->sendOSCMessage(msg, getHostIP(), getPortOut());
  }

  return false;
}

bool
Controller::oscErrorCallback(OSCMessage &msg) {
  OSCErrorCode error = msg.getError();
  String cmdStr("error");
  String errorStr(error);
  return sendSerialMessage(cmdStr, errorStr);
}

bool
Controller::sendOSCSettings() {
  if (initialized) {
    /*
    String address("/");
    address += getID();
    address += "/settings";
    OSCMessage msg(address.c_str()); // create an OSC message on address "/<id>/settings"
    */
    OSCMessage msg(oscAddresses[oscAddrSettings]);
    msg.add(getID());
    msg.add(getSSID());
    msg.add(getPass());
    msg.add(getHostIP());
    msg.add(getPortIn());
    msg.add(getPortOut());
    return sendOSCMessage(msg);
  }

  return false;
}

bool
Controller::sendOSCSensors() {
  // if (initialized /* && !digitalRead(pinVibro) */) {
  if (initialized && !digitalRead(pinVibro)) {
    /*
    String address("/");
    address += getID();
    address += "/sensors";
    OSCMessage msg(address.c_str()); // create an OSC message on address "/<id>/sensors"
    */
    OSCMessage msg(oscAddresses[oscAddrSensors]);
    for (int i = 0; i < 9; i++) {
      msg.add(sensors[i]);
    }
    return sendOSCMessage(msg);
  }

  return false;
}

bool
Controller::sendOSCHeartBeat() {
  if (initialized) {
    OSCMessage msg(oscAddresses[oscAddrHeartBeat]);
    msg.add(oscServer->getWiFiState() ? "1" : "0");
    msg.add(oscServer->getStringIPAddress().c_str());
    return sendOSCMessage(msg);
  }

  return false;
}

//============================ SERIAL =============================//

bool
Controller::sendSerialCommand(String &msg) {
  if (initialized) {
    serialCLI->sendCommand(msg);
  }

  return false;
}

bool
Controller::sendSerialMessage(String &target, String &msg) {
  if (initialized) {
    serialCLI->sendMessage(target, msg);
  }

  return false;
}

bool
Controller::sendSerialSettings() {
  if (initialized) {
    char pIn[MAX_STRING_SIZE];
    char pOut[MAX_STRING_SIZE];
    itoa(getPortIn(), pIn, 10);
    itoa(getPortOut(), pOut, 10);
    
    const char *settings[] = {
      "settings",
      getID(), getSSID(), getPass(), getHostIP(), pIn, pOut,
      getSendOSCSensors() ? "1" : "0",
      getSendSerialSensors() ? "1" : "0",
    };

    serialCLI->sendData((char **)settings, 9);
  }

  return initialized;
}

bool
Controller::sendSerialMacAddress() {
  if (initialized) {
    String mac = oscServer->getMacAddress();
    String address("mac");
    serialCLI->sendMessage(address, mac);
  }

  return initialized;
}

bool
Controller::sendSerialIPAddress() {
  if (initialized) {
    int ip[4];
    oscServer->getIPAddress(&ip[0]);
    String sip = String(ip[0]) + "." + ip[1] + "." + ip[2] + "." + ip[3];
    String address("ip");
    serialCLI->sendMessage(address, sip);
  }

  return initialized;
}

bool
Controller::sendSerialSensors() {
  if (initialized) {
    String sax(sensors[0]);
    String say(sensors[1]);
    String saz(sensors[2]);
    
    String sgx(sensors[3]);
    String sgy(sensors[4]);
    String sgz(sensors[5]);

    String smx(sensors[6]);
    String smy(sensors[7]);
    String smz(sensors[8]);

    const char *sensors[] = {
      "sensors",
      sax.c_str(), say.c_str(), saz.c_str(),
      sgx.c_str(), sgy.c_str(), sgz.c_str(),
      smx.c_str(), smy.c_str(), smz.c_str()
    };

    serialCLI->sendData((char **)sensors, 10);
  }

  return initialized;
}

bool
Controller::sendSerialHeartBeat() {
  if (initialized) {
    int ip[4];
    oscServer->getIPAddress(&ip[0]);
    String sip = String(ip[0]) + "." + ip[1] + "." + ip[2] + "." + ip[3];
    
    const char *heartbeat[] = {
      "heartbeat",
      oscServer->getWiFiState() ? "1" : "0",
      sip.c_str()
    };

    // send "heartbeat <wifi_connected> <movuino_ip_address>" every second
    serialCLI->sendData((char **)heartbeat, 3);
  }

  return initialized;
}

bool
Controller::setSerialSettings(String *parameters, int nbArguments) {
  if (initialized) {
    bool autoResetWiFi = false;

    setID((*parameters++).c_str());

    const char *newSSID = (*parameters++).c_str();
    const char *newPass = (*parameters++).c_str();
    
    setHostIP((*parameters++).c_str());

    unsigned int newPortIn = atoi((*parameters++).c_str());
    unsigned int newPortOut = atoi((*parameters++).c_str());
    
    setSendOSCSensors((*parameters++).c_str()[0] == '1');
    setSendSerialSensors((*parameters++).c_str()[0] == '1');

    if (strcmp(newSSID, getSSID()) != 0 ||
        strcmp(newPass, getPass()) != 0 ||
        newPortIn != getPortIn() || newPortOut != getPortOut()) {
      autoResetWiFi = true;
    }
    
    setSSID(newSSID);
    setPass(newPass);
    setPortIn(newPortIn);
    setPortOut(newPortOut);
    
    storeCredentials();
    updateOSCAddresses();
    
    if (autoResetWiFi && WiFi.status() != WL_CONNECTED) {
      // oscServer->startWiFi();
      oscServer->shutdownWiFi();
      oscServer->awakeWiFi();
    }
  }

  return initialized;
}

//=========================== VIBRATOR ============================//

void
Controller::vibrationPulseCallback(OSCMessage &msg) {
  vibrationPulse(msg.getInt(0), msg.getInt(1), msg.getInt(2));
}

void
Controller::vibrationPulse(int onDuration, int offDuration, int nb) {
  dVibOn = onDuration;
  dVibOff = offDuration;
  nVib = nb;

  if (dVibOn == 0) {
    isVibrating = false; // shut down vibrator if no vibration
    digitalWrite(pinVibro, LOW);
  } else {
    dVibTotal = dVibOn + dVibOff;
    rVib = dVibOn / (float) dVibTotal;
    vibTimer = millis();
    isVibrating = true;
  }
}

void
Controller::vibrateNowCallback(OSCMessage &msg) {
  vibrateNow(msg.getInt(0) != 0);
}

void
Controller::vibrateNow(bool vibOnOff) {
  if (vibOnOff) {
    forceVibrating = true;
    digitalWrite(pinVibro, HIGH);
  } else {
    // isVibrating = false;
    forceVibrating = false;
    digitalWrite(pinVibro, LOW);
  }
}

//=================================== PRIVATE ==================================//

void
Controller::sendFrame() {
  if (getSendOSCSensors()) {
    sendOSCSensors();
  }

  if (getSendSerialSensors()) {
    sendSerialSensors();
  }
}

void
Controller::readAccelGyroValues() {
  accelGyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz);

  // this is equivalent to getMotion6 :
  //accelGyro.getAcceleration(&ax, &ay, &az);
  //accelGyro.getRotation(&gx, &gy, &gz);

  // NB : don't use getMotion9 as its execution lasts 20ms
  // minimum because of delays and limits the global execution rate.
  // readMagnetometerValues() replaces that and is called
  // in a non-blocking loop

  sensors[0] = ax / float(32768);
  sensors[1] = ay / float(32768);
  sensors[2] = az / float(32768);

  sensors[3] = gx / float(32768);
  sensors[4] = gy / float(32768);
  sensors[5] = gz / float(32768);
}

/** 
 * adapted to be non blocking using a state flag
 * from original sparkun / Jeff Rowberg MPU6050 library:
 * MPU6050::getMag(int16_t *mx, int16_t *my, int16_t *mz)
 * there used to be delay(10)'s between calls to writeBytes and readBytes,
 * this function is now called in a non-blocking loop (heartBeat = 10 ms)
 * and keeps its own state up to date.
 */
void
Controller::readMagnetometerValues() {
  if (readMagState == 0) {
    // set i2c bypass enable pin to true to access magnetometer
    I2Cdev::writeByte(MPU6050_DEFAULT_ADDRESS, MPU6050_RA_INT_PIN_CFG, 0x02);
    readMagState = 1;
  } else if (readMagState == 1) {
    // enable the magnetometer
    I2Cdev::writeByte(MPU9150_RA_MAG_ADDRESS, 0x0A, 0x01);  
    readMagState = 2;
  } else {
    // read it !
    I2Cdev::readBytes(MPU9150_RA_MAG_ADDRESS, MPU9150_RA_MAG_XOUT_L, 6, magBuffer);
    mx = (((int16_t)magBuffer[1]) << 8) | magBuffer[0];
    my = (((int16_t)magBuffer[3]) << 8) | magBuffer[2];
    mz = (((int16_t)magBuffer[5]) << 8) | magBuffer[4];

    sensors[6] = mx / float(100);
    sensors[7] = my / float(100);
    sensors[8] = mz / float(100);

    readMagState = 0;
    readMagnetometerValues(); // reset i2c bypass enable pin as soon as we are done
  }
}

void
Controller::updateVibrator() {
  if (forceVibrating) {
    digitalWrite(pinVibro, HIGH);    
  } else {
    int curTimeRatio100 = (int) (100 * (millis() - vibTimer) / (float) dVibTotal) ;
  
    if (curTimeRatio100 % 100 <  (int)(100 * rVib)) {
      digitalWrite(pinVibro, HIGH);
    } else {
      if (dVibOff != 0) {
        digitalWrite(pinVibro, LOW);
      }
    }
  
    // Shut down vibrator if number of cycles reach (set nVib to -1 for infinite cycles)
    if (nVib != -1 && (millis() - vibTimer > nVib * dVibTotal)) {
      digitalWrite(pinVibro, LOW);
      isVibrating = false;
    }
  }
}

void
Controller::updateButton() {
  bool btn = digitalRead(pinBtn) > 0;
  unsigned long now = millis();

  if (btn && !btnOn) {
    btnOn = true;
    lastBtnDate = now;
    // do whatever on buttonPress
  } else if (!btn && btnOn) {
    btnOn = false;
    // do whatever on buttonRelease

    if (now - lastBtnDate > btnPressTimeThresh) {
      // do whatever on buttonRelease after time threshold
    } else {
      // do whatever on buttonRelease before time threshold
    }
  } else if (btnOn && now - lastBtnDate > btnPressTimeThresh) {
    // do whatever on buttonHold until time threshold
  }

  
  btnOn = digitalRead(pinBtn); // check if button is pressed

  if (btnOn) {
    lastBtnDate = millis();
    lockPress = false;
  } else {
    // Send Movuino IP, port and id to OSC listeners

    /*
    if(WiFi.status() == WL_CONNECTED){
      // sendMovuinoAddr();
    }
    //*/

    digitalWrite(pinVibro, LOW); // turn off vibrator

    if (millis() - lastBtnDate > btnPressTimeThresh && !lockPress) {
      lockPress = true; // avoid several activation with same pressure
      //isWifi = !isWifi; // switch state
      lastBtnDate = millis();

      // TOGGLE WIFI

      // oscServer->toggleWiFiState();
      /*
      if (WiFi.status() == WL_CONNECTED) {
        //oscServer->shutDownWifi();
      } else {
        //oscServer->awakeWifi();
      }
      //*/
    }
  }
}

void
Controller::updateOSCAddresses() {
  // outgoing messages:
  sprintf(oscAddresses[oscAddrSensors], "/%s/sensors\0", getID());
  sprintf(oscAddresses[oscAddrSettings], "/%s/settings\0", getID());
  sprintf(oscAddresses[oscAddrHeartBeat], "/%s/heartbeat\0", getID());

  // incoming messages:
  sprintf(oscAddresses[oscAddrVibroPulse], "/%s/vibroPulse\0", getID());
  sprintf(oscAddresses[oscAddrVibroNow], "/%s/vibroNow\0", getID());  
}

void
Controller::magnetometerAutoCalibration() {
  int magVal[] = { mx, my, mz };

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

/**
 * not used anymore ???
 */
float
Controller::splitFloatDecimal(float f){
  int i = f * 1000;
  return i / 1000.0f;
}

