const bunyan = require("bunyan");

// Create a logger and use in your app
export const bunyanLogger = bunyan.createLogger({ name: "meminator", level: "info" });
bunyanLogger.info({ "app.message": "OMG the logger exists" });
