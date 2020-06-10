import {Model, DataTypes, BelongsToGetAssociationMixin} from "sequelize";
import sequelize from "../db/PostgresStore";
import Repository from "./Repository";
import User from "./User";

class Bounty extends Model {
    public repository_id: number;
    public issue_id: number;
    public issue_number: number;
    public sender_id: number;
    public recipient_id: number;
    public url: string;
    public amount: number;
    public transaction_id: string;
    public execution_tx_id: string;
    public plain_data: any;

    public user?: User;
}

Bounty.init({
    repository_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Repository,
            key: 'id'
        }
    },
    issue_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    issue_number: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        },
        allowNull: true,
        defaultValue: null
    },
    url: {
        type: DataTypes.STRING,
        allowNull: true
    },
    amount: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    transaction_id: {
        type: DataTypes.STRING,
        allowNull: false
    },
    execution_tx_id: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
    },
    plain_data: {
        type: DataTypes.JSONB
    }
}, {
    sequelize,
    modelName: 'bounty',
    paranoid: true
});

Bounty.belongsTo(User, {foreignKey: 'sender_id'});

export default Bounty;