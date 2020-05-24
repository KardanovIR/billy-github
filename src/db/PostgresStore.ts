import {PG_DATABASE, PG_HOST, PG_PASSWORD, PG_PORT, PG_USERNAME} from "../util/secrets";
import {logger} from "../util/logger";
import {ConnectionError, Sequelize} from "sequelize";
import fs from 'fs';
import path from 'path';


const sequelize = new Sequelize(PG_DATABASE, PG_USERNAME, PG_PASSWORD, {
    host: PG_HOST,
    port: PG_PORT,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    dialect: 'postgres'
})

sequelize
    .authenticate()
    .then(() => {
        logger.verbose(`Connection with the database ${PG_DATABASE} on ${PG_HOST}:${PG_PORT} as ${PG_USERNAME} has been established successfully.`);
    })
    .catch((err: ConnectionError) => {
        logger.error(`Unable to connect to the database ${PG_DATABASE} on ${PG_HOST}:${PG_PORT} as ${PG_USERNAME}: `, err);
    });

export default sequelize;