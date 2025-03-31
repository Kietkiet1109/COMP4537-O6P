const mongoose = require("mongoose");

/**
 * Mongoose schema for User.
 * 
 * This schema defines the structure of the User document, including fields for username, name, email, password,
 * password reset tokens and dates.
 */
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, required: false, default: false},
    resetPassword: { type: String, unique: false, required: false },
    resetPasswordDate: { type: Date, unique: false, required: false },
    apiKey: { type: String, required: false, unique: true },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
