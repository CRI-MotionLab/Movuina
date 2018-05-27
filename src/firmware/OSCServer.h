#ifndef _OSC_SERVER_H_
#define _OSC_SERVER_H_

#define MAX_OSC_ADDRESS_SIZE 120
#define MAX_OSC_ADDRESSES 100

// WiFi includes
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

// OSC includes
#include <OSCMessage.h>

#include <Arduino.h>
class Controller;

class OSCServer {
private:
  bool initialized;
  WiFiUDP udp;
  Controller *controller;

public:
  OSCServer(Controller *c) :
  initialized(false), controller(c) {
  }

  ~OSCServer() {}

  void readInputOSCMessages();
  bool sendOSCMessage(OSCMessage &msg, const char *hostIP, unsigned int portOut);
  String getMacAddress();
  void getIPAddress(int *res); // res must be of type int[4]
  String getStringIPAddress();

  bool getWiFiState();
  void startWiFi();
  void shutdownWiFi();
  void awakeWiFi();
  void toggleWiFiState();
};

#endif /* _OSC_SERVER_H_ */
