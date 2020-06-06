"use strict";

import {Response, Request, NextFunction, Router} from "express";
import logger from "../util/logger";
import Hook, {HookTypes} from "../models/Hook";
import {IIncomingRequest} from "IncomingRequest";
import {IAuthHook, IEventHook, ISetupHook} from "Hooks";
import {GithubEventHook} from "../github/GithubEventHook";
import {GithubAPIConnector} from "../github/GithubAPIConnector";
import {GITHUB_ACCESS_TOKEN_EXCHANGE, GITHUB_API_BASE_URI, GITHUB_CLIENT_ID, GITHUB_SECRET} from "../util/secrets";
import {sendError} from "../util/requests";
import {HTTPStatusCodesEnum} from "../http/HTTPStatusCodesEnum";
import {ErrorTypesEnum} from "../util/InternalErrorCodes";
import User from "../models/User";
import {RepositoriesUpdater} from "../cron/metrics";
import {GithubAuth} from "../github/GithubAuth";

const GithubController = Router();
const githubAPIConnector = new GithubAPIConnector({
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
        res.redirect('/')
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
    const dataUpdateStatus = await githubEvent.handle();
    logger.verbose('Github event: ', eventHook);
};

GithubController.get('/auth', auth);
GithubController.post('/setup', setup);
GithubController.post('/events', events);
GithubController.get('/update', (req, res) => {
    RepositoriesUpdater.update(githubAPIConnector);
    res.send('asd');
});

export default GithubController;