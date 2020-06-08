import {Model, DataTypes, HasManyGetAssociationsMixin} from "sequelize";
import sequelize from "../db/PostgresStore";
import {AccountTypes} from "./Account";
import Repository from "./Repository";
import {IActor} from "../github/IFeedEvent";
import {address} from '@waves/ts-lib-crypto'
import {assetBalance, broadcast, waitForTx} from "@waves/waves-transactions/dist/nodeInteraction";
import {BLOCKCHAIN_ASSET_ID, BLOCKCHAIN_NETWORK_BYTE, BLOCKCHAIN_NODE_URL} from "../util/secrets";
import {transfer} from "@waves/waves-transactions";

export interface IUser {
    id: number,
    url: string,
    type: AccountTypes,
    login: string,
    node_id: string,
    html_url: string,
    gists_url: string,
    repos_url: string,
    avatar_url: string,
    events_url: string,
    site_admin: boolean,
    gravatar_id: string,
    starred_url: string,
    followers_url: string,
    following_url: string,
    organizations_url: string,
    subscriptions_url: string,
    received_events_url: string,
    seed?: string,
    access_token?: string,
    plain_data?: IUser | IActor
    installation_id: number
}

export class User extends Model {
    public id!: number;
    public login: string;
    public avatar_url: string;
    public seed: string;
    public access_token: string;
    public installation_id: string;

    public async sendTokens(amount: number, recipient: string, attachment?: string) {
        const transferTx = transfer({
            recipient: recipient,
            amount: amount,
            assetId: BLOCKCHAIN_ASSET_ID,
            fee: 1,
            feeAssetId: BLOCKCHAIN_ASSET_ID,
            attachment:  attachment
        }, this.seed);
        await broadcast(transferTx, BLOCKCHAIN_NODE_URL);
        await waitForTx(transferTx.id, {apiBase: BLOCKCHAIN_NODE_URL});
    }

    public getAddress(){
        return address(this.seed, BLOCKCHAIN_NETWORK_BYTE);
    }

    public async getBalance() {
        return await assetBalance(BLOCKCHAIN_ASSET_ID, this.getAddress(), BLOCKCHAIN_NODE_URL);
    }

    public getRepositories: HasManyGetAssociationsMixin<Repository>;
}

User.init({
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true
    },
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    seed: {
        type: DataTypes.STRING,
        allowNull: true
    },
    access_token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    installation_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'user',
    paranoid: true
});


export default User;