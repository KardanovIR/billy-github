import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";

enum AccountTypes {
    USER = 'User',
    ORGANIZATION = 'Organization'
}

export interface IAccount {
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
    received_events_url: string

}


class Account extends Model {
    public id!: number;
    public login: string;
    public avatar: string;
    public type: string;
}

Account.init({
    login: {
        type: DataTypes.STRING,
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING
    },
    type: {
        type: DataTypes.ENUM(AccountTypes.USER, AccountTypes.ORGANIZATION),
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'account',
    paranoid: true
});

export default Account;

export {AccountTypes, Account};