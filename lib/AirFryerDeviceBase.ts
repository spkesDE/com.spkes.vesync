import Homey from "homey";
import VeSync from "../tsvesync/VeSync";
import VeSyncApp from "../app";
import BasicAirFryer from "../tsvesync/lib/BasicAirFryer";
import IStartMultiCookPayload from "../tsvesync/models/airfryer/IStartMultiCookPayload";
import {IAirFryerPreset} from "../tsvesync/models/airfryer/IAirFryerPreset";
import {IAirFryerStatusItem} from "../tsvesync/models/airfryer/IGetAirFryerMultiStatus";
import { getErrorMessage } from "./utils/error";
import HomeyDeviceBase from "./HomeyDeviceBase";

type AirFryerProgramId = 'off' | 'airfry' | 'broil' | 'bake' | 'roast' | 'grill' | 'reheat' | 'dry' | 'proof' | 'steak' | 'seafood' | 'veggies' | 'french_fries' | 'frozen' | 'chicken' | 'mixed';
type AirFryerCookStatusId = 'standby' | 'ready' | 'awaiting_input' | 'pull_out' | 'cooking' | 'paused' | 'completed' | 'unknown';
type CookProgramId = Exclude<AirFryerProgramId, 'off' | 'mixed'>;
const DEFAULT_PROGRAM: CookProgramId = 'airfry';

