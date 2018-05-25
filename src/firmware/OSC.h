/**
 *  Alternative simple and efficient OSC message sending implementation
 *  borrowed from the R-IoT firmware
 *  NB : "Word" type only seems compatible with Energia, not Arduino
 *  this is why some functions are commented out.
 */

// NB : THIS IS NOT USED IN ACTUAL MOVUINO FIRMWARE !!!

#define MAX_OSC_BUFFER_SIZE  200

#include <Arduino.h>

typedef struct s_OSC {
  char buf[MAX_OSC_BUFFER_SIZE];
  char *pData;
  unsigned int PacketSize;
} OSCBuffer;

void prepareOSCBuffer(OSCBuffer *TheBuffer, char *OscAddress, char TypeTag, uint8_t Slots);
// void stringToOSCBuffer(OSCBuffer *TheBuffer, char *OscAddress, char *StringMessage);
void floatToBigEndian(char *Dest, float *TheFloat);
// void shortToBigEndian(char *Dest, short int Val);
// void wordToBigEndian(char *Dest, Word TheWord)
