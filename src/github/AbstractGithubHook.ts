import {Model} from "sequelize";

export abstract class AbstractGithubHook {
    abstract handle(): Promise<boolean>;
}