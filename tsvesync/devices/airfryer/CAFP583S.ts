import IApiResponse from "../../models/IApiResponse";
import IGetAirFryerMultiStatus, {IAirFryerStatusItem} from "../../models/airfryer/IGetAirFryerMultiStatus";
import {IAirFryerPreset} from "../../models/airfryer/IAirFryerPreset";
import IStartMultiCookPayload from "../../models/airfryer/IStartMultiCookPayload";
import BasicAirFryer from "../../lib/BasicAirFryer";

type DualBlazeStep = {
    cookSetTime?: number | string;
    cookLastTime?: number | string;
    cookTemp?: number | string;
    mode?: string;
    shakeTime?: number | string;
};

type DualBlazeStatus = {
    cookStatus?: string;
    currentTemp?: number | string;
    cookSetTemp?: number | string;
    tempUnit?: string;
    totalTimeRemaining?: number | string;
    stepArray?: DualBlazeStep[];
    stepIndex?: number | string;
};

type DualBlazePreset = {
    mode: string;
    recipeId: number;
    recipeName: string;
    recipeType: number;
    cookTempF: number;
    cookSetTime: number;
};

export default class CAFP583S extends BasicAirFryer {
    static deviceModels = ['CAF-P583S-KUS', 'CAF-P583S-KEU'];
    static defaultMode = 'AirFry';
    static methods = ['getAirfryerStatus', 'startCook', 'endCook', 'setTempUnit'];
    static recipeMeta = {
        AirFry: {recipeId: 14, recipeName: 'Air Fry', recipeType: 3},
        Broil: {recipeId: 17, recipeName: 'Broil', recipeType: 3},
        Roast: {recipeId: 13, recipeName: 'Roast', recipeType: 3},
        Bake: {recipeId: 9, recipeName: 'Bake', recipeType: 3},
        Reheat: {recipeId: 16, recipeName: 'Reheat', recipeType: 3},
        Steak: {recipeId: 1, recipeName: 'Steak', recipeType: 3},
        Seafood: {recipeId: 3, recipeName: 'Seafood', recipeType: 3},
        Veggies: {recipeId: 15, recipeName: 'Veggies', recipeType: 3},
        FrenchFries: {recipeId: 6, recipeName: 'French Fries', recipeType: 3},
        Frozen: {recipeId: 5, recipeName: 'Frozen', recipeType: 3},
        Chicken: {recipeId: 2, recipeName: 'Chicken', recipeType: 3},
    };

    private static readonly presets: DualBlazePreset[] = [
        {mode: 'AirFry', recipeId: 14, recipeName: 'Air Fry', recipeType: 3, cookTempF: 400, cookSetTime: 10 * 60},
        {mode: 'Broil', recipeId: 17, recipeName: 'Broil', recipeType: 3, cookTempF: 450, cookSetTime: 12 * 60},
        {mode: 'Roast', recipeId: 13, recipeName: 'Roast', recipeType: 3, cookTempF: 380, cookSetTime: 30 * 60},
        {mode: 'Bake', recipeId: 9, recipeName: 'Bake', recipeType: 3, cookTempF: 340, cookSetTime: 30 * 60},
        {mode: 'Reheat', recipeId: 16, recipeName: 'Reheat', recipeType: 3, cookTempF: 280, cookSetTime: 10 * 60},
        {mode: 'Steak', recipeId: 1, recipeName: 'Steak', recipeType: 3, cookTempF: 400, cookSetTime: 9 * 60},
        {mode: 'Seafood', recipeId: 3, recipeName: 'Seafood', recipeType: 3, cookTempF: 375, cookSetTime: 6 * 60},
        {mode: 'Veggies', recipeId: 15, recipeName: 'Veggies', recipeType: 3, cookTempF: 375, cookSetTime: 10 * 60},
        {mode: 'FrenchFries', recipeId: 6, recipeName: 'French Fries', recipeType: 3, cookTempF: 400, cookSetTime: 18 * 60},
        {mode: 'Frozen', recipeId: 5, recipeName: 'Frozen', recipeType: 3, cookTempF: 400, cookSetTime: 17 * 60},
        {mode: 'Chicken', recipeId: 2, recipeName: 'Chicken', recipeType: 3, cookTempF: 380, cookSetTime: 25 * 60},
    ];

