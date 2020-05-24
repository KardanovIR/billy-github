import errorHandler from "errorhandler";

import app from "./app";
import sequelize from "./db/PostgresStore";
import logger from "./util/logger";

/**
 * Error Handler. Provides full stack
 */
app.use(errorHandler());

/**
 * Start Express server
 */

sequelize.sync({})
    .then(syncResult => {
        app.listen(app.get("port"), () => {
            logger.info(`App is running at http://localhost:${app.get("port")} in ${app.get("env")} mode`);
            logger.info("Press CTRL-C to stop\n");
        });
    })
    .catch((err) => {
        logger.error('Error during sequelize sync:', err);
    })
