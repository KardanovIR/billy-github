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

export class GithubEventHook extends AbstractGithubHook {

    private readonly data: IEventHook;

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

        sender.installation_id = installation.id;

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


}