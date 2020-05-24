import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import User from "./User";

class Bounty extends Model {
}

Bounty.init({
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Repository,
            key: 'id'
        }
    },
    sender_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    recipient_id: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    executed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'bounty',
    paranoid: true
});

export default Bounty;