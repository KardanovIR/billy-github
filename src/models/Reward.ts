import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import {User} from "./User";

class Reward extends Model {
    public id!: number;
    public repository_id: number;
    public user_id: number;
    public amount: number;
    public date: string;
    public plain_data: {
        t: string,
        forks: number,
        stars: number,
        amount: number,
        user_id: number,
        activities: string,
        repository_id: number
    };
    public transaction_id: string;

    public readonly user?: User; // Note this is optional since it's only populated when explicitly requested in code


}

Reward.init({
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'repository',
            key: 'id'
        }
    },
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'user',
            key: 'id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    indexes: [
        {
            unique: true,
            fields: ['user_id', 'repository_id', 'date']
        }
    ],
    modelName: 'reward',
    paranoid: true
});

Reward.belongsTo(User, {foreignKey: 'user_id'});

export default Reward;