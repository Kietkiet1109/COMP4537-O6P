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

// Admin Panel Route
router.get('/admin', (req, res) => {
    if (!req.isAuthenticated() || !req.user.isAdmin) {
        return res.status(403).send('Access Denied');
    }
    res.render('admin', { 
        username: req.user.username, 
        isAdmin: req.user.isAdmin, 
        searchResult: null, 
        searchAttempted: false 
    });
});


// Admin Search Route
router.get('/admin/search', async (req, res) => {
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

// Forgot password
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
