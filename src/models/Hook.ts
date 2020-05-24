import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import User from "./User";

class Hook extends Model {
}

export enum HookTypes {
    'AUTH' = 'auth',
    'EVENT' = 'event',
    'SETUP' = 'setup',
}

Hook.init({
    type: {
        type: DataTypes.ENUM(HookTypes.AUTH, HookTypes.EVENT, HookTypes.SETUP)
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'hook',
    paranoid: true
});

export default Hook;