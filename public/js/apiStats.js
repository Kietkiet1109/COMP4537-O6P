const mongoose = require("mongoose");


/**
 * Mongoose schema for API Usage stats.
 *
 * This schema tracks total API requests made by users, including the endpoint, total requests.
 */
const apiStatsSchema = new mongoose.Schema({
    method: { type: String, required: true, enum: ["GET", "POST", "PUT", "DELETE"] },
    endpoint: { type: String, required: true },
    totalRequests: { type: Number, default: 0 },
});

const ApiStats = mongoose.model("ApiStats", apiStatsSchema);
module.exports = ApiStats;