import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import User from "./User";

export interface IMetric {
    repository_id: number,
    user_id: number,
    stars: number,
    forks: number,
    watchers: number,
    dependencies: number,
    date: string,
}

class Metric extends Model {
    public id!: number;
    public repository_id: number;
    public user_id: number;
    public stars: number;
    public forks: number;
    public watchers: number;
    public dependencies: number;
    public date: string;
}

Metric.init({
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Repository,
            key: 'id'
        }
    },
    stars: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    forks: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    watchers: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    dependencies: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['repository_id', 'date']
        }
    ],
    sequelize,
    modelName: 'metric',
    paranoid: true
});

export default Metric;