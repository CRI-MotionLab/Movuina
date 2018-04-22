#ifndef _OSC_SERVER_H_
#define _OSC_SERVER_H_

#define MAX_OSC_ADDRESS_SIZE 120

// WiFi includes
#include <ESP8266WiFi.h>
#include <ESP8266WiFiMulti.h>
#include <WiFiUdp.h>

// OSC includes
#include <OSCBundle.h>
#include <OSCMessage.h>
#include <OSCTiming.h>

#include <Arduino.h>
class Controller;

class OSCServer {
private:
  WiFiUDP Udp;
  Controller *controller;
  
public:
  OSCServer(Controller *c) :
  controller(c) {
  }

  ~OSCServer() {}

  void readInputOSCMessages();
  bool sendOSCMessage(OSCMessage &msg, const char *hostIP, unsigned int portOut);
  void getLocalAddress(int *res); // res must be of type int[4]
  bool sendLocalAddress();

  void startWiFi();
  void shutdownWiFi();
  void awakeWiFi();
};

#endif /* _OSC_SERVER_H_ */
