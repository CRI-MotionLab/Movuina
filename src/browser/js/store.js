// import Vue from 'vue';
import Vue from 'vue/dist/vue.js';
import Vuex from 'vuex';

Vue.use(Vuex);

const ipc = electron.ipcRenderer;

const store = new Vuex.Store({
  state: {
    lightboxInfo: {},
    lightboxData: {},
    serialPorts: [],
    serialPort: -1, // no serial port attached
    // for now let all the input devices data flow in at the same time (maybe implement this later)
    // connectedWifiDevices: [ 'none' ], // list of devices' userids, 'none' is always here in first place
    // activeWifiDevice: 'none',
    serialSensorValues: {
      accx: 0,
      accy: 0,
      accz: 0,
      gyrx: 0,
      gyry: 0,
      gyrz: 0,
      magx: 0,
      magy: 0,
      magz: 0,
    },
    movuinoSettings: {
      ssid: 'my_network_ssid',
      password: 'my_network_password',
      hostip: '0.0.0.0',
      name: '0',
    },
    movuinoState: {
      serialPortReady: false,
      movuinoip: '0.0.0.0',
      wifiState: 0,
    },
    useSerialInput: false,
    vibratorControl: {
      pulse: [ 10, 0, 1 ],
      now: 0,
    },
    inputDevicesOscFrame: {
      origin: '',
      address: '',
      name: '',
      accx: 0,
      accy: 0,
      accz: 0,
      gyrx: 0,
      gyry: 0,
      gyrz: 0,
      magx: 0,
      magy: 0,
      magz: 0,
      btn: 0,
      vib: 0,
    },
    outputDevicesOscFrame: {
      destination: '',
      address: '',
      args: [],
    },
    inputLocalOscFrame: {},
    outputLocalOscFrame: {},
    preprocessingParameters: {
      lineStyle: 'curved', // could be 'straight'
      lineWidth: 0, // lineWidth is normalized, define later min and max line width
      dots: false,
      zoom: 0, // zoom is a normalized value, define later min and max #samples to show
      resamplingFrequency: 50, // Hz
      filterSize: 1,
    },
    preprocessedSensorsOscFrame: {
      origin: '',
      address: '',
      name: '',
      accx: 0,
      accy: 0,
      accz: 0,
      gyrx: 0,
      gyry: 0,
      gyrz: 0,
      magx: 0,
      magy: 0,
      magz: 0,
      btn: 0,
      vib: 0,
    },
    showOscConnections: true,
  },
  // see https://stackoverflow.com/questions/44309627/vue-jsvuex-how-to-dispatch-from-a-mutation
  // (actually it is more "how to mutate from a dispatch" which is achieved here)
  // NOTE : x = Object.assign({}, x, y) is required, since vue won't notice the change otherwise :
  mutations: {
    updateLightboxInfo(state, info) {
      state.lightboxInfo = Object.assign({}, info);
    },
    updateLightboxData(state, data) {
      state.lightboxData = Object.assign({}, data);
    },
    updateSerialPorts(state, ports) {
      state.serialPorts = Object.assign({}, ports);
    },
    updateSerialPort(state, port) {
      state.port = port;
    },
    updateUseSerialInput(state, use) {
      state.useSerialInput = use;
    },
    updateSerialSensorValues(state, values) {
      state.serialSensorValues = Object.assign({}, state.serialSensorValues, values);
    },
    updateMovuinoSettings(state, settings) {
      state.movuinoSettings = Object.assign({}, state.movuinoSettings, settings);
    },
    updateMovuinoState(state, mstate) {
      state.movuinoState = Object.assign({}, state.movuinoState, mstate);
    },
    updateVibratorControl(state, values) {
      state.vibratorControl = Object.assign({}, state.vibratorControl, values);
    },
    updateInputDevicesOscFrame(state, frame) {
      state.inputDevicesOscFrame = Object.assign({}, state.inputDevicesOscFrame, frame);
    },
    updateOutputDevicesOscFrame(state, frame) {
      state.outputDevicesOscFrame = Object.assign({}, state.outputDevicesOscFrame, frame);
    },
    updateInputLocalOscFrame(state, frame) {
      state.inputLocalOscFrame = Object.assign({}, state.inputLocalOscFrame, frame);
    },
    updateOutputLocalOscFrame(state, frame) {
      state.outputLocalOscFrame = Object.assign({}, state.outputLocalOscFrame, frame);
    },
    updatePreprocessingParameters(state, params) {
      state.preprocessingParameters = Object.assign({}, state.preprocessingParameters, params);
    },
    updatePreprocessedSensorsOscFrame(state, frame) {
      state.preprocessedSensorsOscFrame = Object.assign({}, state.preprocessedSensorsOscFrame, frame);
    },
    updateShowOscConnections(state, show) {
      state.showOscConnections = show;
    },
  },
  // CREATING A SINGLE COMMUNICATION PATH HERE BETWEEN STORE AND electron's ipc
  actions: {
    loaded({ state }) {
      ipc.send('loaded');
      ipc.send('updateUseSerialInput', false);
      ipc.send('state', state);
    },
    getMyIp() {
      return new Promise((resolve, reject) => {
        ipc.once('setMyIp', function(e, ip) { resolve(ip); });
        ipc.send('getMyIp');
      });
    },
    getModelFromTrainingSet({}, trainingSet) {
      return new Promise((resolve, reject) => {
        ipc.once('setModelFromTrainingSet', function(e, model) { resolve(model); });
        ipc.send('getModelFromTrainingSet', trainingSet);
      });
    },
    setLightboxInfo({ commit }, info) {
      return new Promise((resolve, reject) => {        
        const unwatch = this.watch(this.getters.lightboxData, (val, oldVal) => {
          unwatch(); // equivalent to watching with 'once' event
          resolve(val);
        });
        commit('updateLightboxInfo', info);
      });
    },
    sendRecording({}, recording) {
      ipc.send('recording', recording);
    },
    // updateSomething({ commit }, updateSomething, something) {
    //   commit(updateSomething, something);
    //   ipc.send(updateSomething, something);
    // },
    updateSerialPort({ commit }, port) {
      commit('updateSerialPort', port);
      ipc.send('updateSerialPort', port);
    },
    updateUseSerialInput({ commit }, use) {
      commit('updateUseSerialInput', use);
      ipc.send('updateUseSerialInput', use);
    },
    updateMovuinoSettings({ commit }, settings) {
      commit('updateMovuinoSettings', settings);
      ipc.send('updateMovuinoSettings', settings);
    },
    updateOutputDevicesOscFrame({ commit }, frame) {
      commit('updateOutputDevicesOscFrame', frame);
      ipc.send('updateOutputDevicesOscFrame', frame);
    },
    updateOutputLocalOscFrame({ commit }, frame) {
      commit('updateOutputLocalOscFrame', frame);
      ipc.send('updateOutputLocalOscFrame', frame);
    },
  },
  // see https://codepen.io/CodinCat/pen/PpNvYr
  // (allows to watch variables from App.vue)
  getters: {
    lightboxInfo: state => () => state.lightboxInfo,
    lightboxData: state => () => state.lightboxData,
    serialPorts: state => () => state.serialPorts,
    useSerialInput: state => () => state.useSerialInput,
    movuinoSettings: state => () => state.movuinoSettings,
    movuinoState: state => () => state.movuinoState,
    inputDevicesOscFrame: state => () => state.inputDevicesOscFrame,
    inputLocalOscFrame: state => () => state.inputLocalOscFrame,
    preprocessedSensorsOscFrame: state => () => state.preprocessedSensorsOscFrame,
    showOscConnections: state => () => state.showOscConnections,
  },
});

