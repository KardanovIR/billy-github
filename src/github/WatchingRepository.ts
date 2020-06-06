import User, {IUser} from "../models/User";
import Metric, {IMetric} from "../models/Metric";
import Repository, {IGithubRepoDetails, IRepository} from "../models/Repository";
import {GithubAPIConnector} from "./GithubAPIConnector";
import moment, {Moment} from "moment";
import {FeedEventTypesEnum, IGenericFeedEvent} from "./IFeedEvent";
import {doWhilst} from 'async';
import {GithubAuth} from "./GithubAuth";
import logger from "../util/logger";


export class WatchingRepository {

    private readonly repository: Repository;
    private readonly user: User;
    private readonly githubApiConnector: GithubAPIConnector;

    constructor(repository: Repository, user: User, githubApiConnector: GithubAPIConnector) {
        this.repository = repository;
        this.user = user;
        this.githubApiConnector = githubApiConnector;
    }

    async getLastUpdateDate() {
        const lastActionDate = await Metric.findOne({
            attributes: ['date'],
            where: {
                repository_id: this.repository.id
            }
        });
        if (lastActionDate) {
            return moment(lastActionDate.date).add(-30, "days");
        } else {
            return moment().add(-30, 'days');
        }
    }

    async getFeed(laterThan: Moment, eventTypes: Array<FeedEventTypesEnum>): Promise<Array<IGenericFeedEvent>> {
        let page = 0;
        let events: Array<IGenericFeedEvent> = [];
        let installationToken: string = null;
        try{
            const installationAuth = await GithubAuth.getInstallationToken(this.user.installation_id);
            installationToken = installationAuth.token;
        }catch (e) {
            logger.error(`Can't get installation token`, e);
        }
        return new Promise(async (resolve) => {
            doWhilst(async (cb: Function) => {
                const repoEvents = await this.githubApiConnector.getRepoFeed(this.repository, page, installationToken)
                page++;
                events = events.concat(repoEvents);
                cb();
            }, (callback: Function) => {
                const result = events.length === 100 && moment(events[events.length - 1].created_at).unix() < laterThan.unix();
                callback(null, result);
                return result;
            }, () => {
                resolve(events.filter(event => eventTypes.indexOf(event.type) !== -1));
            });
        });
    }


    async getStats(): Promise<IGithubRepoDetails> {
        return await this.githubApiConnector.getRepoStats(this.repository, this.user.access_token);
    }

    getRepository(): Repository {
        return this.repository;
    }

    getUser(): User {
        return this.user;
    }


}