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


router.get('/home', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/');
    }

    res.render('home', {
        username: req.user.username, // Send the username
        isAdmin: req.user.isAdmin   // Send the isAdmin flag
    });
});

// Admin Panel Route
// router.get('/admin', (req, res) => {
//     if (!req.isAuthenticated() || !req.user.isAdmin) {
//         return res.status(403).send('Access Denied');
//     }
//     res.render('admin', { 
//         username: req.user.username, 
//         isAdmin: req.user.isAdmin, 
//         searchResult: null, 
//         searchAttempted: false 
//     });
// });
router.get('/admin', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied');
    }


    const { username } = req.query;
    let users = await User.find(); // Get all users if no search query
    let searchResult = null;
    let searchAttempted = false;
    try {

        if (username) {
            searchAttempted = true;
            searchResult = await User.findOne({ username: username.trim() }); // Search for a specific user in the database
        }

        console.log("Users retrieved:", users); // Debugging: Check if users exist
        res.render('admin', { 
            username: req.user.username, 
            isAdmin: req.user.isAdmin, 
            users: users, // Ensure users is passed here
            searchResult: searchResult || null, // Ensure searchResult is always defined
            searchAttempted: searchAttempted
        });
    } catch (err) {
        console.error("Database error:", err);
        res.status(500).send('Internal Server Error');
    }
});

// Admin Search Route
// router.get('/admin/search', async (req, res) => {
//     if (!req.isAuthenticated() || !req.user.isAdmin) {
//         return res.status(403).send('Access Denied');
//     }

//     const { username } = req.query;

//     try {
//         const user = await User.findOne({ username: username.trim() }); // Search for user in the database
//         if (user) {
//             res.render('admin', {
//                 username: req.user.username,
//                 isAdmin: req.user.isAdmin,
//                 searchResult: user,
//                 searchAttempted: true
//             });
//         } else {
//             res.render('admin', {
//                 username: req.user.username,
//                 isAdmin: req.user.isAdmin,
//                 searchResult: null,
//                 searchAttempted: true
//             });
//         }
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// });

router.get('/admin/search', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied');
    }

    const { username } = req.query;
    let users = await User.find(); // Get all users if no search query
    let searchResult = null;
    let searchAttempted = false;

    try {
        if (username) {
            searchAttempted = true;
            searchResult = await User.findOne({ username: username.trim() }); // Search for a specific user in the database
        }

        res.render('admin', {
            username: req.user.username,
            isAdmin: req.user.isAdmin,
            users: users,
            searchResult: searchResult || null, // Ensure searchResult is always defined
            searchAttempted: searchAttempted
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});



// Toggle Admin Status
// router.post('/admin/toggle-admin/:id', async (req, res) => {
//     if (!req.isAuthenticated() || !req.user.isAdmin) {
//         return res.status(403).send('Access Denied');
//     }

//     try {
//         const user = await User.findById(req.params.id);
//         if (!user) {
//             return res.status(404).send('User not found');
//         }

//         user.isAdmin = !user.isAdmin;
//         await user.save();
//         res.redirect('/admin');
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Internal Server Error');
//     }
// });
router.post('/admin/toggle-admin', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const { userId, makeAdmin } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        // Update user role in the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.isAdmin = !user.isAdmin;
        await user.save();

        res.json({ success: true, isAdmin: user.isAdmin });
    } catch (err) {
        console.error("Error toggling admin status:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete User
router.delete('/admin/delete-user', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).json({ success: false, message: "Access Denied" });
    }

    try {
        const { userId } = req.body; // Get userId from the request body

        if (!userId) {
            return res.status(400).json({ success: false, message: "Missing user ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await user.deleteOne(); // Delete the user
        res.json({ success: true, message: "User deleted successfully" });
    } catch (err) {
        console.error("Error deleting user:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
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
