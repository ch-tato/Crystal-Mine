type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

function timestamp(): string {
    return new Date().toISOString();
}

function log(level: LogLevel, context: string, message: string, data?: unknown): void {
    const prefix = `[${timestamp()}] [${level}] [${context}]`;
    if (data !== undefined) {
        console.log(`${prefix} ${message}`, data);
    } else {
        console.log(`${prefix} ${message}`);
    }
}

export const logger = {
    info: (context: string, message: string, data?: unknown) =>
        log('INFO', context, message, data),
    warn: (context: string, message: string, data?: unknown) =>
        log('WARN', context, message, data),
    error: (context: string, message: string, data?: unknown) =>
        log('ERROR', context, message, data),
    debug: (context: string, message: string, data?: unknown) =>
        log('DEBUG', context, message, data),
};