    public async getAirFryerStatus(): Promise<IApiResponse<IGetAirFryerMultiStatus>> {
        const status = await this.post<DualBlazeStatus>('getAirfryerStatus', {});
        if (!status) throw new Error('Failed to get Dual Blaze air fryer status');
        if (status.msg === 'request success') {
            this.status = this.normalizeDualBlazeStatus(status.result?.result ?? {});
            return {
                ...status,
                result: {
                    ...status.result,
                    result: this.status
                }
            };
        }
        return status as unknown as IApiResponse<IGetAirFryerMultiStatus>;
    }

    public async getPresetRecipe(): Promise<IApiResponse<{ menu: IAirFryerPreset[] }>> {
        const tempUnit = this.status?.tempUnit === 'f' ? 'f' : 'c';
        this.presetRecipes = CAFP583S.presets.map((preset) => ({
            cookSetTime: preset.cookSetTime,
            cookTemp: tempUnit === 'f' ? preset.cookTempF : this.fahrenheitToCelsius(preset.cookTempF),
            mode: preset.mode,
            shakeTime: 0,
            tempUnit,
            allowModified: true,
        }));

        return {
            traceId: '',
            code: 0,
            msg: 'request success',
            result: {
                traceId: '',
                code: 0,
                result: {
                    menu: this.presetRecipes
                }
            }
        };
    }

    public async startMultiCook(payload: IStartMultiCookPayload): Promise<IApiResponse<any>> {
        const config = payload.cookConfigs[0];
        if (!config) {
            throw new Error('Missing cook configuration');
        }

        return this.post('startCook', {
            accountId: String(payload.accountId),
            hasWarm: false,
            mode: config.mode,
            readyStart: false,
            recipeId: config.recipeId,
            recipeName: config.recipeName,
            recipeType: config.recipeType,
            tempUnit: payload.tempUnit,
            startAct: {
                cookSetTime: config.cookSetTime,
                cookTemp: config.cookTemp,
                preheatTemp: 0,
                shakeTime: config.shakeTime ?? 0,
            },
            hasPreheat: 0,
            hasLinkage: false,
        });
    }

    public async setTempUnit(unit: 'c' | 'f'): Promise<IApiResponse<any>> {
        const response = await super.setTempUnit(unit);
        this.presetRecipes = [];
        return response;
    }

    public async endCook(chamber: number): Promise<IApiResponse<any>> {
        return this.post('endCook', {});
    }

    protected normalizeDualBlazeStatus(rawStatus: DualBlazeStatus): IGetAirFryerMultiStatus {
        const stepArray = Array.isArray(rawStatus.stepArray) ? rawStatus.stepArray : [];
        const stepIndex = this.numberValue(rawStatus.stepIndex);
        const step = stepArray[stepIndex] ?? stepArray[Math.max(0, stepIndex - 1)] ?? stepArray[0];
        const tempUnit = rawStatus.tempUnit === 'f' ? 'f' : 'c';
        const cookStatus = rawStatus.cookStatus ?? 'standby';
        const cookSetTime = this.numberValue(step?.cookSetTime);
        const totalTimeRemaining = this.numberValue(rawStatus.totalTimeRemaining);
        const cookLastTime = this.numberValue(step?.cookLastTime);
        const currentRemainingTime = totalTimeRemaining > 0 ? totalTimeRemaining : cookLastTime;
        const cookTemp = this.numberValue(step?.cookTemp, rawStatus.cookSetTemp);
        const mode = step?.mode ?? this.getDefaultMode();
        const recipeMeta = this.getRecipeMeta(mode);

        const statusList: IAirFryerStatusItem[] = [{
            cookStatus,
            startTime: 0,
            recipeType: this.numberValue(recipeMeta?.recipeType),
            recipeId: this.numberValue(recipeMeta?.recipeId),
            recipeName: recipeMeta?.recipeName ?? '',
            upc: '',
            holdTime: 0,
            cookSetTime,
            cookTemp,
            mode,
            currentRemainingTime,
            totalTimeRemaining: currentRemainingTime,
            chamber: 1,
        }];

        return {
            ...rawStatus,
            statusList,
            tempUnit,
            syncType: 0,
            workChamber: 1,
        };
    }

    private fahrenheitToCelsius(value: number): number {
        return Math.round((value - 32) * 5 / 9);
    }
}
