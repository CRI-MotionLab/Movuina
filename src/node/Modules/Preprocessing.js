import EventEmitter from 'events';
import fs from 'fs-extra';
import jszip from 'jszip';

import {
  createExcelDocFromRecording,
  createCsvDocFromRecording,
} from '../util';

class Preprocessing extends EventEmitter {
  constructor() {
    super();
  }

  createFile(recording) {
    const buffers = {};
    const promises = [];

    if (recording.formats.xlsx) {
      promises.push(createExcelDocFromRecording(recording.data));
    }

    if (recording.formats.csv) {
      promises.push(createCsvDocFromRecording(recording.data));
    }

    Promise.all(promises)
    .then((bufs) => {
      if (recording.formats.xlsx) {
        if (recording.formats.nformats === 1) {
          fs.writeFileSync(`${recording.filepath}`, bufs[0]);              
        } else {
          buffers['xlsx'] = bufs[0];
        }
      }

      if (recording.formats.csv) {
        if (recording.formats.nformats === 1) {
          fs.writeFileSync(`${recording.filepath}`, bufs[0]);              
        } else {
          buffers['csv'] = bufs[1];
        }
      }

      if (recording.formats.nformats > 1) {
        // create zip file from buffers
        const zip = new jszip();

        for (let ext in buffers) {
          zip.file(`${recording.filename}.${ext}`, buffers[ext]);
        }

        zip
        .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream(`${recording.filepath}`))
        .on('finish', function () {
          // JSZip generates a readable stream with a "end" event,
          // but is piped here in a writable stream which emits a "finish" event.
          console.log("zip file created");
        });
      }
    });
  }
};

const instance = new Preprocessing();

export default instance;