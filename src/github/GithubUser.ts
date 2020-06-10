import User, {IUser} from "../models/User";
import {seedUtils} from '@waves/waves-transactions';
import {IActor} from "./IFeedEvent";

export class GithubUser {

    private readonly data: IUser | IActor;

    constructor(userData: IUser | IActor) {
        this.data = userData;
    }

    async getModel(): Promise<IUser | IActor> {
        const user = await User.findByPk(this.data.id);
        const seed = user && user.get('seed') ? user.get('seed') as string : seedUtils.generateNewSeed(25);
        return {
            ...this.data,
            seed: seed,
            plain_data: {...this.data}
        }
    }

}