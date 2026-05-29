export const getErrorMessage = (reason: unknown): string => {
    if (reason instanceof Error && typeof reason.message === "string" && reason.message.length > 0) {
        return reason.message;
    }

    if (typeof reason === "string" && reason.length > 0) {
        return reason;
    }

    return "Unknown error";
};
