import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";

class MetricType extends Model {
};

MetricType.init({
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
}, {
    sequelize,
    modelName: 'MetricType',
    paranoid: true
});

export default MetricType;