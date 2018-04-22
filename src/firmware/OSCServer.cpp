#include "OSCServer.h"
#include "Controller.h"

void
OSCServer::readInputOSCMessages() {
  OSCMessage bundle;
  int packetSize = Udp.parsePacket();
  if (packetSize > 0) {
    while (packetSize--) {
      bundle.fill(Udp.read()); // read incoming message into the bundle
    }
    if (!bundle.hasError()) {
      char address[MAX_OSC_ADDRESS_SIZE];
      bundle.getAddress(address);
      //-------------------------
      if (strcmp(address, "/vibroPulse") == 0) {
        controller->vibrationPulseCallback(bundle);
        // controller->sendSerialString("vibro", "received pulse");
      //-------------------------------------------
      } else if (strcmp(address, "/vibroNow") == 0) {
        controller->vibrateNowCallback(bundle);
        // controller->sendSerialString("vibro", "received now");
      //---------------------------------------
      }      
    } else {
      controller->oscErrorCallback(bundle);
    }
  }
}

bool
OSCServer::sendOSCMessage(OSCMessage &msg, const char *hostIP, unsigned int portOut) {
  if (WiFi.status() == WL_CONNECTED) {
    Udp.beginPacket(hostIP, portOut); // send message to computer target with "hostIP" on "port"
    msg.send(Udp);
    Udp.endPacket();
    // msg.empty();
    return true;
  }

  return false;
}

void
OSCServer::getLocalAddress(int *res) { // must be of type int[4]
  IPAddress ip = WiFi.localIP();
  for (int i = 0; i < 4; i++) {
    *(res + i) = ip[i];
  }
}

bool
OSCServer::sendLocalAddress() {
  if (WiFi.status() == WL_CONNECTED) {
    int ip[4];
    getLocalAddress(ip);
    
    OSCMessage msg("/movuino/settings");
    for (int i = 0; i < 4; i++) {
      msg.add(ip[i]);
    }
    msg.add(controller->getPortIn());
    Udp.beginPacket(controller->getHostIP(), controller->getPortOut()); // also send identifier
    msg.send(Udp);
    Udp.endPacket();
    //msg.empty(); // is this really necessary ???
    return true;
  }

  return false;
}

/*
void sendMovuinoAddr() {
  if (WiFi.status() == WL_CONNECTED) {
    delay(50);
    // store Movuino IP address
    sprintf(movuinoIP, "%d.%d.%d.%d", WiFi.localIP()[0], WiFi.localIP()[1], WiFi.localIP()[2], WiFi.localIP()[3]);
    Serial.println(movuinoIP);

    delay(100);
    // Send Movuino address (IP & local port) to the host computer
    OSCMessage msg("/movuinoAddr"); // create an OSC message on address "/movuinOSC"
    msg.add(movuinoIP);
    msg.add(portIn);
    Udp.beginPacket(hostIP, portOut); // send message to computer target with "hostIP" on "port"
    msg.send(Udp);
    Udp.endPacket();
    msg.empty();
  }
}
//*/

//============================== WIFI CONNECTION ==============================//

//----------------------------------- START -----------------------------------//

void
OSCServer::startWiFi() {
  WiFi.mode(WIFI_STA);

  WiFi.begin(controller->getSSID(), controller->getPass());

  //Send to MAX
  Serial.write(95);
  Serial.print("connecting");
  Serial.write(95);
  //-----------

  Serial.println();
  Serial.println();
  Serial.print("Wait for WiFi... ");

  // wait while connecting to wifi ...
  long timWifi0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - timWifi0 < 20000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    //Send to MAX
    Serial.write(95);
    Serial.print("connected");
    Serial.write(95);
    //-----------

    // Movuino is now connected to Wifi
    Serial.println("");
    Serial.println("WiFi connected");
    Serial.println("IP address: ");
    Serial.println(WiFi.localIP());

    // Start client port (to send message)
    Serial.println("Starting client port");
    Udp.begin(controller->getPortOut());
    delay(50);
    IPAddress myIp = WiFi.localIP();

    // Start server port (to receive message)
    Serial.println("Starting server port");
    Udp.begin(controller->getPortIn());
    Serial.print("Server port: ");
    Serial.println(Udp.localPort());
  } else {
    //Send to MAX
    Serial.write(95);
    Serial.print("error connect");
    Serial.write(95);
    //-----------

    Serial.print("Unable to connect on ");
    Serial.print(controller->getSSID());
    Serial.println(" network.");

    // WiFi.disconnect();
    WiFi.mode(WIFI_OFF);
  }
}

//--------------------------------- SHUTDOWN ----------------------------------//

void
OSCServer::shutdownWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    WiFi.mode(WIFI_OFF);
    WiFi.forceSleepBegin();
    delay(1); // needed
    //digitalWrite(pinLedWifi, HIGH); // turn OFF wifi led
    //digitalWrite(pinLedBat, HIGH);  // turn OFF battery led
  }

  //Send to MAX
  Serial.write(95);
  Serial.print("disconnect");
  Serial.write(95);
}

//----------------------------------- AWAKE -----------------------------------//

void
OSCServer::awakeWiFi() {
  if(!(WiFi.status() == WL_CONNECTED)) {
    //Send to MAX
    Serial.write(95);
    Serial.print("connecting");
    Serial.write(95);

    // Awake wifi and re-connect Movuino
    WiFi.forceSleepWake();
    WiFi.mode(WIFI_STA);
    WiFi.begin(controller->getSSID(), controller->getSSID());
    //digitalWrite(pinLedBat, LOW); // turn ON battery led

    //Blink wifi led while wifi is connecting
    long timWifi0 = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - timWifi0 < 20000) {
    //while (WiFiMulti.run() != WL_CONNECTED && millis() - timWifi0 < 10000) {
      Serial.print(":");
      //digitalWrite(pinLedWifi, LOW);
      delay(200);
      //digitalWrite(pinLedWifi, HIGH);
      delay(200);
    }
    
    //digitalWrite(pinLedWifi, LOW); // turn ON wifi led

    if (WiFi.status() == WL_CONNECTED) {
      //Send to MAX
      Serial.write(95);
      Serial.print("connected");
      Serial.write(95);

      // Movuino is now connected to Wifi
      Serial.println("");
      Serial.println("WiFi connected");
      Serial.println("IP address: ");
      Serial.println(WiFi.localIP());

      // Start client port (to send message)
      Serial.println("Starting client port");
      Udp.begin(controller->getPortOut());
      delay(50);
      IPAddress myIp = WiFi.localIP();

      // Start server port (to receive message)
      Serial.println("Starting server port");
      Udp.begin(controller->getPortIn());
      Serial.print("Server port: ");
      Serial.println(Udp.localPort());
    } else {
      //Send to MAX
      Serial.write(95);
      Serial.print("erroconnect");
      Serial.write(95);
      //-----------

      Serial.print("Unable to connect on ");
      Serial.print(controller->getSSID());
      Serial.println(" network.");
    }
  }
}

