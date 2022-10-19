const enum ApiCalls {
    DEVICES = '/cloud/v1/deviceManaged/devices',
    LOGIN = '/cloud/v1/user/login',
    BYPASS = '/cloud/v1/deviceManaged/bypass',
    BYPASS_V2 = '/cloud/v2/deviceManaged/bypassV2',
    CONFIGURATIONS = '/cloud/v1/deviceManaged/configurations',

    /* SmartBulb */
    UPDATE_BRIGHTNESS = '/SmartBulb/v1/device/updateBrightness',
    DEVICE_DETAIL = '/SmartBulb/v1/device/devicedetail',

    /* FAN */
    UPDATE_SPEED_131  = '/131airPurifier/v1/device/updateSpeed',
    UPDATE_MODE_131  = '/131airPurifier/v1/device/updateMode',
    DEVICE_STATUS_131  = '/131airPurifier/v1/device/deviceStatus',
    DEVICE_DETAIL_131  = '/131airPurifier/v1/device/deviceDetail',
    CONFIGURATIONS_131  = '/131airPurifier/v1/device/configurations',
}
