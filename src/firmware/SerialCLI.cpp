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
    // inputCommand[i] = c;

    while (c != 2 && k <= msgLength) {
      inputCommand[i] += c;
      c = inputMessage.charAt(k++);
    }
  }
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
    controller->setSerialSettings((String *)(&inputCommand[1]), inputCommandLength - 1);
  } else if (strcmp(cmd, "pulse!") == 0) {
    if (inputCommandLength == 4) {
      int dVibOn = inputCommand[1].toInt();
      int dVibOff = inputCommand[2].toInt();
      int nVib = inputCommand[3].toInt();
      controller->vibrationPulse(dVibOn, dVibOff, nVib);
    }
  } else if (strcmp(cmd, "sensors!") == 0) { // getter
    controller->setSendSerialSensors(inputCommand[1].toInt() != 0);
  } else if (strcmp(cmd, "address?") == 0) {
    // send ip address
    controller->sendSerialIPAddress();
  }
}

