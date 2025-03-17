const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt");
const passport = require("passport");
const User = require('./user');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

router.get('/', (req, res) => {
    res.render('index');
});

// router.get('/home', (req, res) => {
//     if (!req.isAuthenticated()) {
//         return res.redirect('/');
//     }
//     res.render('home', { user: req.user });
// });

router.get('/home', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    const greeting = req.user.isAdmin ? `Admin ${req.user.username}` : req.user.username; // Add "Admin" if the user is an admin
    res.render('home', { greeting }); // Pass the greeting message to the frontend
});

router.post('/forgot', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(404).json({ success: false, message: "Couldn't find a user with that email!" });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPassword = resetToken;
    user.resetPasswordDate = Date.now() + 3600000;
    await user.save();

    const resetURL = `http://${req.headers.host}/reset/${resetToken}`;
    const sendEmail = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset",
        text: `You (or someone) has requested a password reset for LEGO Control. To reset the password, please click this link: ${resetURL}.\n\nIf this is not you, please ignore this email and your password will remain unchanged.`
    };

    transporter.sendMail(sendEmail, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, message: "Error sending email: " + error.message });
        }
        res.json({ success: true, message: "Password reset link sent to your email" });
    });
});


router.get('/reset/:token', async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).send("Invalid or expired token");
    }
    res.render('resetPassword', { token: req.params.token });
});


router.post('/reset/:token', async (req, res) => {
    const user = await User.findOne({
        resetPassword: req.params.token,
        resetPasswordDate: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    if (req.body.password !== req.body.confirmPassword) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    user.password = hashedPassword;

    user.resetPassword = crypto.randomBytes(20).toString('hex');
    user.resetPasswordDate = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password has been reset successfully" });
});

router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Internal server error" });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: info.message });
        }
        req.login(user, loginErr => {
            if (loginErr) {
                return res.status(500).json({ success: false, message: 'Internal server error' });
            }
            return res.status(200).json({ success: true });
        });
    })(req, res, next);
});


router.post('/signup', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Signup Failed: All fields are required.');
    }

    if (username.trim() === "" || email.trim() === "" || password.trim() === "") {
        return res.status(400).send('Signup Failed: All fields must be non-empty strings.');
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.json({ success: false, message: "User already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            isAdmin: false,
        });
        await newUser.save();
        req.login(newUser, loginErr => {
            if (loginErr) {
                return res.json({ success: false, message: "Error logging in." });
            }
            return res.json({ success: true });
        });
    } catch (err) {
        return res.json({ success: false, message: "Internal server error" });
    }
});

module.exports = router;
