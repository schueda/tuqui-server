import * as winston from 'winston';

class Logger {
    constructor(
    ) {
        this.defaultLogger = winston.createLogger({
            transports: ((): winston.transport[] => {
                const transports: winston.transport[] = [];

                transports.push(
                    new winston.transports.Console({
                        level: 'debug',
                        format: winston.format.combine(
                            winston.format.timestamp({ format: 'YY-MM-DD HH:mm:ss' }),
                            winston.format.printf(
                                (info) => `${info.timestamp as string} [${info.level}]: ${String(info.message)}`
                            ),
                            winston.format.colorize({
                                all: true,
                                colors: {
                                    error: 'red',
                                    warn: 'yellow',
                                    info: 'green',
                                    debug: 'white',
                                },
                            })
                        ),
                    })
                );

                return transports;
            })(),
        });
    }

    defaultLogger: winston.Logger;

    debug(message: string, metadata?: unknown): Logger {
        this.defaultLogger.debug(message, metadata);
        return this;
    }

    info(message: string, metadata?: unknown): Logger {
        this.defaultLogger.info(message, metadata);
        return this;
    }

    warn(message: string, metadata?: unknown): Logger {
        this.defaultLogger.warn(message, metadata);
        return this;
    }

    error(message: string, metadata?: unknown): Logger {
        this.defaultLogger.error(message, metadata);
        return this;
    }

    updateDefaultMetadata(label: string, value: boolean | string | number | Record<string, unknown>) {
        const meta = <Record<string, unknown>>this.defaultLogger.defaultMeta || {};
        meta[label] = value;
        this.defaultLogger.defaultMeta = meta;
    }
}

export const logger = new Logger();