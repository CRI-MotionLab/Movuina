#ifndef _SERIAL_CLI_H_
#define _SERIAL_CLI_H_

#define MAX_SERIAL_MESSAGE_SIZE 100
#define MAX_SERIAL_COMMAND_LENGTH 20

#include <Arduino.h>
class Controller;

class SerialCLI {
private:
  // Serial variables
  int inByte;  // incoming serial byte
  String inputMessage;
  String inputCommand[MAX_SERIAL_COMMAND_LENGTH];
  int inputCommandLength;
  bool receivingCommand;
  Controller *controller;

public:
  SerialCLI(Controller *c) :
  controller(c),
  inByte(0),
  inputMessage(""),
  inputCommandLength(0),
  receivingCommand(false) {
  }

  ~SerialCLI() {}

  void updateInputBuffer();
  void sendCommand(String &msg);
  void sendMessage(String &target, String &msg);
  void sendData(char **data, int n);

private:
  // parse the command into an array of Strings
  void processInputMessage();
  void routeInputMessage();
};

#endif /* _SERIAL_CLI_H_ */
