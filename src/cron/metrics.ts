import cron from "node-cron";
import Repository from "../models/Repository";
import logger from "../util/logger";
import {WatchingRepository} from "../github/WatchingRepository";
import {GithubAPIConnector} from "../github/GithubAPIConnector";
import moment, {Moment} from "moment";
import {FeedEventTypesEnum, IPullRequestEvent} from "../github/IFeedEvent";
import {queue} from "async";
import Metric from "../models/Metric";
import RewardableEvent from "../models/RewardableEvent";
import User from "../models/User";
import {GithubUser} from "../github/GithubUser";
import {GithubActionTypesEnum} from "../github/GithubActionTypesEnum";

interface IQueueTaskObject {
    watchingRepository: WatchingRepository,
    mLastUpdateDate: Moment,
    name: string
}

const q = queue(async function (task: IQueueTaskObject, callback: Function) {
    // debugger;
    logger.debug(`Starting queue execution for task ${task.name}`);
    try {
        const feed = await task.watchingRepository.getFeed(task.mLastUpdateDate, [
            FeedEventTypesEnum.PullRequestEvent,
            FeedEventTypesEnum.PushEvent
        ]);
        // debugger;
        logger.debug(`Queue task for ${task.name} contains ${feed.length} events`);
        const repositoryStats = await task.watchingRepository.getStats();
        Metric.upsert({
            repository_id: task.watchingRepository.getRepository().id,
            stars: repositoryStats.stargazers_count,
            forks: repositoryStats.forks,
            watchers: repositoryStats.watchers_count,
            dependencies: repositoryStats.network_count,
            date: moment().format('YYYY-MM-DD'),
            plain_data: repositoryStats
        })
            .then(() => logger.verbose(`MetricData for repository ${task.watchingRepository.getRepository().full_name} updated`))
            .catch(error => logger.error(`MetricData update error for ${task.watchingRepository.getRepository().full_name}`, error));

        for (const event of feed) {
            let userData;
            if (event.type === FeedEventTypesEnum.PullRequestEvent) {
                const prEvent = event as IPullRequestEvent;
                // Pull request should be closed and merged
                if (prEvent.payload.action !== GithubActionTypesEnum.Closed
                    || prEvent.payload.pull_request.merged === false) continue;
                userData = prEvent.payload.pull_request.user;
            } else {
                userData = event.actor;
            }
            const user = new GithubUser(event.actor);
            const userInDb = await User.findByPk(event.actor.id)

            if (!userInDb) {
                logger.verbose(`Creating user in database: ${event.actor.id}`, event.actor);
                await User.create(await user.getModel());
            }
            RewardableEvent.upsert({
                id: event.id,
                type: event.type,
                repository_id: task.watchingRepository.getRepository().id,
                user_id: event.actor.id,
                date: event.created_at,
                plain_data: event
            });
        }
    } catch (e) {
        logger.error(`Error during task execution ${task.name}:`, e);
    }
    callback();
}, 3);

q.drain(function () {
    logger.verbose('All items in repository update queue has been drained');
});

q.error(function (err, task) {
    logger.error('Repository update task error: ', err, task);
    console.error('Repository update task error: ', err, task);
});

export class RepositoriesUpdater {

    static async update(githubApiConnector: GithubAPIConnector) {
        const repositories = await Repository.findAll({
            where: {
                private: false
            }
        });
        const usersMap = new Map();
        try {
            for (const repo of repositories) {
                let user = usersMap.get(repo.added_by_user_id);
                if (!user) {
                    user = await repo.getUser();
                    usersMap.set(repo.added_by_user_id, user);
                }
                const watchingRepository = new WatchingRepository(repo, user, githubApiConnector);
                const lastUpdateDate = await watchingRepository.getLastUpdateDate();
                const mLastUpdateDate = moment(lastUpdateDate).add(-1, "days");
                const name = `Repo-${repo.id}:User-${user.id}:Token-${user.access_token}`;
                q.push({mLastUpdateDate, watchingRepository, name}, function (err) {
                    console.error('Task callback error', err);
                });
            }
        } catch (e) {
            logger.error(`Error while updating repositories`, e);
        }
    }

    static async startCronJob(githubApiConnector: GithubAPIConnector) {
        cron.schedule('15 * * * *', async () => {
            await RepositoriesUpdater.update(githubApiConnector);
        });
    }
}

