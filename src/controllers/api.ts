"use strict";
import {Response, NextFunction, Router} from "express";
import {IIncomingRequest} from "IncomingRequest";
import logger from "../util/logger";
import {Op} from "sequelize";
import Bounty from "../models/Bounty";
import {IIssueParams} from "@waves/waves-transactions";
import {passport} from "./passport";
import axios from "axios";
import {BLOCKCHAIN_ASSET_ID, BLOCKCHAIN_NODE_URL} from "../util/secrets";

const ApiController = Router();

ApiController.use((req: IIncomingRequest, res: Response, next: NextFunction) => {
    logger.verbose(`Routing api request: ${req.uuid}`);
    next();
});

const checkUserIsAuthorized = (req: IIncomingRequest) => {
    return req.user && !req.user.authorizationRequired;
};


const getIssuesWithBounties = async (req: IIncomingRequest, res: Response) => {
    let filters: any = {};
    if (req.query.hasOwnProperty('active')) {
        filters['execution_tx_id'] = {
            [Op.eq]: !!req.query.active
        }
    }
    try {
        const bounties = await Bounty.findAll({
            where: filters,
            include: ['user']
        });
        logger.verbose(`Found bounties ${bounties.length}`);
        const issues: Map<number, { issue: IIssueParams, sum: number, plain_data: any, bounties: Array<any> }> = new Map();
        for (const bounty of bounties) {
            const bountyWithoutPlain = {
                repository_id: bounty.repository_id,
                issue_id: bounty.issue_id,
                issue_number: bounty.issue_number,
                sender_id: bounty.sender_id,
                recipient_id: bounty.recipient_id,
                url: bounty.url,
                amount: bounty.amount,
                transaction_id: bounty.transaction_id,
                execution_tx_id: bounty.execution_tx_id,
                user: {
                    avatar_url: bounty.user.avatar_url,
                    id: bounty.user.id,
                    login: bounty.user.login,
                    url: bounty.user.plain_data.html_url,
                    address: bounty.user.getAddress(),
                }
            };

            if (!issues.has(bounty.issue_id)) {
                issues.set(bounty.issue_id, {
                    issue: bounty.plain_data.issue,
                    plain_data: bounty.plain_data,
                    sum: bounty.amount,
                    bounties: [bountyWithoutPlain]
                })
            } else {
                const currentVal = issues.get(bounty.issue_id);
                currentVal.sum = currentVal.sum + bounty.amount;
                currentVal.bounties.push(bountyWithoutPlain);
                issues.set(bounty.issue_id, currentVal);
            }
        }
        res.json({
            message: 'ok',
            data: Array.from(issues.values())
        });
    } catch (e) {
        logger.error(`Error during API request ${req.uuid}`, e);
        res.status(502).json({
            message: e
        });
    }
}

const getUserBalance = async (req: IIncomingRequest, res: Response) => {
    if (!checkUserIsAuthorized(req)) {
        res.status(401).json({ok: false, message: "Unauthorized"});
        return;
    }

    logger.verbose(`Sending request to ${BLOCKCHAIN_NODE_URL}assets/balance/${req.user.address}/${BLOCKCHAIN_ASSET_ID}`);
    try{
        const balance = await axios.get(`${BLOCKCHAIN_NODE_URL}assets/balance/${req.user.address}/${BLOCKCHAIN_ASSET_ID}`)
        res.json({
            balance: balance.data,
            user: req.user
        });
    }catch (e) {
        logger.error(`Error during request`, e);
        res.sendStatus(502);
    }
}

ApiController.get('/v1/issues', getIssuesWithBounties);
ApiController.get('/v1/balance', passport.authenticate('jwt', {session: false}), getUserBalance);

export default ApiController;