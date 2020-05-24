"use strict";

import {Response, Request, NextFunction, Router} from "express";
import logger from "../util/logger";
import Hook, {HookTypes} from "../models/Hook";
import {IIncomingRequest} from "IncomingRequest";
import {IAuthHook, IEventHook, ISetupHook} from "Hooks";

const GithubController = Router();

GithubController.use((req: IIncomingRequest, res: Response, next: NextFunction) => {
    logger.verbose(`Routing github request: ${req.uuid}`);
    next();
});


const auth = (req: Request, res: Response) => {
    const authHook = req.body as IAuthHook;
    console.log('Github auth: ', authHook);
    Hook.create({type: HookTypes.AUTH, plain_data: authHook});
    // Account.create({
    //     login: authHook.
    // })
    logger.verbose('Github auth: ', authHook);
};

const setup = (req: Request, res: Response, next: NextFunction) => {
    const setupHook = req.body as ISetupHook;
    Hook.create({type: HookTypes.SETUP, plain_data: setupHook});

    console.log('Github setup: ', setupHook);
    logger.verbose('Github setup: ', setupHook);
};

const events = (req: Request, res: Response, next: NextFunction) => {
    const eventHook = req.body as IEventHook;

    console.log('Github event: ', eventHook);
    Hook.create({type: HookTypes.EVENT, plain_data: eventHook});

    logger.verbose('Github event: ', eventHook);
};

GithubController.post('/auth', auth);
GithubController.post('/setup', setup);
GithubController.post('/events', events);

export default GithubController;