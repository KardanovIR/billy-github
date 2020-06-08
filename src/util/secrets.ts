import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({path: ".env"});
} else {
    logger.debug("Using .env.example file to supply config environment variables");
    dotenv.config({path: ".env.example"});  // you can delete this after you create your own .env file!
}
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'

export const SESSION_SECRET = process.env["SESSION_SECRET"];

// Postgres variables
export const PG_HOST = process.env["PG_HOST"];
export const PG_DATABASE = process.env["PG_DATABASE"];
export const PG_PORT = process.env["PG_PORT"] ? parseInt(process.env["PG_PORT"]) : 5432;
export const PG_PASSWORD = process.env["PG_PASSWORD"];
export const PG_USERNAME = process.env["PG_USERNAME"];

// Github application variables
export const GITHUB_APP_ID = process.env["GITHUB_APP_ID"];
export const GITHUB_CLIENT_ID = process.env["GITHUB_CLIENT_ID"];
export const GITHUB_SECRET = process.env["GITHUB_SECRET"];
export const GITHUB_WEBHOOK_SECRET = process.env["GITHUB_WEBHOOK_SECRET"];
export const GITHUB_ACCESS_TOKEN_EXCHANGE = process.env["GITHUB_ACCESS_TOKEN_EXCHANGE"];
export const GITHUB_API_BASE_URI = process.env["GITHUB_API_BASE_URI"];
export const GITHUB_OCTOBILLY_TOKEN = process.env["GITHUB_OCTOBILLY_TOKEN"];

export const BLOCKCHAIN_NETWORK_BYTE = process.env["BLOCKCHAIN_NETWORK_BYTE"];
export const BLOCKCHAIN_INITIAL_SEED = process.env["BLOCKCHAIN_INITIAL_SEED"];
export const BLOCKCHAIN_DAPP_SEED = process.env["BLOCKCHAIN_DAPP_SEED"];
export const BLOCKCHAIN_DAPP_ADDRESS = process.env["BLOCKCHAIN_DAPP_ADDRESS"];
export const BLOCKCHAIN_NODE_URL = process.env["BLOCKCHAIN_NODE_URL"];
export const BLOCKCHAIN_ASSET_ID = process.env["BLOCKCHAIN_ASSET_ID"];


const requiredVariables = [
    "PG_HOST",
    "PG_DATABASE",
    "PG_USERNAME",
    "GITHUB_APP_ID",
    "GITHUB_CLIENT_ID",
    "GITHUB_SECRET",
    "GITHUB_WEBHOOK_SECRET"
];

if (!SESSION_SECRET) {
    logger.error("No client secret. Set SESSION_SECRET environment variable.");
    process.exit(1);
}

requiredVariables.forEach(variable => {
    if (!process.env[variable]) {
        logger.error(`Require env variable ${variable} not found. Set ${variable} environment variable first.`);
        process.exit(1);
    }
})
