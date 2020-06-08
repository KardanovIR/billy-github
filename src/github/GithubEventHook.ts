import {IEventHook} from "Hooks";
import {IRepository} from "../models/Repository";
import {AbstractGithubHook} from "./AbstractGithubHook";
import Repository from "../models/Repository";
import Account from "../models/Account";
import {GithubActionTypesEnum} from "./GithubActionTypesEnum";
import {IInstallation} from "IInstallation";
import User, {IUser} from "../models/User";
import {GithubUser} from "./GithubUser";
import {IActor} from "./IFeedEvent";
import {Op} from "sequelize";
import {GithubAPIConnector, ReactionTypesEnum} from "./GithubAPIConnector";
import {GithubAuth} from "./GithubAuth";
import {
    BLOCKCHAIN_ASSET_ID,
    BLOCKCHAIN_DAPP_ADDRESS, BLOCKCHAIN_NETWORK_BYTE,
    BLOCKCHAIN_NODE_URL,
    GITHUB_OCTOBILLY_TOKEN
} from "../util/secrets";
import logger from "../util/logger";
import {stringToBytes, base58Encode} from '@waves/ts-lib-crypto'
import Bounty from "../models/Bounty";
import {broadcast, invokeScript, waitForTx} from "@waves/waves-transactions";


export class GithubEventHook extends AbstractGithubHook {

    private readonly data: IEventHook;
    private transferCommandRegex = /@octobilly (?<amount>\d+)\s*?.*?\s*?(?<recipient>@[\w\d_]+)/gim;
    private bountyCommandRegex = /@octobilly (?<amount>\d+) .*?/gim;


    constructor(event: IEventHook) {
        super();
        this.data = event;
    }

    getRepositories(): Array<IRepository> {
        const repositories = this.data.repositories ? this.data.repositories : [];
        return repositories.map((repo) => {
            repo.plain_data = {...repo};
            return repo;
        })
    }

    getInstallation(): IInstallation | null {
        if (this.data.action === GithubActionTypesEnum.Created) {
            const installation = this.data.installation;
            installation.plain_data = {...installation};
            return installation;
        } else {
            return null;
        }
    }

    async getSender(): Promise<IUser | IActor | null> {
        if (this.data.sender) {
            const sender = new GithubUser(this.data.sender);
            return await sender.getModel();
        } else {
            return null;
        }
    }

    async handle(): Promise<boolean> {
        const repositories = this.getRepositories();
        const installation = this.getInstallation();
        const sender = await this.getSender();

        sender.installation_id = installation && installation.id ? installation.id : null;

        const repositoriesWithUser = repositories.map(repo => {
            repo.added_by_user_id = sender.id;
            return repo;
        })
        try {
            if (sender) {
                await User.upsert(sender);
            }
            if (installation) {
                await Account.upsert(installation.account);
            }
            await Repository.bulkCreate(repositoriesWithUser,
                {
                    updateOnDuplicate: ["full_name"]
                });
            return true;
        } catch (e) {
            throw e;
        }
    }

    containsCommand() {
        if (this.data.comment) {
            return this.data.comment.body.indexOf('@octobilly') !== -1;
        } else if (this.data.issue) {
            return this.data.issue.body.indexOf('@octobilly') !== -1;
        } else return false
    }

