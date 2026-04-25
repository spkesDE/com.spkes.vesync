import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicAirFryer from "../tsvesync/lib/BasicAirFryer";
import IStartMultiCookPayload from "../tsvesync/models/airfryer/IStartMultiCookPayload";
import {IAirFryerPreset} from "../tsvesync/models/airfryer/IAirFryerPreset";
import {IAirFryerStatusItem} from "../tsvesync/models/airfryer/IGetAirFryerMultiStatus";
import { getErrorMessage } from "./utils/error";

type AirFryerProgramId = 'off' | 'airfry' | 'bake' | 'roast' | 'grill' | 'reheat' | 'dry' | 'proof' | 'mixed';
type AirFryerCookStatusId = 'standby' | 'ready' | 'awaiting_input' | 'pull_out' | 'cooking' | 'paused' | 'completed' | 'unknown';
const DEFAULT_PROGRAM: Exclude<AirFryerProgramId, 'off' | 'mixed'> = 'airfry';

export default class AirFryerDeviceBase extends Homey.Device {
    device!: BasicAirFryer;
    private updateInterval!: NodeJS.Timer;
    private awaitingInputSince: number | null = null;

    async onInit() {
        const deviceReady = await this.getDevice().then(() => true).catch((reason) => {
            this.log(reason);
            return false;
        });

        if (!deviceReady) {
            return;
        }

        await this.ensurePresetsLoaded();
        await this.ensureDefaultCapabilityValues();
        await this.updateDevice().catch(this.error);

        if (this.hasCapability('onoff')) {
            this.registerCapabilityListener('onoff', async (value) => {
                if (!value) {
                    await this.stopCooking();
                    return;
                }

                await this.startSelectedProgram();
            });
        }

        if (this.hasCapability('airfryerProgram')) {
            this.registerCapabilityListener('airfryerProgram', async (value: AirFryerProgramId) => {
                if (this.getCookStatusCapabilityValue() !== 'standby') {
                    throw new Error('Turn the fryer off before changing the program.');
                }

                if (value === 'off' || value === 'mixed') {
                    await this.updateCapability('airfryerProgram', DEFAULT_PROGRAM);
                    return;
                }

                const program = this.normalizeProgram(value);
                await this.applyProgramDefaults(program);
            });
        }

        if (this.hasCapability('target_temperature')) {
            this.registerCapabilityListener('target_temperature', async (value: number) => {
                if (!Number.isFinite(value)) {
                    return;
                }

                if (this.getCookStatusCapabilityValue() !== 'standby') {
                    throw new Error('Turn the fryer off before changing the cook temperature.');
                }
            });
        }

        if (this.hasCapability('measure_airfryer_cook_set_time')) {
            this.registerCapabilityListener('measure_airfryer_cook_set_time', async (value: number) => {
                if (!Number.isFinite(value)) {
                    return;
                }

                if (this.getCookStatusCapabilityValue() !== 'standby') {
                    throw new Error('Turn the fryer off before changing the cook time.');
                }
            });
        }

        this.updateInterval = this.homey.setInterval(async () => this.updateDevice().catch(this.error), 1000 * 60);
    }

    async onDeleted() {
        if (this.updateInterval) {
            this.homey.clearInterval(this.updateInterval);
        }
    }

    public async startPreset(programId: AirFryerProgramId): Promise<void> {
        await this.ensurePresetsLoaded();
        const program = this.normalizeProgram(programId);
        const tempUnit = this.device.status?.tempUnit ?? 'c';
        const payload = this.buildStartPayload(program, tempUnit);
        await this.device.startMultiCook(payload).catch(this.error);
        await this.updateDevice();
    }

    public async stopCooking(): Promise<void> {
        await this.device.endCook(this.getChamber()).catch(this.error);
        const stopped = await this.waitForStandby(10000);
        if (!stopped) {
            await this.device.endCook(4).catch(this.error);
            await this.waitForStandby();
        }
        await this.updateDevice();
    }

    public async setPreferredTempUnit(unit: 'c' | 'f'): Promise<void> {
        await this.device.setTempUnit(unit).catch(this.error);
        await this.updateDevice();
    }

