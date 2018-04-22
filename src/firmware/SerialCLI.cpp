#include "SerialCLI.h"
#include "Controller.h"

void
SerialCLI::updateInputBuffer() {
  if (Serial.available() > 0) {
    while (Serial.available() > 0) {
      inByte = Serial.read();

      // strip first "start text" (STX) and last "end text" (ETX) characters,
      // keep inner STX characters, update inputSerialMessage and inputCommandLength.
      
      if (inByte == 2 && !receivingCommand) {
        inputCommandLength = 0;
        inputMessage = "";
        receivingCommand = true;
        //-----------------------------------------
      } else if (inByte == 3 && receivingCommand) {
        inputCommandLength++;
        receivingCommand = false;
        processInputMessage();
        routeInputMessage();
        //--------------------------
      } else if (receivingCommand) {
        inputMessage += (char) inByte;
        if (inByte == 2) {
          inputCommandLength++;
        }
      }
    }
  }
}

void
SerialCLI::sendCommand(String &cmd) {
  Serial.write(2);
  Serial.write(cmd.c_str());
  Serial.write(3);
}

void
SerialCLI::sendMessage(String &cmd, String &msg) {
  Serial.write(2);
  Serial.write(cmd.c_str());
  Serial.write(2);
  Serial.write(msg.c_str());
  Serial.write(3);
}

void
SerialCLI::sendData(char **data, int n) {
  for (int i = 0; i < n; ++i) {
    Serial.write(2);
    Serial.write(data[i]);
  }

  Serial.write(3);
}

//================================================ private:

// parse the command into an array of Strings
void
SerialCLI::processInputMessage() {
  // split the message
  int msgLength = inputMessage.length();
  int k = 0;
  
  for (int i = 0; i < inputCommandLength; ++i) {
    inputCommand[i] = "";
    char c = inputMessage.charAt(k++);

    while ((int) c != 2 && k < msgLength) {
      inputCommand[i] += c;
      c = inputMessage.charAt(k++);
    }
  }

  const char *res[inputCommandLength];
  for (int i = 0; i < inputCommandLength; i++) {
    res[i] = inputCommand[inputCommandLength].c_str();
  }
  sendData((char **)res, inputCommandLength);

  String msg(msgLength);
  sendCommand(msg);
}

void
SerialCLI::routeInputMessage() {
  const char *cmd = inputCommand[0].c_str();
  
  if (strcmp(cmd, "?") == 0) { // who are you
    String response("movuino");
    sendCommand(response);
    //--------------------------------------
  } else if (strcmp(cmd, "settings?") == 0) { // getter
    controller->sendSerialSettings();
  } else if (strcmp(cmd, "settings!") == 0) { // setter
    // if (inputCommandLength == 7) { // ssid, pass, hostip, portin, portout, id
      controller->setSerialSettings((String *)(&inputCommand[1]), inputCommandLength - 1);
    // }
  } else if (strcmp(cmd, "pulse!") == 0) {
    if (inputCommandLength == 4) {
      int dVibOn = inputCommand[1].toInt();
      int dVibOff = inputCommand[2].toInt();
      int nVib = inputCommand[3].toInt();
      controller->vibrationPulse(dVibOn, dVibOff, nVib);
    }
  }
}

/*
void updateValues() {
  delay(5);
  switch (msgAdr) {
    case 'c':
      //Send to MAX
      Serial.write(95);
      Serial.print("usbconnect");
      Serial.write(95);
      //-----------
      break;
    case 'w':
      if(msgVal=="offwifi"){
        //shutDownWifi();
      }
      if(msgVal=="onwifi"){
        //awakeWifi();
      }
      if(msgVal=="getmovuinoIP"){
        //sendMovuinoAddr();
      }
      break;
    case 's':
      msgVal.toCharArray(ssid, bufIndex);
      break;
    case 'p':
      msgVal.toCharArray(pass, bufIndex);
      break;
    case 'i':
      msgVal.toCharArray(hostIP, bufIndex);
      break;
    case 'v':
      // currently just to test the vibrator without wifi
      if(msgVal=="now"){
        vibroNow(true);
      }
      if(msgVal=="off"){
        vibroNow(false);
      }
      if(msgVal=="pulse"){
        setVibroPulse(500,200,5);
      }
      break;
    case 'r':
      // Serial.write(95);
      Serial.print(ssid);
      // Serial.write(95);
      break;
    default:
      Serial.print("No matching address");
      break;
  }
}
//*/