    private async transferTokens(githubAPIConnector: GithubAPIConnector, senderUser: User, amount: number, recipientLogin: string) {
        let recipientUser = await User.findOne({
            where: {
                login: {
                    [Op.eq]: recipientLogin
                }
            }
        });
        if (!recipientUser) {
            logger.verbose(`[COMMAND] Found transfer, but recipient does not exist ${recipientLogin}`);
            const apiToken = await GithubAuth.getInstallationToken(this.data.installation.id.toString());
            logger.verbose(`[COMMAND] Got API token`);
            const userPublicInfo = await githubAPIConnector.getUserPublicInfo(recipientLogin, apiToken);
            logger.verbose(`[COMMAND] Got public info for user ${recipientLogin}, id=${userPublicInfo.id}`);
            [recipientUser] = await User.upsert(userPublicInfo, {returning: true});
        }
        logger.verbose(`[COMMAND] Recipient user exists now`);
        const reactionsUrl = this.getReactionUrl();
        const eventId = reactionsUrl.replace(/^\/repos\//, '').replace(/\/reactions$/, '');
        const eventIdBase58 = base58Encode(stringToBytes(eventId));
        await senderUser.sendTokens(amount, recipientUser.getAddress(), eventIdBase58);
        logger.verbose(`[COMMAND] Sent tokens from ${senderUser.login} to ${recipientLogin}`);
        logger.verbose(`[COMMAND] Adding rocket to ${reactionsUrl}`);
        await this.addRocket(githubAPIConnector);
        logger.verbose(`[COMMAND] Added rocket for entity ${reactionsUrl}`);
    }

    private addEyes(githubAPIConnector: GithubAPIConnector) {
        const reactionUrl = this.getReactionUrl();
        return githubAPIConnector.addReaction(reactionUrl, ReactionTypesEnum.Eyes, GITHUB_OCTOBILLY_TOKEN);
    }

    private addRocket(githubAPIConnector: GithubAPIConnector) {
        const reactionUrl = this.getReactionUrl();
        return githubAPIConnector.addReaction(reactionUrl, ReactionTypesEnum.Rocket, GITHUB_OCTOBILLY_TOKEN);
    }

    private addConfused(githubAPIConnector: GithubAPIConnector) {
        const reactionUrl = this.getReactionUrl();
        return githubAPIConnector.addReaction(reactionUrl, ReactionTypesEnum.Confused, GITHUB_OCTOBILLY_TOKEN);
    }

    private getReactionUrl(): string {
        if (this.data.comment) {
            if (this.data.issue) {
                return `/repos/${this.data.repository.full_name}/issues/comments/${this.data.comment.id}/reactions`
            } else if (this.data.pull) {
                return `/repos/${this.data.repository.full_name}/pulls/comments/${this.data.comment.id}/reactions`
            } else {
                return `/repos/${this.data.repository.full_name}/comments/${this.data.comment.id}/reactions`
            }
        } else if (this.data.issue) {
            return `/repos/${this.data.repository.full_name}/issues/${this.data.issue.number}/reactions`
        }
    }

    private async createBounty(githubAPIConnector: GithubAPIConnector, sender: User, amount: number,) {
        const senderBalance = await sender.getBalance();
        if (senderBalance < amount) {
            logger.verbose(`[BOUNTY] Cannot add bounty of ${amount} because of low balance ${senderBalance}`);
            return this.addConfused(githubAPIConnector);
        } else {
            try {
                const repositoryId = this.data.repository.id;
                const commentId = this.data.comment ? this.data.comment.id : null;
                const feeAmount = 9;
                const invokeTx = invokeScript({
                    dApp: BLOCKCHAIN_DAPP_ADDRESS,
                    call: {
                        function: "bonus",
                        args: [
                            {type: "integer", value: repositoryId},
                            {type: "integer", value: this.data.issue.id},
                            {type: "string", value: `;user=${sender.id};com=${commentId}`},
                        ]
                    },
                    fee: feeAmount,
                    feeAssetId: BLOCKCHAIN_ASSET_ID,
                    payment: [
                        {assetId: BLOCKCHAIN_ASSET_ID, amount: amount > feeAmount ? amount - feeAmount : amount}
                    ],
                    chainId: BLOCKCHAIN_NETWORK_BYTE
                }, sender.seed);
                logger.verbose(`[BOUNTY] Invoking dApp with the transaction: `, invokeTx);
                await broadcast(invokeTx, BLOCKCHAIN_NODE_URL);
                logger.verbose(`[BOUNTY] Invocation broadcasted for ${invokeTx.id}. Starting waiting for tx.`);
                await waitForTx(invokeTx.id, {apiBase: BLOCKCHAIN_NODE_URL});
                logger.verbose(`[BOUNTY] Invocation is in the blockchain`);

                await Bounty.create({
                    repository_id: this.data.repository.id,
                    issue_number: this.data.issue.number,
                    sender_id: sender.id,
                    recipient_id: null,
                    url: this.data.issue.url,
                    amount: amount,
                    transaction_id: invokeTx.id,
                    execution_tx_id: null,
                    plain_data: this.data
                });
                logger.verbose(`[BOUNTY] Bounty stored in the db`);
                await this.addEyes(githubAPIConnector);
            } catch (e) {
                logger.error(`[BOUNTY] Error during bounty creation: `, e);
            }
        }
    }

    async parseCommand(githubAPIConnector: GithubAPIConnector) {
        let body;
        logger.verbose(`[COMMAND] Parsing command from event`);
        if (this.data.comment) {
            logger.verbose(`[COMMAND] Has comment`);
            body = this.data.comment.body;
        } else if (this.data.issue) {
            logger.verbose(`[COMMAND] Has issue,not command`);
            body = this.data.issue.body;
        } else {
            logger.verbose(`[COMMAND] Has no command and issue`);
            body = '';
        }

        body = body.replace(/\s+/gmi, ' ');

        const foundTransfer = this.transferCommandRegex.exec(body);
        const foundBounty = this.bountyCommandRegex.exec(body);

        const senderUser = await User.findOne({
            where: {
                id: this.data.sender.id
            }
        });

        if (!foundTransfer && !foundBounty) {
            logger.verbose(`[COMMAND] Transfer and bonus not found`);
            return await this.addConfused(githubAPIConnector);
        }

        if (!senderUser.seed) {
            logger.verbose(`[COMMAND] Found, but user has no seed`);
            return await this.addConfused(githubAPIConnector);
        }
        const amount = foundTransfer ? parseInt(foundTransfer.groups.amount) : parseInt(foundBounty.groups.amount);
        if (isNaN(amount) || amount < 1) {
            logger.verbose(`[COMMAND] Amount has wrong value ${amount}`);
            return await this.addConfused(githubAPIConnector);
        }

        try {
            if (foundTransfer) {
                const recipient = foundTransfer.groups.recipient;
                const transferTokens = recipient.replace('@', '');
                logger.verbose(`[COMMAND] Found transfer for ${transferTokens}`);
                await this.transferTokens(githubAPIConnector, senderUser, amount, transferTokens)
            } else if (foundBounty) {
                await this.createBounty(githubAPIConnector, senderUser, amount);
            }
        } catch (e) {
            logger.error(`[COMMAND] Error during execution: `, e);
            await this.addConfused(githubAPIConnector);
            return;
        }
    }
}