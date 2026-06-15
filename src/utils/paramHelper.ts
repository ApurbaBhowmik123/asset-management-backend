/**
 * Helper to safely extract string values from Express params/query that might be arrays
 */
export const getSafeString = (value: string | string[] | undefined, defaultValue = ""): string => {
    if (!value) return defaultValue;
    if (Array.isArray(value)) return value[0];
    return value;
};

/**
 * Helper to safely extract a string that could be undefined
 */
export const getSafeStringOrUndefined = (value: string | string[] | undefined): string | undefined => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value[0];
    return value;
};
