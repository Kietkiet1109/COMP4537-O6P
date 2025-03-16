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
    resetPassword: { type: String, unique: false, required: false },
    resetPasswordDate: { type: Date, unique: false, required: false },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
