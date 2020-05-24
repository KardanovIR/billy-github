import {Model, DataTypes} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import MetricType from "./MetricType";

class Metric extends Model {
}

Metric.init({
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Repository,
            key: 'id'
        }
    },
    metric_type_id: {
        type: DataTypes.INTEGER,
        references: {
            model: MetricType,
            key: 'id'
        }
    },
    value: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'metric',
    paranoid: true
});

export default Metric;