import os from 'os';
import xl from 'excel4node';
// found here :
// https://stackoverflow.com/questions/3653065/get-local-ip-address-in-node-js

const lightYellow = '#fff17a';
const lightBlue = '#7cdde2';
const lightRed = '#f45a54';

const colors = [
  lightYellow,
  lightBlue,
  lightRed
];

//----------------------------------------------------------------------------//

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

//----------------------------------------------------------------------------//

function getMovuinoIdAndOSCSuffixFromAddress(address) {
  const urlParts = address.split('/');

  if (urlParts.length > 3 && urlParts[0] === '' && urlParts[1] === 'movuino') {
    return {
      id: urlParts[2],
      suffix: '/' + urlParts.slice(3).join('/')
    };
  }

  return null;
}

function stripMovuinoOSCPrefix(address, id) {
  const urlParts = address.split('/');

  if (urlParts.length > 3 && urlParts[0] === '' &&
      urlParts[1] === 'movuino' && urlParts[2] === id) {
    const suffix = '/' + urlParts.slice(3).join('/');
    return suffix;
  }

  return null;
}

//----------------------------------------------------------------------------//

const createExcelDocFromRecording = (recording) => {
  const wb = new xl.Workbook();
  const ws = wb.addWorksheet('Sensors');

  const style = {
    font: { color: '#000000' },
    fill: {
      type: 'pattern',
      patternType: 'solid',
      // fgColor: ''
    }
  };

  let greyStyle = JSON.parse(JSON.stringify(style));
  greyStyle.fill.fgColor = 'eeeeee';
  let yellowStyle = JSON.parse(JSON.stringify(style));
  yellowStyle.fill.fgColor = lightYellow.replace('#', '');
  let blueStyle = JSON.parse(JSON.stringify(style));
  blueStyle.fill.fgColor = lightBlue.replace('#', '');
  let redStyle = JSON.parse(JSON.stringify(style));
  redStyle.fill.fgColor = lightRed.replace('#', '');

  greyStyle = wb.createStyle(greyStyle);
  yellowStyle = wb.createStyle(yellowStyle);
  blueStyle = wb.createStyle(blueStyle);
  redStyle = wb.createStyle(redStyle);

  ws.cell(1, 1).string('time').style(greyStyle);
  ws.cell(1, 2).string('accelX').style(yellowStyle);
  ws.cell(1, 3).string('accelY').style(yellowStyle);
  ws.cell(1, 4).string('accelZ').style(yellowStyle);
  ws.cell(1, 5).string('gyroX').style(blueStyle);
  ws.cell(1, 6).string('gyroY').style(blueStyle);
  ws.cell(1, 7).string('gyroZ').style(blueStyle);
  ws.cell(1, 8).string('magX').style(redStyle);
  ws.cell(1, 9).string('magY').style(redStyle);
  ws.cell(1, 10).string('magZ').style(redStyle);

  const zero = recording[0].time;

  for (let i = 0; i < recording.length; i++) {
    ws.cell(i + 2, 1).number(recording[i].time - zero);

    for (let j = 0; j < recording[i].data.length; j++) {
      ws.cell(i + 2, j + 2).number(recording[i].data[j]);
    }
  }

  return wb.writeToBuffer(); // Promise
};

//----------------------------------------------------------------------------//

export {
  colors,
  getMyIP,
  getMovuinoIdAndOSCSuffixFromAddress,
  stripMovuinoOSCPrefix,
  createExcelDocFromRecording,
};