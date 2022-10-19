import Helper from "./helper";
import VeSyncDeviceBase from "./veSyncDeviceBase";

export default class VeSyncFan extends VeSyncDeviceBase {

    //region Device Features
    humid_features = {
        'Classic300S': {
            'module': 'VeSyncHumid200300S',
            'models': ['Classic300S', 'LUH-A601S-WUSB'],
            'features': ['nightlight'],
            'mist_modes': ['auto', 'sleep', 'manual'],
            'mist_levels': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        'Classic200S': {
            'module': 'VeSyncHumid200S',
            'models': ['Classic200S'],
            'features': [],
            'mist_modes': ['auto', 'manual'],
            'mist_levels': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        'Dual200S': {
            'module': 'VeSyncHumid200300S',
            'models': ['Dual200S',
                'LUH-D301S-WUSR',
                'LUH-D301S-WJP',
                'LUH-D301S-WEU'],
            'features': [],
            'mist_modes': ['auto', 'manual'],
            'mist_levels': [1, 2, 3]
        },
        'LV600S': {
            'module': 'VeSyncHumid200300S',
            'models': ['LUH-A602S-WUSR',
                'LUH-A602S-WUS',
                'LUH-A602S-WEUR',
                'LUH-A602S-WEU',
                'LUH-A602S-WJP'],
            'features': ['warm_mist', 'nightlight'],
            'mist_modes': ['humidity', 'sleep', 'manual'],
            'mist_levels': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            'warm_mist_levels': [0, 1, 2, 3]
        },
    }
    air_features = {
        'Core200S': {
            'module': 'VeSyncAirBypass',
            'models': ['Core200S', 'LAP-C201S-AUSR', 'LAP-C202S-WUSR'],
            'modes': ['sleep', 'off', 'manual'],
            'features': [],
            'levels': [1, 2, 3, 4]
        },
        'Core300S': {
            'module': 'VeSyncAirBypass',
            'models': ['Core300S', 'LAP-C301S-WJP'],
            'modes': ['sleep', 'off', 'auto', 'manual'],
            'features': ['air_quality'],
            'levels': [1, 2, 3, 4, 5]
        },
        'Core400S': {
            'module': 'VeSyncAirBypass',
            'models': ['Core400S',
                'LAP-C401S-WJP',
                'LAP-C401S-WUSR',
                'LAP-C401S-WAAA'],
            'modes': ['sleep', 'off', 'auto', 'manual'],
            'features': ['air_quality'],
            'levels': [1, 2, 3, 4, 5]
        },
        'Core600S': {
            'module': 'VeSyncAirBypass',
            'models': ['Core600S',
                'LAP-C601S-WUS',
                'LAP-C601S-WUSR',
                'LAP-C601S-WEU'],
            'modes': ['sleep', 'off', 'auto', 'manual'],
            'features': ['air_quality'],
            'levels': [1, 2, 3, 4, 5]
        },
        'LV-PUR131S': {
            'module': 'VeSyncAir131',
            'models': ['LV-PUR131S', 'LV-RH131S'],
            'features': ['air_quality']
        },
    }

    //endregion

    public toggleSwitch(toggle: boolean) {

        let body = {
            ...Helper.bypassBodyV2(this.api),
            cid: this.cid,
            configModule: this.configModule,
            payload: {
                data: {
                    enabled: toggle,
                    id: 0
                },
                method: 'setSwitch',
                source: 'APP'
            },
        }

        let result = Helper.callApi(this.api,
            '/cloud/v2/deviceManaged/bypassV2',
            'post',
            body,
            Helper.bypassHeader(),
        )
        result.then(result => console.log(result));
        this.deviceStatus = toggle ? 'on' : "off";
    }
}
