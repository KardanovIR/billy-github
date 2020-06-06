import {IRepository} from "../models/Repository";
import {GithubActionTypesEnum} from "../github/GithubActionTypesEnum";
import {IInstallation} from "IInstallation";
import {IUser} from "../models/User";

interface IGenericHook {
    uuid: string;
}

export interface IAuthHook extends IGenericHook {
    url: string;
}

export interface ISetupHook extends IGenericHook {}

export interface IEventHook extends IGenericHook {
    action: GithubActionTypesEnum,
    sender?: IUser,
    repositories?: Array<IRepository>
    installation?: IInstallation
}