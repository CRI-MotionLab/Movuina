import os from 'os';

// found here :
// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js

const getMyIP = () => {
  let res = null;
  var ifaces = os.networkInterfaces();

  Object.keys(ifaces).forEach(function(ifname) {
    ifaces[ifname].forEach(function(iface) {
      if (iface.family !== 'IPv4' || iface.internal !== false) {
        return;
      }

      res = iface.address;
      // console.log(ifname + ' : ' + iface.address); // this is my IP
    });
  });

  return res;
};

export {
  getMyIP,
};