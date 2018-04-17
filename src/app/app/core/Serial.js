import serial from 'serialport';

class Serial {
  constructor() {

  }

  refreshSerialportsList() {
    serial.list()
      .then(p => {
        ports = p;
        callback(null, p);
        // console.log(ports);
      })
      .catch(err => {
        ports = null;
        callback(err, null);
        // console.error(err);
      });
  }
};

export default Serial;