    public async getDevice(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            const veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
            if (veSync === null || !veSync.isLoggedIn()) {
                await this.setUnavailable(this.homey.__("devices.failed_login"));
                return reject("Failed to login. Please use the repair function.");
            }

            const data = this.getData() as { id: string; uuid?: string };
            const physicalUuid = data.uuid ?? data.id;
            const device = veSync.getStoredDevice().find(d => d.device.uuid === physicalUuid);
            if (device === undefined || !(device instanceof BasicAirFryer)) {
                this.error("Device is undefined or is not a VeSync Air Fryer");
                await this.setUnavailable(this.homey.__("devices.not_found"));
                return reject("Device is undefined or is not a VeSync Air Fryer");
            }

            this.device = device as BasicAirFryer;
            const status = await this.device.getAirFryerStatus().catch(async (reason: unknown) => {
                const message = getErrorMessage(reason);
                if (message === "device offline") {
                    await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
                } else {
                    await this.setUnavailable(message).catch(this.error);
                    this.error(reason);
                }
                return null;
            });

            if (!status || status.msg !== "request success") {
                this.error("Failed to get device status.");
                await this.setUnavailable(this.homey.__("devices.offline"));
                return reject("Cannot get device status. Device is " + status?.msg);
            }

            await this.setAvailable().catch(this.error);
            return resolve();
        });
    }

    async updateDevice(): Promise<void> {
        const status = await this.device.getAirFryerStatus().catch(async (reason: unknown) => {
            const message = getErrorMessage(reason);
            if (message === "device offline") {
                await this.markDeviceOffline();
            } else {
                await this.setUnavailable(message).catch(this.error);
                this.error(reason);
            }
            return null;
        });

        if (!status || status.msg !== "request success") {
            if (this.getAvailable()) {
                await this.markDeviceOffline();
            }
            return;
        }

        if (!this.getAvailable()) {
            await this.setAvailable().catch(this.error);
            await this.homey.flow.getDeviceTriggerCard("device_online").trigger(this).catch(this.error);
        }

        const airFryerStatus = status.result.result;
        const chamberStatus = this.getChamberStatus(airFryerStatus.statusList);
        const isActive = chamberStatus ? this.isActiveCookStatus(chamberStatus) : false;
        const previousCookStatus = this.getCookStatusCapabilityValue();
        const liveCookStatus = this.mapCookStatus(chamberStatus?.cookStatus);
        const selectedProgram = this.getSelectedProgram();
        const selectedCookSetTime = this.getSelectedCookSetTimeMinutes();
        const selectedCookTemp = this.getSelectedCookTemp();
        const program = chamberStatus && isActive ? this.getProgramFromStatus(chamberStatus) : selectedProgram;
        const remainingMinutes = chamberStatus && isActive
            ? Math.ceil((chamberStatus.totalTimeRemaining ?? 0) / 60)
            : 0;
        const holdTime = this.getHoldTimeMinutes(liveCookStatus, chamberStatus);
        const cookSetTime = chamberStatus && isActive
            ? Math.ceil((chamberStatus.cookSetTime ?? 0) / 60)
            : selectedCookSetTime;
        const cookTemp = chamberStatus && isActive
            ? chamberStatus.cookTemp ?? 0
            : selectedCookTemp;
        const currentRemainingTime = chamberStatus
            ? Math.ceil((chamberStatus.currentRemainingTime ?? 0) / 60)
            : 0;

        await this.updateCapability('onoff', isActive);
        await this.updateCapability('airfryerProgram', program);
        await this.updateCapability('measure_airfryer_remaining_time', remainingMinutes);
        await this.updateCapability('airfryerCookStatus', liveCookStatus);
        await this.updateCapability('measure_airfryer_hold_time', holdTime);
        await this.updateCapability('measure_airfryer_cook_set_time', cookSetTime);
        await this.updateCapability('target_temperature', cookTemp);
        await this.updateCapability('measure_temperature', cookTemp);
        await this.updateCapability('measure_airfryer_current_remaining_time', currentRemainingTime);

        if (previousCookStatus !== 'pull_out' && liveCookStatus === 'pull_out') {
            await this.homey.flow.getDeviceTriggerCard('airfryer_pull_out').trigger(this).catch(this.error);
        }
    }

    async checkForCapability(capability: string) {
        if (!this.hasCapability(capability)) {
            await this.addCapability(capability).catch(this.error);
        }
    }

    private async updateCapability(capability: string, value: string | number | boolean): Promise<void> {
        if (this.hasCapability(capability)) {
            await this.setCapabilityValue(capability, value).catch(this.error);
        }
    }

    private async ensureDefaultCapabilityValues(): Promise<void> {
        if (this.hasCapability('airfryerProgram') && this.getCapabilityValue('airfryerProgram') == null) {
            await this.setCapabilityValue('airfryerProgram', DEFAULT_PROGRAM).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_remaining_time') && this.getCapabilityValue('measure_airfryer_remaining_time') == null) {
            await this.setCapabilityValue('measure_airfryer_remaining_time', 0).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_hold_time') && this.getCapabilityValue('measure_airfryer_hold_time') == null) {
            await this.setCapabilityValue('measure_airfryer_hold_time', 0).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_cook_set_time') && this.getCapabilityValue('measure_airfryer_cook_set_time') == null) {
            await this.setCapabilityValue('measure_airfryer_cook_set_time', this.getPresetCookSetTimeMinutes(DEFAULT_PROGRAM)).catch(this.error);
        }

        if (this.hasCapability('target_temperature') && this.getCapabilityValue('target_temperature') == null) {
            await this.setCapabilityValue('target_temperature', this.getPresetCookTemp(DEFAULT_PROGRAM)).catch(this.error);
        }

        if (this.hasCapability('measure_temperature') && this.getCapabilityValue('measure_temperature') == null) {
            await this.setCapabilityValue('measure_temperature', this.getPresetCookTemp(DEFAULT_PROGRAM)).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_current_remaining_time') && this.getCapabilityValue('measure_airfryer_current_remaining_time') == null) {
            await this.setCapabilityValue('measure_airfryer_current_remaining_time', 0).catch(this.error);
        }

        if (this.hasCapability('airfryerCookStatus') && this.getCapabilityValue('airfryerCookStatus') == null) {
            await this.setCapabilityValue('airfryerCookStatus', 'standby').catch(this.error);
        }
    }

    private async ensurePresetsLoaded(): Promise<void> {
        if (this.device.presetRecipes.length === 0) {
            await this.device.getPresetRecipe().catch(this.error);
        }
    }

    private async waitForStandby(timeoutMs: number = 35000, intervalMs: number = 2500): Promise<boolean> {
        const deadline = Date.now() + timeoutMs;

        while (Date.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, intervalMs));
            const status = await this.device.getAirFryerStatus().catch(() => null);
            if (!status || status.msg !== "request success") {
                continue;
            }

            const chamberStatus = this.getChamberStatus(status.result.result.statusList);
            const isStandby = !chamberStatus || chamberStatus.cookStatus === 'standby';

            if (isStandby) {
                return true;
            }
        }

        return false;
    }

    private buildStartPayload(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>, tempUnit: string): IStartMultiCookPayload {
        const mode = this.programIdToMode(programId);
        const chamber = this.getChamber();
        const config = this.device.buildCookConfig(mode, chamber);

        return {
            accountId: String(this.device.api.getAccountID()),
            cookConfigs: [{
                ...config,
                cookSetTime: this.getSelectedCookSetTimeSeconds(),
                cookTemp: this.getSelectedCookTemp(),
            }],
            readyStart: true,
            syncType: 0,
            tempUnit,
            workChamber: chamber,
        };
    }

    private isActiveCookStatus(item: IAirFryerStatusItem): boolean {
        return item.cookStatus !== 'standby'
            && ((item.cookSetTime ?? 0) > 0
                || (item.currentRemainingTime ?? 0) > 0
                || Boolean(item.recipeName));
    }

    private getProgramFromStatus(status: IAirFryerStatusItem): AirFryerProgramId {
        if (!this.isActiveCookStatus(status)) {
            return this.getSelectedProgram();
        }

        return this.modeToProgramId(status.mode);
    }

    private async startSelectedProgram(): Promise<void> {
        const program = this.getSelectedProgram();
        await this.startPreset(program);
    }

    private async applyProgramDefaults(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>): Promise<void> {
        await this.updateCapability('airfryerProgram', programId);
        await this.updateCapability('measure_airfryer_cook_set_time', this.getPresetCookSetTimeMinutes(programId));
        await this.updateCapability('target_temperature', this.getPresetCookTemp(programId));
        await this.updateCapability('measure_temperature', this.getPresetCookTemp(programId));
    }

    private getSelectedProgram(): Exclude<AirFryerProgramId, 'off' | 'mixed'> {
        const value = this.getCapabilityValue('airfryerProgram') as AirFryerProgramId | null;
        return this.normalizeProgram(value ?? DEFAULT_PROGRAM);
    }

    private getSelectedCookSetTimeMinutes(): number {
        const value = Number(this.getCapabilityValue('measure_airfryer_cook_set_time') ?? 0);
        if (!Number.isFinite(value) || value <= 0) {
            return this.getPresetCookSetTimeMinutes(this.getSelectedProgram());
        }

        return Math.round(value);
    }

    private getSelectedCookSetTimeSeconds(): number {
        const minutes = this.getSelectedCookSetTimeMinutes();
        return Math.max(1, minutes) * 60;
    }

    private getSelectedCookTemp(): number {
        const value = Number(this.getCapabilityValue('target_temperature') ?? 0);
        if (!Number.isFinite(value) || value <= 0) {
            return this.getPresetCookTemp(this.getSelectedProgram());
        }

        return Math.round(value);
    }

    private getPreset(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>): IAirFryerPreset {
        const preset = this.device.getPreset(this.programIdToMode(programId));
        if (!preset) {
            throw new Error(`Preset not found for program: ${programId}`);
        }

        return preset;
    }

    private getPresetCookSetTimeMinutes(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>): number {
        return Math.ceil(this.getPreset(programId).cookSetTime / 60);
    }

    private getPresetCookTemp(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>): number {
        return this.getPreset(programId).cookTemp;
    }

    private normalizeProgram(programId: AirFryerProgramId): Exclude<AirFryerProgramId, 'off' | 'mixed'> {
        if (programId === 'off' || programId === 'mixed') {
            return DEFAULT_PROGRAM;
        }

        return programId;
    }

    private getCookStatusCapabilityValue(): AirFryerCookStatusId {
        const value = this.getCapabilityValue('airfryerCookStatus');
        switch (value) {
            case 'ready':
            case 'awaiting_input':
            case 'pull_out':
            case 'cooking':
            case 'paused':
            case 'completed':
            case 'unknown':
                return value;
            default:
                return 'standby';
        }
    }

    private mapCookStatus(cookStatus?: string): AirFryerCookStatusId {
        switch ((cookStatus ?? 'standby').toLowerCase()) {
            case 'standby':
                return 'standby';
            case 'ready':
                return 'ready';
            case 'cookstop':
                return 'awaiting_input';
            case 'pullout':
                return 'pull_out';
            case 'cooking':
                return 'cooking';
            case 'pause':
            case 'paused':
                return 'paused';
            case 'done':
            case 'finish':
            case 'finished':
            case 'completed':
                return 'completed';
            default:
                return 'unknown';
        }
    }

    private getHoldTimeMinutes(
        cookStatus: AirFryerCookStatusId,
        chamberStatus?: IAirFryerStatusItem,
    ): number {
        if (cookStatus === 'awaiting_input') {
            if (this.awaitingInputSince == null) {
                this.awaitingInputSince = Date.now();
            }

            const apiHoldTimeMinutes = Math.ceil((chamberStatus?.holdTime ?? 0) / 60);
            if (apiHoldTimeMinutes > 0) {
                return apiHoldTimeMinutes;
            }

            return Math.max(0, Math.ceil((Date.now() - this.awaitingInputSince) / 60000));
        }

        this.awaitingInputSince = null;
        return chamberStatus ? Math.ceil((chamberStatus.holdTime ?? 0) / 60) : 0;
    }

    private getChamber(): number {
        const data = this.getData() as { chamber?: number | string };
        return Number(data.chamber ?? 1);
    }

    private getChamberStatus(statusList: IAirFryerStatusItem[]): IAirFryerStatusItem | undefined {
        return statusList.find((item) => item.chamber === this.getChamber());
    }

    private programIdToMode(programId: Exclude<AirFryerProgramId, 'off' | 'mixed'>): string {
        switch (programId) {
            case 'airfry':
                return 'AirFry';
            case 'bake':
                return 'Bake';
            case 'roast':
                return 'Roast';
            case 'grill':
                return 'Grill';
            case 'reheat':
                return 'Reheat';
            case 'dry':
                return 'Dry';
            case 'proof':
                return 'Proof';
        }
    }

    private modeToProgramId(mode: string): AirFryerProgramId {
        switch (mode.toLowerCase()) {
            case 'airfry':
                return 'airfry';
            case 'bake':
                return 'bake';
            case 'roast':
                return 'roast';
            case 'grill':
                return 'grill';
            case 'reheat':
                return 'reheat';
            case 'dry':
                return 'dry';
            case 'proof':
                return 'proof';
            default:
                return 'mixed';
        }
    }

    private async markDeviceOffline(): Promise<void> {
        const wasAvailable = this.getAvailable();
        await this.setUnavailable(this.homey.__("devices.offline")).catch(this.error);
        if (wasAvailable) {
            await this.homey.flow.getDeviceTriggerCard("device_offline").trigger(this).catch(this.error);
        }
    }
}
