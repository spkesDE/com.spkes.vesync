import BasicHumidifier from "../../lib/BasicHumidifier";
import DeviceModes from "../../enum/DeviceModes";

export default class Oasis1000S extends BasicHumidifier {
    static deviceModels = ['LUH-M101S-WUS', 'LUH-M101S-WEUR'];
    static methods = ['getHumidifierStatus', 'setAutoStopSwitch', 'setSwitch', 'setVirtualLevel', 'setTargetHumidity', 'setHumidityMode', 'setDisplay', 'setNightLightBrightness'];
    static features = [];
    static levels = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    static modes = [DeviceModes.Auto, DeviceModes.Sleep, DeviceModes.Manual];

    protected hasMethod(method: string): boolean {
        return Oasis1000S.methods.includes(method);
    }

    /*
    VeSyncHumidifierOasis1000S {
  deviceRegion: 'EU',
  isOwner: true,
  deviceName: 'Levoit OasisMist 1000S Smart Ultrasonic Cool Mist Tower Humidifier',
  deviceImg: 'https://image.vesync.com/defaultImages/luh_m101s/luh_m101s_240.png',
  cid: 'vsaqfe869ae439f85e0551981bedbb09',
  connectionStatus: null,
  connectionType: 'WiFi+BTOnboarding+BTNotify',
  deviceType: 'LUH-M101S-WEUR',
  type: 'wifi-air',
  uuid: '30c3bdb5-80b6-4b10-a278-d96382dfee31',
  configModule: 'VS_WFON_AHM_LUH-M101S-WEUR_EU',
  macID: '60:55:f9:ba:d7:24',
  mode: 'off',
  speed: null,
  currentFirmVersion: null,
  subDeviceNo: null,
  deviceFirstSetupTime: 'Nov 28, 2023 4:06:44 PM',
  Device_Features: {
    OasisMist1000S: {
      models: [Array],
      features: [],
      modes: [Array],
      levels: [Array],
      method: [Array]
    }
  },
  childLock: 'off',
  enabled: false,
  api: VeSync {
    username: 'zdenda.skal@seznam.cz',
    password: 'badffa156977b6a55c0af3127fd9d193',
    time_zone: 'Europe/Berlin',
    token: '100100qyV_4cmplQ95I1mFaZiQgbKsyYiqQU0PI16lj1jNc-LItcTtNq75u0-qoL7mMW-9uGLkywa5RR55KAqDtQ2AfBlOZ_4e52A=',
    account_id: '12497001',
    devices: [ [Circular *1], [VeSyncHumidifier] ],
    loggedIn: true
  },
  extension: null,
  filter_life: 100,
  display: false,
  warm_mist_enabled: false,
  humidity: 0,
  mist_virtual_level: 0,
  mist_level: 0,
  water_lacks: false,
  humidity_high: false,
  water_tank_lifted: false,
  automatic_stop_reach_target: true,
  night_light_brightness: 0,
  warm_mist_level: 0,
  targetHumidity: 0,
  autoStopSwitch: false,
  night_light_state: false
}
     */

}