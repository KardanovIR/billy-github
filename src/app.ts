import {Response, Request} from 'express';
import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import lusca from "lusca";

// Controllers (route handlers)
import GithubController, {githubAPIConnector} from "./controllers/github";
import ApiController from "./controllers/api";
import {requestUuid} from "./util/requests";
import {passport} from "./controllers/passport";
import {RewardsDropper} from "./cron/rewards";
import {RepositoriesUpdater} from "./cron/metrics";
import logger from "./util/logger";

const port = process.env.PORT || 9716;
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Create server
const app = express();

// Express configuration
app.set("port", port);
app.use(cookieParser());
app.use(passport.initialize());
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(lusca.xframe("SAMEORIGIN"));
app.use(requestUuid);
app.use(cors());
app.use('/', express.static(path.resolve(__dirname, '../ui/')));

app.use("/github", GithubController);
app.use("/api", ApiController);
app.get("/auth", (req: Request, res: Response) => {
    res.redirect('https://github.com/apps/octobilly/installations/new');
});

try{
    RewardsDropper.startCronJob();
    RepositoriesUpdater.startCronJob(githubAPIConnector);
}catch (e) {
    logger.error(`Error during cron jobs init:`, e);
}

export default app;
