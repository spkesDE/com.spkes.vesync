import BasicDevice from "./BasicDevice";

export default class BasicHumidifier extends BasicDevice   {
    static warm_levels: number[] | null = null;
    static levels: number[] = [];

    static hasLevel(level: number): boolean {
        return this.levels.includes(level);
    }

    static hasWarmLevel(level: number): boolean {
        if (this.warm_levels) {
            return this.warm_levels.includes(level);
        }
        return false;
    }
}