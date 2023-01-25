import VeSyncDeviceBase from "../vesync/veSyncDeviceBase";
import VeSyncPurifier from "../vesync/veSyncPurifier";
import VeSyncHumidifier from "../vesync/veSyncHumidifier";

export default interface VeSyncDeviceInterface {
    device: VeSyncDeviceBase | VeSyncPurifier | VeSyncHumidifier | undefined;

    setMode(mode: string): void;

    getDevice(): Promise<void>;

    updateDevice(): void;
}
