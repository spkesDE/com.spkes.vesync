export interface AuthByPWDOrOTMModel {
    accountID: number;
    avatarIcon: string;
    nickName: string;
    mailConfirmation: boolean;
    registerSourceDetail: string | null;
    registerAppVersion: string;
    registerTime: string;
    verifyEmail: string;
    accountLockTimeInSec: number | null;
    bizToken: string | null;
    mfaMethodList: string[] | null;
    authorizeCode: string;
    emailUpdateToSame: string;
    userType: string;
}