// incoming messages :

ipc.on('updateSerialPorts', (e, arg) => {
  const ports = [];
  for (let v in arg) {
    ports.push(arg[v].comName);
  }
  store.commit('updateSerialPorts', ports);
});

ipc.on('updateSerialSensorValues', (e, arg) => {
  store.commit('updateSerialSensorValues', arg);
});

ipc.on('updateMovuinoSettings', (e, arg) => {
  store.commit('updateMovuinoSettings', arg);
});

ipc.on('updateMovuinoState', (e, arg) => {
  store.commit('updateMovuinoState', arg);
});

ipc.on('updateVibratorControl', (e, arg) => {
  store.commit('updateVibratorControl', arg);
});

ipc.on('updateInputDevicesOscFrame', (e, arg) => {
  store.commit('updateInputDevicesOscFrame', arg);
});

ipc.on('updateInputLocalOscFrame', (e, arg) => {
  store.commit('updateInputLocalOscFrame', arg);
});

ipc.on('updatePreprocessingParameters', (e, arg) => {
  store.commit('updatePreprocessingParameters', arg);
});

ipc.on('updatePreprocessedSensorValues', (e, arg) => {
  store.commit('updatePreprocessedSensorValues', arg);
});

ipc.on('noSerialDriverInstalled', (e, arg) => {
  // arg is url to display in lightbox
  // FIND A WAY TO TOGGLE LIGHT BOX
});

ipc.on('showOscConnections', (e, arg) => {
  store.commit('updateShowOscConnections', arg);
});


export default store;