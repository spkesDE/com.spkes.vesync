export interface IAirFryerStatusItem {
    cookStatus: string;
    startTime: number;
    recipeType: number;
    recipeId: number;
    recipeName: string;
    upc: string;
    holdTime: number;
    cookSetTime: number;
    cookTemp: number;
    mode: string;
    currentRemainingTime: number;
    totalTimeRemaining: number;
    chamber: number;
}

export default interface IGetAirFryerMultiStatus {
    statusList: IAirFryerStatusItem[];
    tempUnit: string;
    syncType: number;
    workChamber: number;
}
