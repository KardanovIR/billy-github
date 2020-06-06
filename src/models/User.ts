import {Model, DataTypes, HasManyGetAssociationsMixin} from "sequelize";
import sequelize from "../db/PostgresStore";
import {AccountTypes} from "./Account";
import Repository from "./Repository";
import {IActor} from "../github/IFeedEvent";

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

class User extends Model {
    public id!: number;
    public login: string;
    public avatar_url: string;
    public seed: string;
    public access_token: string;
    public installation_id: string;

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