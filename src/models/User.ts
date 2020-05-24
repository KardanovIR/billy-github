import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";

class User extends Model {
};

User.init({
    login: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    avatar_url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    seed: {
        type: DataTypes.STRING,
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