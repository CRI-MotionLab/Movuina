/**
 *  Alternative simple and efficient OSC message sending implementation
 *  borrowed from the R-IoT firmware
 *  NB : "Word" type only seems compatible with Energia, not Arduino
 *  this is why some functions are commented out.
 */

// Basic handling of an OSC packet
#include <stdio.h>
#include <string.h>
#include "OSC.h"

////////////////////////////////////////////////////////////////////////////////////
// Pre-allocate and fills the OSC structures
// adds the address and the type tags like "/address/subaddress ,iiiii"
// and finds the total packet size and begining of the data for further simplified
// update. This saves a lot of time by NOT re computing the OSC structure
// and padding, and limits data updates to RAM moves.

void prepareOSCBuffer(OSCBuffer *TheBuffer, char *OSCAddress, char TypeTag, uint8_t Slots)
{
  int i;
  int size = 0;
  char *pBuf;

  pBuf = TheBuffer->buf;
  size = strlen(OSCAddress);
  strcpy(pBuf, OSCAddress);
  pBuf += size;

  // We can't stop on an aligned %4, as we need at least one zero terminator in the address
  if(!(size%4))
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }

  // 4 byte padding / stuffing
  while(size%4)
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }
  // adds the comma char (separator for typetags)
  *pBuf = ',';
  pBuf++;
  size++;
  // adds the type tags
  for(i = 0 ; i < Slots ; i++)
  {
    *pBuf = TypeTag;
    pBuf++;
  }
  size += Slots;

  // We can't stop on an aligned %4, as we need at least one zero terminator in the address
  if(!(size%4))
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }
  // 4 byte padding / stuffing
  while(size%4)
  {
    *pBuf = '\0';
    pBuf++;
    size++;
  }

  // Stores where the actual data start
  TheBuffer->pData = pBuf;

  // Adds size of data
  size += Slots*4;
  pBuf += Slots*4;

  // Dumb check as at that point it's supposed to be 4-byte aligned
  while(size%4)
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }
  TheBuffer->PacketSize = size;
  *(pBuf+1) = '\0';
}

/*
void stringToOSCBuffer(OSCBuffer *TheBuffer, char *OscAddress, char *StringMessage)
{
  int i;
  int size = 0;
  char *pBuf;

  pBuf = TheBuffer->buf;
  size = strlen(OscAddress);
  strcpy(pBuf, OscAddress);
  pBuf += size;

  // We can't stop on an aligned %4, as we need at least one zero terminator in the address
  if(!(size%4))
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }

  // 4 byte padding / stuffing
  while(size%4)
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }
  // adds the comma char (separator for typetags)
  *pBuf = ',';
  pBuf++;
  size++;
  // adds the string type tags
  *pBuf = 's';
  pBuf++;
  size++;

  // We can't stop on an aligned %4, as we need at least one zero terminator in the address
  if(!(size%4))
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }
  // 4 byte padding / stuffing
  while(size%4)
  {
    *pBuf = '\0';
    pBuf++;
    size++;
  }

  // Stores where the actual data start
  TheBuffer->pData = pBuf;

  // Adds size of data (string length)
  strcpy(pBuf, StringMessage);
  size += strlen(StringMessage);
  pBuf += strlen(StringMessage);

  // There is a mandatory string terminator that isn't inserted by the
  // string copy above (as it stops without including it)
  *pBuf = '\0';
  pBuf++;
  size++;

  // Eventually pads the string to %4
  while(size%4)
  {
    *pBuf = '\0';
    size++;
    pBuf++;
  }

  TheBuffer->PacketSize = size;
  *pBuf = '\0';
  //Serial.print("OSC packet size = ");
  //Serial.println(size);
}
//*/

//*
void floatToBigEndian(char *Dest, float *TheFloat)
{
  char *pF = (char*)TheFloat;
  Dest[0] = pF[3];
  Dest[1] = pF[2];
  Dest[2] = pF[1];
  Dest[3] = pF[0];

}
//*/

/*
void shortToBigEndian(char *Dest, short int Val)
{
  // Sign padding
  if(Val < 0)
  {
      Dest[0] = 0xFF;
      Dest[1] = 0xFF;
  }
  else
  {
      Dest[0] = 0;
      Dest[1] = 0;
  }
  Dest[2] = (unsigned char)(Val >> 8);
  Dest[3] = (unsigned char)(Val & 0x00FF);
}
//*/

/*
void WordToBigEndian(char *Dest, Word TheWord)
{
  // Sign padding / extension
  if(TheWord.Value < 0)
  {
      Dest[0] = 0xFF;
      Dest[1] = 0xFF;
  }
  else
  {
      Dest[0] = 0;
      Dest[1] = 0;
  }
  Dest[2] = TheWord.Val[1];
  Dest[3] = TheWord.Val[0];
}
//*/

