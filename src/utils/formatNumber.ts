export function formatNumber(value: number): string {
    return value.toLocaleString('en-US');
}

export function formatMultiplier(value: number): string {
    return `${value.toFixed(2)}x`;
}

export function formatCoins(value: number): string {
    return `🪙 ${formatNumber(value)}`;
}
