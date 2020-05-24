import {Logger as IWinstonLogger, LoggerOptions, transports, createLogger, format} from "winston";
import * as winston from "winston";
import * as path from "path";


class WinstonLogger {
    static create(logsPath: String): IWinstonLogger {
        const defaultLevel = process.env.LOG_LEVEL || 'verbose';
        const options: LoggerOptions = {
            exitOnError: false,
            level: defaultLevel,
            format: format.combine(
                format.timestamp(),
                format.json()
            ),
            transports: [
                new transports.File({
                    filename: path.resolve(logsPath + '/info.log'),
                    level: "info", // info and below to rotate
                }),
                new transports.File({
                    filename: path.resolve(logsPath + '/error.log'),
                    level: "error", // error and below to rotate
                }),
                new transports.File({
                    filename: path.resolve(logsPath + '/silly.log'),
                    // handleExceptions: true,
                    level: "silly", // error and below to rotate
                }),
                new winston.transports.File({
                    filename: path.resolve(logsPath + '/all.log'),
                    level: 'debug',
                    // handleExceptions: true,
                }),
            ],
        };

        const logger: IWinstonLogger = createLogger(options);

        if (process.env.NODE_ENV !== "prod") {
            logger.add(new transports.Console({
                level: "debug", // debug and below to console
            }));
        }

        logger.exceptions.handle(
            new transports.File({filename: path.resolve(logsPath + '/all.log')})
        );

        return logger;
    }
}

const logsPath = path.resolve(__dirname, '../../logs');
const logger = WinstonLogger.create(logsPath);

export default logger;
export {WinstonLogger, IWinstonLogger, logger};