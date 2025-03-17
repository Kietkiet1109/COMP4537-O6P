const express = require('express');
const router = express.Router();
const User = require('./user'); // Import your User model

// Admin Panel Route
router.get('/', (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied'); // Restrict access to admins only
    }
    console.log("User:" + req.user.username)
    console.log("Admin:" + req.user.isAdmin)
    res.render('admin', { 
        username: req.user.username, 
        isAdmin: req.user.isAdmin, // Pass isAdmin to the admin.ejs template
        searchResult: null, 
        searchAttempted: false 
    });
});

router.get('/admin', (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied'); // Restrict access to admins only
    }

    res.render('admin', { 
        username: req.user.username, 
        isAdmin: req.user.isAdmin, 
        searchResult: null, // Initialize as null since no search has been performed yet
        searchAttempted: false // Indicates no search has been attempted
    });
});

// Admin Search Route
router.get('/search', async (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied');
    }

    const { username } = req.query;

    try {
        const user = await User.findOne({ username: username.trim() }); // Search for user in the database
        if (user) {
            res.render('admin', { 
                username: req.user.username, 
                isAdmin: req.user.isAdmin, 
                searchResult: user, 
                searchAttempted: true 
            });
        } else {
            res.render('admin', { 
                username: req.user.username, 
                isAdmin: req.user.isAdmin, 
                searchResult: null, 
                searchAttempted: true 
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
