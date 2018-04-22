#include "Controller.h"

void
Controller::init(SerialCLI *s, OSCServer *o) {
  serialCLI = s;
  oscServer = o;
  
  String cmd("info");
  String msg("Initializing I2C devices ...");
  serialCLI->sendMessage(cmd, msg);
  
  accelGyro.initialize();
  loadCredentials();

  initialized = true;
}

void
Controller::update() {
  updateSensors();
  updateVibrator();
  updateButton();
  sendFrame();
}

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
    String address("/");
    address += getID();
    address += "/settings";
    OSCMessage msg(address.c_str()); // create an OSC message on address "/<id>/settings"
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
  if (initialized && !digitalRead(pinVibro)) {
    String address("/");
    address += getID();
    address += "/sensors";
    OSCMessage msg(address.c_str()); // create an OSC message on address "/<id>/sensors"
    msg.add(splitFloatDecimal(-ax / 32768.0));   // add acceleration X data as message
    msg.add(splitFloatDecimal(-ay / 32768.0));   // add acceleration Y data
    msg.add(splitFloatDecimal(-az / 32768.0));   // add ...
    msg.add(splitFloatDecimal(gx / 32768.0));
    msg.add(splitFloatDecimal(gy / 32768.0));
    msg.add(splitFloatDecimal(gz / 32768.0));    // you can add as many data as you want
    msg.add(splitFloatDecimal(my / 100.0));
    msg.add(splitFloatDecimal(mx / 100.0));
    msg.add(splitFloatDecimal(-mz / 100.0));
    return sendOSCMessage(msg);
  }

  return false;
}


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
Controller::setSerialSettings(String *parameters, int nbArguments) {
  if (initialized) {
    sendSerialSettings();

    setID((*parameters++).c_str());
    setSSID((*parameters++).c_str());
    setPass((*parameters++).c_str());
    setHostIP((*parameters++).c_str());
    setPortIn(atoi((*parameters++).c_str()));
    setPortOut(atoi((*parameters++).c_str()));
    
    storeCredentials();
  }

  return initialized;
}

bool
Controller::sendSerialSettings() {
  if (initialized) {
    char pIn[MAX_STRING_SIZE];
    char pOut[MAX_STRING_SIZE];
    itoa(getPortIn(), pIn, 10);
    itoa(getPortOut(), pOut, 10);
    
    const char *settings[7];
    settings[0] = "settings";
    settings[1] = getID();
    settings[2] = getSSID();
    settings[3] = getPass();
    settings[4] = getHostIP();
    settings[5] = pIn;
    settings[6] = pOut;

    serialCLI->sendData((char **)settings, 7);
  }

  return initialized;
}

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
  vibrateNow((bool) msg.getInt(0));
}

void
Controller::vibrateNow(bool vibOnOff) {
  if (vibOnOff) {
    digitalWrite(pinVibro, HIGH);
  } else {
    digitalWrite(pinVibro, LOW);
    isVibrating = false;
  }
}

//=================================== PRIVATE ==================================//

void
Controller::sendFrame() {
  
}

void
Controller::updateSensors() {
  // GET MOVUINO DATA
  accelGyro.getMotion9(&ax, &ay, &az, &gx, &gy, &gz, &mx, &my, &mz); // Get all 9 axis data (acc + gyro + magneto)
  //---- OR -----//
  //accelgyro.getMotion6(&ax, &ay, &az, &gx, &gy, &gz); // Get only axis from acc & gyr

  magnetometerAutoCalibration();
}

void
Controller::updateVibrator() {
  int curTimeRatio100 = (int) (100 * (millis() - vibTimer) / (float) dVibTotal) ;

  if (curTimeRatio100 % 100 <  (int)(100 * rVib)) {
    digitalWrite(pinVibro, HIGH);
  } else {
    if (dVibOff != 0) {
      digitalWrite(pinVibro, LOW);
    }
  }

  // Shut down vibrator if number of cycles reach (if nV_ = -1 get infinite cycles)
  if (nVib != -1 && (millis() - vibTimer > nVib * dVibTotal)) {
    digitalWrite(pinVibro, LOW);
    isVibrating = false;
  }
}

void
Controller::updateButton() {
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

      // oscServer.toggleWiFiState();
      /*
      if (WiFi.status() == WL_CONNECTED) {
        //shutDownWifi();
      } else {
        //awakeWifi();
      }
      //*/
    }
  }
}

float
Controller::splitFloatDecimal(float f){
  int i = f * 1000;
  return i / 1000.0f;
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
