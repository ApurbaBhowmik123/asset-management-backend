const tokenBlacklist: { [key: string]: number } = {};

export const addToBlacklist = (token: string, expiresAt: number) => {
    tokenBlacklist[token] = expiresAt;
};

export const isBlacklisted = (token: string): boolean => {
    return tokenBlacklist[token] !== undefined && tokenBlacklist[token] > Date.now();
};