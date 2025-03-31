const express = require('express');
const router = express.Router();
const axios = require('axios'); // For forwarding requests to your API server

const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api';

router.get('/', (req, res) => {
    res.render('index');
});


router.get('/home', (req, res) => {
    res.render('home', {
        username: 'Guest',
        isAdmin: false
    });
});

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

// Forgot password
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
    try {
        const result = await axios.post(`${API_BASE}/forgot`, req.body);
        res.json(result.data);
    } catch (err) {
        res.status(err.response?.status || 500).json({ success: false, message: err.response?.data?.message || 'Error sending reset email.' });
    }
});

// Reset password page
router.get('/reset/:token', async (req, res) => {
    res.render('resetPassword', { token: req.params.token });
});


// Submit new password to API
router.post('/reset/:token', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/reset/${req.params.token}`, req.body);
        res.status(200).json(result.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Failed to reset password.' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/login`, req.body);
        res.status(200).json(result.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Login failed.' });
    }
});

// Signup → forward to API
router.post('/signup', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/signup`, req.body);
        res.status(200).json(result.data);
    } catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Signup failed.' });
    }
});

module.exports = router;
