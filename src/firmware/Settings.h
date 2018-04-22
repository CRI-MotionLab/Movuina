#ifndef _SETTINGS_H_
#define _SETTINGS_H_

#include <EEPROM.h>

#define MAX_STRING_SIZE 32

// This class stores Movuino settings and is able
// to read/write them from/to the EEPROM

// EEPROM read / write on ESP8266 :
// https://arduino.stackexchange.com/questions/33501/eeprom-put-and-get-not-working-on-esp8266-nodemcu
// => https://github.com/esp8266/Arduino/tree/master/libraries/EEPROM/examples

class Settings {
private:
  char init[MAX_STRING_SIZE];
  char id[MAX_STRING_SIZE];
  char ssid[MAX_STRING_SIZE];
  char pass[MAX_STRING_SIZE];
  char hostIP[MAX_STRING_SIZE];

  unsigned int portIn;
  unsigned int portOut;

public:
  Settings() {
    strcpy(init, "uninitialized");
    strcpy(id, "1");
    strcpy(ssid, "my_network_ssid");
    strcpy(pass, "my_network_pass");
    strcpy(hostIP, "192.168.0.0");
    portIn = 8000;
    portOut = 8001;
    EEPROM.begin(512);
  }

  ~Settings() {
  }

  const char *getID() { return id; }
  const char *getSSID() { return ssid; }
  const char *getPass() { return pass; }
  const char *getHostIP() { return hostIP; }
  unsigned int getPortIn() { return portIn; }
  unsigned int getPortOut() { return portOut; }

  void setID(const char *i) { strcpy(id, i); }
  void setSSID(const char *s) { strcpy(ssid, s); }
  void setPass(const char *p) { strcpy(pass, p); }
  void setHostIP(const char *ip) { strcpy(hostIP, ip); }
  void setPortIn(unsigned int p) { portIn = p; }
  void setPortOut(unsigned int p) { portOut = p; }

  //======================== CREDENTIALS MANAGEMENT ==========================//

  bool loadCredentials() {
    int address = 0;

    readCharArray(&address, init, MAX_STRING_SIZE);

    if (strcmp(init, "initialized") == 0) {
      readCharArray(&address, id, MAX_STRING_SIZE);
      readCharArray(&address, ssid, MAX_STRING_SIZE);
      readCharArray(&address, pass, MAX_STRING_SIZE);
      readCharArray(&address, hostIP, MAX_STRING_SIZE);

      portIn = readUnsignedInt(&address);
      portOut = readUnsignedInt(&address);

      return true;
    }

    return false;
  }

  void storeCredentials() {
    int address = 0;

    writeCharArray(&address, "initialized", MAX_STRING_SIZE);
    writeCharArray(&address, id, MAX_STRING_SIZE);
    writeCharArray(&address, ssid, MAX_STRING_SIZE);
    writeCharArray(&address, pass, MAX_STRING_SIZE);
    writeCharArray(&address, hostIP, MAX_STRING_SIZE);

    writeUnsignedInt(&address, portIn);
    writeUnsignedInt(&address, portOut);

    EEPROM.commit();
  }

private:
  //===================== EEPROM READ / WRITE UTILITIES ======================//

  void readCharArray(int *address, char *str, unsigned int len) {
    for (int i = 0; i < len; i++) {
      *(str + i) = EEPROM.read((*address)++);
    }
  }

  void writeCharArray(int *address, char *str, unsigned int len) {
    for (int i = 0; i < len; i++) {
      EEPROM.write((*address)++, *(str + i));
    }
  }

  unsigned int readUnsignedInt(int *address) {
    // High endian reading :
    // http://projectsfromtech.blogspot.fr/2013/09/combine-2-bytes-into-int-on-arduino.html
    byte x_high, x_low;

    x_high = EEPROM.read((*address)++);
    x_low = EEPROM.read((*address)++);

    unsigned int combined;
    combined = x_high;        //send x_high to rightmost 8 bits
    combined = combined<<8;   //shift x_high over to leftmost 8 bits
    combined |= x_low;        //logical OR keeps x_high intact in combined and fills in rightmost 8 bits

    return combined;
  }

  void writeUnsignedInt(int *address, unsigned int v) {
    // High endian storage :
    EEPROM.write((*address)++, highByte(v));
    EEPROM.write((*address)++, lowByte(v));
  }
};

#endif _SETTINGS_H_
