import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";

class Repository extends Model {
};

Repository.init({
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
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

export default Repository;