import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";

enum AccountTypes {
    USER = 'user',
    ORGANIZATION = 'organization'
}

class Account extends Model {
};

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