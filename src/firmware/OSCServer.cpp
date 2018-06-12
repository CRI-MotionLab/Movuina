#include "OSCServer.h"
#include "Controller.h"

void
OSCServer::readInputOSCMessages() {
  OSCMessage msg;
  int packetSize = udp.parsePacket();
  if (packetSize > 0) {
    while (packetSize--) {
      msg.fill(udp.read()); // read incoming message into the bundle
    }
    if (!msg.hasError()) {
      controller->routeOSCMessage(msg);
    } else {
      controller->oscErrorCallback(msg);
    }
  }
}

bool
OSCServer::sendOSCMessage(OSCMessage &msg, const char *hostIP, unsigned int portOut) {
  if (WiFi.status() == WL_CONNECTED) {
    udp.beginPacket(hostIP, portOut); // send message to computer target with "hostIP" on "port"
    msg.send(udp);
    udp.endPacket();
    msg.empty();
    return true;
  }

  return false;
}

/*
// this uses OSC.h and OSC.cpp borrowed from the riot (minimalistic OSC library)
bool
OSCServer::sendOSCSensors(float *sensors, const char*hostIP, unsigned int portOut) {
  if (WiFi.status() == WL_CONNECTED) {
    char *pData = frame.pData;
  
    for (int i = 0; i < 9; i++) {
      FloatToBigEndian(pData, sensors + i);
      pData += sizeof(float);
    }

    udp.beginPacket(hostIP, portOut);
    udp.write((uint8_t*)frame.buf, frame.PacketSize);
    udp.endPacket();
    return true;
  }
  
  return false;
}
//*/

String
OSCServer::getMacAddress() {
  byte mac[6];
  WiFi.macAddress(mac);
  
  String res(mac[0], HEX);
  for (int i = 1; i < 6; i++) {
    res += ":";
    res += String(mac[i], HEX);
  }
  return res;
}

void
OSCServer::getIPAddress(int *res) { // must be of type int[4]
  if (getWiFiState()) {
    IPAddress ip = WiFi.localIP();
    for (int i = 0; i < 4; i++) {
      *(res + i) = ip[i];
    }
  }
}

String
OSCServer::getStringIPAddress() {
  int ip[4] = { 0, 0, 0, 0 };
  getIPAddress(&ip[0]);
  String sip = String(ip[0]);
  sip += ".";
  sip += ip[1];
  sip += ".";
  sip += ip[2];
  sip += ".";
  sip += ip[3];
  return sip;
}

//============================== WIFI CONNECTION ==============================//

bool
OSCServer::getWiFiState() {
  return WiFi.status() == WL_CONNECTED;
}

//----------------------------------- START -----------------------------------//

void
OSCServer::startWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(controller->getSSID(), controller->getPass());
  digitalWrite(pinLedBat, LOW); // turn ON battery led

  unsigned long startTimer = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startTimer < 15000) { // originally 20000 (20s)
    digitalWrite(pinLedWifi, LOW);
    delay(200);
    digitalWrite(pinLedWifi, HIGH);
    delay(200);
    // delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    // Start client port (to send messages)
    udp.begin(controller->getPortOut());
    delay(50); // this is acceptable as it rarely happens
    IPAddress myIp = WiFi.localIP();
    // Start server port (to receive messages)
    udp.begin(controller->getPortIn());
    digitalWrite(pinLedWifi, LOW); // turn ON wifi led
  } else {
    // why is this commented out ?
    // => because we didn't manage to connect
    // WiFi.disconnect();
    
    // why is this commented out ?
    // => because you can never enable WiFi again if you use this
    // WiFi.mode(WIFI_OFF);
    
    WiFi.forceSleepBegin();
    delay(1);
    digitalWrite(pinLedWifi, HIGH); // turn OFF wifi led
    digitalWrite(pinLedBat, HIGH);  // turn OFF battery led
  }

  initialized = true;
}

//--------------------------------- SHUTDOWN ----------------------------------//

void
OSCServer::shutdownWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.disconnect();
    // WiFi.mode(WIFI_OFF); // don't use !
    WiFi.forceSleepBegin();
    delay(1);
    digitalWrite(pinLedWifi, HIGH); // turn OFF wifi led
    digitalWrite(pinLedBat, HIGH);  // turn OFF battery led
  }
}

//----------------------------------- AWAKE -----------------------------------//

void
OSCServer::awakeWiFi() {
  if(!(WiFi.status() == WL_CONNECTED)) {

    if (!initialized) {
      startWiFi();
      return;
    }
    
    // Awake wifi and re-connect Movuino
    WiFi.forceSleepWake();
    // WiFi.mode(WIFI_STA); // already set
    WiFi.begin(controller->getSSID(), controller->getPass());
    digitalWrite(pinLedBat, LOW); // turn ON battery led

    //Blink wifi led while wifi is connecting
    unsigned long startTimer = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startTimer < 15000) { // originally 20000 (20s)
      digitalWrite(pinLedWifi, LOW); // turn ON wifi led
      delay(200);
      digitalWrite(pinLedWifi, HIGH); // turn OFF wifi led
      delay(200);
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      // Start client port (to send message)
      udp.begin(controller->getPortOut());
      delay(50); // ok
      IPAddress myIp = WiFi.localIP();
      // Start server port (to receive message)
      udp.begin(controller->getPortIn());
      digitalWrite(pinLedWifi, LOW); // turn ON wifi led
    } else {
      digitalWrite(pinLedWifi, HIGH); // turn OFF wifi led
    }
  }
}

void
OSCServer::toggleWiFiState() {
  if (WiFi.status() == WL_CONNECTED) {
    shutdownWiFi();
  } else {
    awakeWiFi();
  }
}

