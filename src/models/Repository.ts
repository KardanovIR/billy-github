import {Model, DataTypes, HasManyGetAssociationsMixin, BelongsToGetAssociationMixin} from "sequelize";
import sequelize from "../db/PostgresStore";
import User from "./User";

export interface IRepository {
    id: number,
    name: string,
    node_id: string,
    private: boolean,
    full_name: string,
    added_by_user_id: number,
    plain_data?: IRepository
}

export interface IGithubRepoDetails {
    id: number,
    full_name: string,
    stargazers_count: number;
    watchers_count: number;
    forks: number;
    network_count: number;
    subscribers_count: number;
    language: string;
}

export class Repository extends Model {
    public id!: number;
    public added_by_user_id!: number;
    public full_name!: string;
    public name: string;
    public node_id: string;
    public private: boolean;

    public getUser: BelongsToGetAssociationMixin<User>;

}

Repository.init({
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    added_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    node_id: {
        type: DataTypes.STRING
    },
    private: {
        type: DataTypes.BOOLEAN
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'repository',
    paranoid: true
});

Repository.belongsTo(User, {foreignKey: 'added_by_user_id'})

export default Repository;