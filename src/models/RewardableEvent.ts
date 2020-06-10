import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import User from "./User";
import {FeedEventTypesEnum} from "../github/IFeedEvent";


class RewardableEvent extends Model {
    public id!: string;
    public repository_id!: number;
    public user_id!: number;
    public type!: string;
    public date!: string;
}

RewardableEvent.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true
    },
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Repository,
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM,
        values: Object.values(FeedEventTypesEnum),
    },
    date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'rewardable_event',
    paranoid: true
});

export default RewardableEvent;