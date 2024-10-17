const bunyan = require("bunyan");

// Create a logger and use in your app
export const logger = bunyan.createLogger({ name: "meminator", level: "info" });
logger.info({ "app.message": "OMG the logger exists" });
