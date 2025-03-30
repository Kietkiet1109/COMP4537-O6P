const mongoose = require("mongoose");

/**
 * Mongoose schema for userAPI Usage logs.
 *
 * This schema tracks API requests made by users, including the user ID, endpoint, method, and timestamp.
 */
const apiUsageSchema = new mongoose.Schema({
    method: { type: String, required: true, enum: ["GET", "POST", "PUT", "DELETE"] },
    endpoint: { type: String, required: true },
    totalRequests: { type: Number, default: 0 },
});

const ApiUsage = mongoose.model("ApiUsage", apiUsageSchema);

module.exports = ApiUsage;