import VeSyncDeviceBase from 'tsvesync/veSyncDeviceBase';
import VeSyncHumidifier from 'tsvesync/veSyncHumidifier';
import VeSyncPurifier from 'tsvesync/veSyncPurifier';

export default interface VeSyncDeviceInterface {
    device: VeSyncDeviceBase | VeSyncPurifier | VeSyncHumidifier | undefined;

    setMode(mode: string): void;

    getDevice(): Promise<void>;

    updateDevice(): void;
}
