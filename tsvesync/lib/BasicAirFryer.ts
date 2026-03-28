import IApiResponse from "../models/IApiResponse";
import BasicDevice from "./BasicDevice";
import IGetAirFryerMultiStatus from "../models/airfryer/IGetAirFryerMultiStatus";
import {IAirFryerPreset} from "../models/airfryer/IAirFryerPreset";
import IStartMultiCookPayload, {IAirFryerCookConfig} from "../models/airfryer/IStartMultiCookPayload";
import {IAirFryerRecipeMeta} from "../models/airfryer/IAirFryerRecipeMeta";

type AirFryerClass = typeof BasicAirFryer & {
    recipeMeta: Record<string, IAirFryerRecipeMeta>;
};

export default class BasicAirFryer extends BasicDevice {
    static recipeMeta: Record<string, IAirFryerRecipeMeta> = {};

    status: IGetAirFryerMultiStatus | null = null;
    presetRecipes: IAirFryerPreset[] = [];

    public async getAirFryerStatus(): Promise<IApiResponse<IGetAirFryerMultiStatus>> {
        const status = await this.post<IGetAirFryerMultiStatus>('getAirfryerMultiStatus', {});
        if (!status) throw new Error('Failed to get air fryer status');
        if (status.msg === 'request success') this.status = status.result.result;
        return status;
    }

    public async getPresetRecipe(): Promise<IApiResponse<{ menu: IAirFryerPreset[] }>> {
        const presets = await this.post<{ menu: IAirFryerPreset[] }>('getPresetRecipe', {});
        if (!presets) throw new Error('Failed to get air fryer presets');
        if (presets.msg === 'request success') {
            this.presetRecipes = presets.result.result.menu ?? [];
        }
        return presets;
    }

    public async startMultiCook(payload: IStartMultiCookPayload): Promise<IApiResponse<any>> {
        return this.post('startMultiCook', payload);
    }

    public async endCook(chamber: number): Promise<IApiResponse<any>> {
        return this.post('endCook', { chamber });
    }

    public async setTempUnit(unit: 'c' | 'f'): Promise<IApiResponse<any>> {
        return this.post('setTempUnit', { unit });
    }

    public getPreset(mode: string): IAirFryerPreset | undefined {
        return this.presetRecipes.find((preset) => preset.mode.toLowerCase() === mode.toLowerCase());
    }

    public buildCookConfig(mode: string, chamber: number): IAirFryerCookConfig {
        const preset = this.getPreset(mode);
        if (!preset) {
            throw new Error(`Preset not found for mode: ${mode}`);
        }

        const recipeMeta = this.getRecipeMeta(mode);
        if (!recipeMeta) {
            throw new Error(`Recipe metadata not found for mode: ${mode}`);
        }

        return {
            chamber,
            cookSetTime: preset.cookSetTime,
            cookTemp: preset.cookTemp,
            mode: preset.mode,
            recipeId: recipeMeta.recipeId,
            recipeName: recipeMeta.recipeName,
            recipeType: recipeMeta.recipeType,
            shakeTime: preset.shakeTime,
        };
    }

    protected getRecipeMeta(mode: string): IAirFryerRecipeMeta | undefined {
        const recipeMeta = (this.constructor as AirFryerClass).recipeMeta;
        const matchedKey = Object.keys(recipeMeta).find((key) => key.toLowerCase() === mode.toLowerCase());
        return matchedKey ? recipeMeta[matchedKey] : undefined;
    }
}
