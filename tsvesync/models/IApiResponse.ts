export default interface IApiResponse<T> {
    traceId: string;
    code: number;
    msg: 'request success' | 'device offline' | 'device timeout' | 'request failed' | string;
    module?: any;
    stacktrace?: any;
    result: {
        traceId: string;
        code: number;
        result: T;
    };
}