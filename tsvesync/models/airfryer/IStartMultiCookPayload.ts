export interface IAirFryerCookConfig {
    chamber: number;
    cookSetTime: number;
    cookTemp: number;
    mode: string;
    recipeId: number;
    recipeName: string;
    recipeType: number;
    shakeTime: number;
}

export default interface IStartMultiCookPayload {
    accountId: string | number;
    cookConfigs: IAirFryerCookConfig[];
    readyStart: boolean;
    syncType: number;
    tempUnit: string;
    workChamber: number;
}