export default class AirFryerDeviceBase extends HomeyDeviceBase {
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
                    await this.updateCapability('airfryerProgram', this.getDefaultProgram());
                    return;
                }

                const program = this.normalizeProgram(value);
                this.assertProgramSupported(program);
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
        const program = this.normalizeFlowProgram(programId);
        this.assertProgramSupported(program);
        const tempUnit = this.device.status?.tempUnit ?? 'c';
        const payload = this.buildStartPayload(program, tempUnit);
        await this.runCommandWithOptimisticCapabilities([
            {capability: 'onoff', value: true},
            {capability: 'airfryerProgram', value: program},
        ], () => this.device.startMultiCook(payload));
        await this.updateDevice();
    }

    public async stopCooking(): Promise<void> {
        this.assertCommandSucceeded(await this.device.endCook(this.getChamber()));
        const stopped = await this.waitForStandby(10000);
        if (!stopped) {
            this.assertCommandSucceeded(await this.device.endCook(4));
            await this.waitForStandby();
        }
        await this.updateDevice();
    }

    public async setPreferredTempUnit(unit: 'c' | 'f'): Promise<void> {
        this.assertCommandSucceeded(await this.device.setTempUnit(unit));
        await this.updateDevice();
    }

    public async getDevice(): Promise<void> {
        const veSync: VeSync = (this.homey.app as VeSyncApp).veSync;
        if (veSync === null || !veSync.isLoggedIn()) {
            await this.setUnavailable(this.homey.__("devices.failed_login"));
            throw new Error("Failed to login. Please use the repair function.");
        }

        const device = this.findStoredVeSyncDevice(veSync.getStoredDevice());

        if (!(device instanceof BasicAirFryer)) {
            this.error("Device is undefined or is not a VeSync Air Fryer");
            await this.setUnavailable(this.homey.__("devices.not_found"));
            throw new Error("Device is undefined or is not a VeSync Air Fryer");
        }

        this.device = device;
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
            throw new Error("Cannot get device status. Device is " + (status?.msg ?? "unknown"));
        }

        await this.setAvailable().catch(this.error);
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

        await this.triggerCookStatusFlows(previousCookStatus, liveCookStatus, program, remainingMinutes);

        if (previousCookStatus !== 'pull_out' && liveCookStatus === 'pull_out') {
            await this.homey.flow.getDeviceTriggerCard('airfryer_pull_out').trigger(this).catch(this.error);
        }
    }

    private async updateCapability(capability: string, value: string | number | boolean): Promise<void> {
        await this.setCapabilityIfPresent(capability, value);
    }

    private async ensureDefaultCapabilityValues(): Promise<void> {
        if (this.hasCapability('airfryerProgram') && this.getCapabilityValue('airfryerProgram') == null) {
            await this.setCapabilityValue('airfryerProgram', this.getDefaultProgram()).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_remaining_time') && this.getCapabilityValue('measure_airfryer_remaining_time') == null) {
            await this.setCapabilityValue('measure_airfryer_remaining_time', 0).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_hold_time') && this.getCapabilityValue('measure_airfryer_hold_time') == null) {
            await this.setCapabilityValue('measure_airfryer_hold_time', 0).catch(this.error);
        }

        if (this.hasCapability('measure_airfryer_cook_set_time') && this.getCapabilityValue('measure_airfryer_cook_set_time') == null) {
            await this.setCapabilityValue('measure_airfryer_cook_set_time', this.getPresetCookSetTimeMinutes(this.getDefaultProgram())).catch(this.error);
        }

        if (this.hasCapability('target_temperature') && this.getCapabilityValue('target_temperature') == null) {
            await this.setCapabilityValue('target_temperature', this.getPresetCookTemp(this.getDefaultProgram())).catch(this.error);
        }

        if (this.hasCapability('measure_temperature') && this.getCapabilityValue('measure_temperature') == null) {
            await this.setCapabilityValue('measure_temperature', this.getPresetCookTemp(this.getDefaultProgram())).catch(this.error);
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

    private buildStartPayload(programId: CookProgramId, tempUnit: string): IStartMultiCookPayload {
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

    private async applyProgramDefaults(programId: CookProgramId): Promise<void> {
        await this.updateCapability('airfryerProgram', programId);
        await this.updateCapability('measure_airfryer_cook_set_time', this.getPresetCookSetTimeMinutes(programId));
        await this.updateCapability('target_temperature', this.getPresetCookTemp(programId));
        await this.updateCapability('measure_temperature', this.getPresetCookTemp(programId));
    }

    private getSelectedProgram(): CookProgramId {
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

    private getPreset(programId: CookProgramId): IAirFryerPreset {
        const preset = this.device.getPreset(this.programIdToMode(programId));
        if (!preset) {
            throw new Error(`Preset not found for program: ${programId}`);
        }

        return preset;
    }

    private getPresetCookSetTimeMinutes(programId: CookProgramId): number {
        return Math.ceil(this.getPreset(programId).cookSetTime / 60);
    }

    private getPresetCookTemp(programId: CookProgramId): number {
        return this.getPreset(programId).cookTemp;
    }

    private normalizeProgram(programId: AirFryerProgramId): CookProgramId {
        if (programId === 'off' || programId === 'mixed') {
            return this.getDefaultProgram();
        }

        if (!this.isProgramSupported(programId)) {
            return this.getDefaultProgram();
        }

        return programId;
    }

    private normalizeFlowProgram(programId: AirFryerProgramId): CookProgramId {
        if (programId === 'off' || programId === 'mixed') {
            return this.getDefaultProgram();
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
            case 'heating':
            case 'preheating':
            case 'keeping':
                return 'cooking';
            case 'pause':
            case 'paused':
                return 'paused';
            case 'done':
            case 'finish':
            case 'finished':
            case 'completed':
            case 'cookend':
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

    private async triggerCookStatusFlows(
        previousCookStatus: AirFryerCookStatusId,
        liveCookStatus: AirFryerCookStatusId,
        program: AirFryerProgramId,
        remainingMinutes: number,
    ): Promise<void> {
        if (previousCookStatus === liveCookStatus) {
            return;
        }

        await this.homey.flow.getDeviceTriggerCard('airfryer_cook_status_changed').trigger(this, {
            status: liveCookStatus,
            previous_status: previousCookStatus,
            program,
            remaining_time: remainingMinutes,
        }).catch(this.error);

        if (liveCookStatus === 'cooking') {
            await this.homey.flow.getDeviceTriggerCard('airfryer_cooking_started').trigger(this, {
                program,
                remaining_time: remainingMinutes,
            }).catch(this.error);
        }

        if (liveCookStatus === 'completed') {
            await this.homey.flow.getDeviceTriggerCard('airfryer_cooking_completed').trigger(this, {
                program,
            }).catch(this.error);
        }
    }

    private getChamber(): number {
        const data = this.getData() as { chamber?: number | string };
        return Number(data.chamber ?? 1);
    }

    private getChamberStatus(statusList: IAirFryerStatusItem[]): IAirFryerStatusItem | undefined {
        return statusList.find((item) => item.chamber === this.getChamber());
    }

    private programIdToMode(programId: CookProgramId): string {
        switch (programId) {
            case 'airfry':
                return 'AirFry';
            case 'broil':
                return 'Broil';
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
            case 'steak':
                return 'Steak';
            case 'seafood':
                return 'Seafood';
            case 'veggies':
                return 'Veggies';
            case 'french_fries':
                return 'FrenchFries';
            case 'frozen':
                return 'Frozen';
            case 'chicken':
                return 'Chicken';
        }
    }

    private modeToProgramId(mode: string): AirFryerProgramId {
        switch (mode.toLowerCase().replace(/[\s_-]/g, '')) {
            case 'airfry':
                return 'airfry';
            case 'broil':
                return 'broil';
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
            case 'steak':
                return 'steak';
            case 'seafood':
                return 'seafood';
            case 'veggies':
                return 'veggies';
            case 'frenchfries':
                return 'french_fries';
            case 'frozen':
                return 'frozen';
            case 'chicken':
                return 'chicken';
            default:
                return 'mixed';
        }
    }

    private getDefaultProgram(): CookProgramId {
        return this.modeToProgramId(this.device.getDefaultMode()) as CookProgramId;
    }

    private isProgramSupported(programId: CookProgramId): boolean {
        return this.device.hasRecipeMode(this.programIdToMode(programId));
    }

    private assertProgramSupported(programId: CookProgramId): void {
        if (!this.isProgramSupported(programId)) {
            throw new Error(`Program not supported by this fryer: ${programId}`);
        }
    }
}
