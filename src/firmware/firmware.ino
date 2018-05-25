/*
    This sketch is a Movuino firmware.
    It allows the Movuino to send data on a specific Wifi through an OSC protocol. (Open Sound Control)
*/

#include "Wire.h"

#include "Controller.h"
#include "SerialCLI.h"
#include "OSCServer.h"

Controller *controller;
SerialCLI *serialCLI;
OSCServer *oscServer;

void setup() {
  Wire.begin();
  Wire.setClock(400000); // useful ... ?
  
  Serial.begin(115200);
  
  while(!Serial) {
    delay(10);
  }

  controller = new Controller(); // controls hub for everything : harware, osc, serial, settings
  
  serialCLI = new SerialCLI(controller);
  oscServer = new OSCServer(controller);

  controller->init(serialCLI, oscServer);
  
  oscServer->startWiFi();
}

// don't add any delay here, sr already defined in controller->update()
void loop() {
  serialCLI->updateInputBuffer();
  oscServer->readInputOSCMessages();

  controller->update(); // for vibrator and eventually other real time processes
}

