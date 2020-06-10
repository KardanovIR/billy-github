import cron from "node-cron";
import {Op, QueryTypes} from "sequelize";
import logger from "../util/logger";
import User from "../models/User";
import sequelize from "../db/PostgresStore";
import {GET_USER_REPO_ACTIVITIES} from "../db/PlainQueries";
import {address} from '@waves/ts-lib-crypto'

import Reward from "../models/Reward";
import {
    BLOCKCHAIN_DAPP_ADDRESS,
    BLOCKCHAIN_DAPP_SEED,
    BLOCKCHAIN_NETWORK_BYTE,
    BLOCKCHAIN_NODE_URL
} from "../util/secrets";
import {queue} from "async";
import {broadcast, IInvokeScriptTransaction, invokeScript, waitForTx, WithId} from "@waves/waves-transactions";

interface IQueueTaskObject {
    transaction: IInvokeScriptTransaction & WithId,
    reward: Reward,
    name: string
}

const q = queue(async function (task: IQueueTaskObject, callback: Function) {
    try {
        await broadcast(task.transaction, BLOCKCHAIN_NODE_URL);
        await waitForTx(task.transaction.id, {
            apiBase: BLOCKCHAIN_NODE_URL
        });
        task.reward.update({
            transaction_id: task.transaction.id
        });
        logger.verbose(`Transaction ${task.transaction.id} for task ${task.name} was sent`);
        callback();
    } catch (e) {
        logger.error(`Error during reward queue execution: ${task.name}: `, e);
        task.reward.update({
            transaction_id: task.transaction.id
        });
        callback();
    }
}, 3);

q.drain(function () {
    logger.verbose('All items in rewards dropper queue has been drained');
});

q.error(function (err, task) {
    logger.error('Rewards dropper queue task error: ', err, task);
    console.error('Rewards dropper queue task error: ', err, task);
});


export class RewardsDropper {

    // Ak * sqrt(Rh)
    // Ak = activity  [1;2], где 1 - activities only today, 2 - was active 30 of 30 days before today
    // Rh = stars count + forks count
    static calculateTokensCount(stars: number, forks: number, activityDays: number): number {
        return Math.floor((1 + (1 / 30 * activityDays)) * Math.sqrt(stars + forks))
    }

    static async calculate(userId?: number) {
        let addedByUserFilter:any = {};
        if (userId){
            addedByUserFilter.id = userId;
        }

        const users = await User.findAll({
            where: {
                access_token: {
                    [Op.ne]: null
                },
                ...addedByUserFilter
            }
        });
        logger.verbose(`Found users to reward: ${users.length}`);
        try {
            for (const user of users) {
                logger.verbose(`Getting stats for ${user.login}`);
                const userStats = await sequelize.query(GET_USER_REPO_ACTIVITIES, {
                    replacements: {user_id: user.id},
                    type: QueryTypes.SELECT
                }) as Array<{ user_id: number, repository_id: number, t: string, activities: number | null, stars: number, forks: number }>;
                logger.verbose(`Found stats for ${user.login}: ${userStats.length}`);
                for (const activity of userStats) {
                    logger.verbose(`Activities amount for ${activity.repository_id}: ${activity.activities}`);
                    if (activity.activities === null || activity.activities === 0) continue;
                    const amount = RewardsDropper.calculateTokensCount(activity.stars, activity.forks, activity.activities);
                    logger.verbose(`Reward amount for ${activity.repository_id}: ${amount}`);
                    await Reward.create({
                        user_id: user.id,
                        repository_id: activity.repository_id,
                        date: activity.t,
                        amount: amount,

                        plain_data: {
                            ...activity,
                            amount,
                        }
                    });
                }
            }
        } catch (e) {
            logger.error(`Error while updating repositories`, e);
        }
    }

    static async drop(userId?: number) {
        let addedByUserFilter:any = {};
        if (userId){
            addedByUserFilter.user_id = userId;
        }

        const rewards = await Reward.findAll<Reward>({
            where: {
                transaction_id: {
                    [Op.eq]: null
                },
                amount: {
                    [Op.gt]: 0
                },
                ...addedByUserFilter
            },
            include: [User]
        });
        logger.info(`Fetched reward tasks: ${rewards.length}`);
        for (const reward of rewards) {
            const userAddress = address(reward.user.seed, BLOCKCHAIN_NETWORK_BYTE);
            const invokeScriptTx = invokeScript({
                dApp: BLOCKCHAIN_DAPP_ADDRESS,
                chainId: BLOCKCHAIN_NETWORK_BYTE,
                call: {
                    function: 'airdrop',
                    args: [
                        {type: "string", value: reward.date},
                        {type: "integer", value: reward.user_id},
                        {type: "integer", value: reward.repository_id},
                        {type: "string", value: userAddress},
                        {type: "integer", value: parseInt(reward.plain_data.activities)},
                        {type: "integer", value: reward.plain_data.stars},
                        {type: "integer", value: reward.plain_data.forks},
                        {type: "integer", value: reward.amount}
                    ]
                },
                payment: [],
                fee: 900000
            }, BLOCKCHAIN_DAPP_SEED);
            const taskName = `airdrop;user=${reward.user_id};repo=${reward.repository_id};date=${reward.date}`;
            q.push({
                transaction: invokeScriptTx,
                reward: reward,
                name: taskName
            }, err => {
                logger.error(`Error during task ${taskName} execution: `, err);
            });
        }
    }

    static async startCronJob() {
        cron.schedule('45 * * * *', async () => {
            await RewardsDropper.calculate();
        });
        cron.schedule('0 * * * *', async () => {
            await RewardsDropper.drop();
        });
    }
}

