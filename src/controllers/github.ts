"use strict";

import {NextFunction, Response, Router} from "express";
import logger from "../util/logger";
import Hook, {HookTypes} from "../models/Hook";
import {IIncomingRequest} from "IncomingRequest";
import {IAuthHook, IEventHook, ISetupHook} from "Hooks";
import {GithubEventHook} from "../github/GithubEventHook";
import {GithubAPIConnector} from "../github/GithubAPIConnector";
import {
    ENVIRONMENT,
    GITHUB_ACCESS_TOKEN_EXCHANGE,
    GITHUB_API_BASE_URI,
    GITHUB_CLIENT_ID,
    GITHUB_SECRET,
    PASSPORT_SECRET
} from "../util/secrets";

import {sendError} from "../util/requests";
import {HTTPStatusCodesEnum} from "../http/HTTPStatusCodesEnum";
import {ErrorTypesEnum} from "../util/InternalErrorCodes";
import User from "../models/User";
import {RepositoriesUpdater} from "../cron/metrics";
import {GithubAuth} from "../github/GithubAuth";
import {RewardsDropper} from "../cron/rewards";
import {GithubActionTypesEnum} from "../github/GithubActionTypesEnum";

const GithubController = Router();
const jwt = require('jsonwebtoken');

export const githubAPIConnector = new GithubAPIConnector({
    clientId: GITHUB_CLIENT_ID,
    clientSecret: GITHUB_SECRET,
    apiBaseURI: GITHUB_API_BASE_URI,
    accessTokenExchangeURI: GITHUB_ACCESS_TOKEN_EXCHANGE,
})

GithubController.use((req: IIncomingRequest, res: Response, next: NextFunction) => {
    logger.verbose(`Routing github request: ${req.uuid}`);
    next();
});


const auth = async (req: IIncomingRequest, res: Response) => {
    const authHook = {...req.body, uuid: req.uuid, url: req.url} as IAuthHook;
    const authCode = req.query.code;
    const installationId = req.query.installation_id;

    logger.verbose('Github auth: ', authHook);

    Hook.create({type: HookTypes.AUTH, plain_data: authHook})
        .catch(e => logger.error(`Can't save github auth:`, e));

    if (!authCode || typeof authCode !== 'string'
        || !installationId || typeof installationId !== 'string') {
        return sendError(res, req, {
            statusCode: HTTPStatusCodesEnum.BAD_REQUEST,
            code: ErrorTypesEnum.BAD_AUTH_ARGUMENTS,
            message: 'Parameters `code` and `installation_id` is required and should be a string'
        })
    }

    try {
        const oauthToken = await GithubAuth.getOauthToken(installationId, authCode);
        const userDetails = await githubAPIConnector.getUser(oauthToken.token);
        await User.update({access_token: oauthToken.token}, {where: {id: userDetails.id}});
        const userInDb = await User.findByPk(userDetails.id);
        const payload = {
            user: {
                name: userDetails.login,
                id: userDetails.id
            },
            address: userInDb.getAddress(),
            accessToken: userDetails.access_token,
            expires: Date.now() + (10 * 365 * 24 * 60 * 60)
        };

        logger.verbose(`Setting auth token:`, payload);

        /** generate a signed json web token and return it in the response */
        const token = jwt.sign(payload, PASSPORT_SECRET);
        await RepositoriesUpdater.update(githubAPIConnector, userInDb.id);

        await RewardsDropper.calculate(userInDb.id);
        await RewardsDropper.drop(userInDb.id);
        res.cookie('jwt', token, {
            httpOnly: ENVIRONMENT === 'production',
            secure: ENVIRONMENT === 'production'
        }).redirect('/')
    } catch (e) {
        logger.error(`Access token exchange error: `, e);
        return sendError(res, req, {
            statusCode: HTTPStatusCodesEnum.INTERNAL_ERROR,
            code: ErrorTypesEnum.OAUTH_FLOW_ERROR,
            message: e.toString(),
            ...e
        })

    }
};

const setup = (req: IIncomingRequest, res: Response, next: NextFunction) => {
    const setupHook = req.body as ISetupHook;
    Hook.create({type: HookTypes.SETUP, plain_data: setupHook})
        .catch(e => logger.error(`Can't save github setup:`, e));

    console.log('Github setup: ', setupHook);
    logger.verbose('Github setup: ', setupHook);
};

const events = async (req: IIncomingRequest, res: Response, next: NextFunction) => {
    const eventHook = req.body as IEventHook;

    console.log('Github event: ', eventHook);
    Hook.create({type: HookTypes.EVENT, plain_data: eventHook})
        .catch(e => logger.error(`Can't save github event:`, e));
    const githubEvent = new GithubEventHook(eventHook);
    if (githubEvent.containsCommand() &&
        (eventHook.action === GithubActionTypesEnum.Created || eventHook.action === GithubActionTypesEnum.Opened)) {
        githubEvent.parseCommand(githubAPIConnector)
            .catch(err => logger.error(`[COMMAND] parsing error`, err));
    } else if (eventHook.issue && eventHook.action === GithubActionTypesEnum.Closed) {
        githubEvent.finalizeBounties(githubAPIConnector)
            .catch(err => logger.error(`[COMMAND] parsing error`, err));
    } else {
        const dataUpdateStatus = await githubEvent.handle();
    }
    logger.verbose('Github event: ', eventHook);
    res.sendStatus(200);
};

const updateRepositories = async (req: IIncomingRequest, res: Response) => {
    try {
        await RepositoriesUpdater.update(githubAPIConnector);
    } catch (e) {

    }
    res.send('asd');
}

const calculateRewards = async (req: IIncomingRequest, res: Response) => {
    try {
        await RewardsDropper.calculate();
    } catch (e) {

    }
    res.send('asd');
}

const dropRewards = async (req: IIncomingRequest, res: Response) => {
    try {
        await RewardsDropper.drop();
    } catch (e) {

    }
    res.send('asd');
}

GithubController.get('/auth', auth);
GithubController.post('/setup', setup);
GithubController.post('/events', events);
GithubController.get('/update', updateRepositories);
GithubController.get('/calculate-rewards', calculateRewards);
GithubController.get('/drop-rewards', dropRewards);

export default GithubController;