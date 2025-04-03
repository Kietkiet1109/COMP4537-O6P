const express = require('express');
const router = express.Router();
const axios = require('axios'); // Forward requests to API server

const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3';

// 🔹 Helper function to retrieve JWT token from local storage
function getAuthHeaders() {
    const token = localStorage.getItem('authToken'); // Only access local storage in browser
    return token ? { Authorization: `Bearer ${token}` } : {};
}

// 🔹 Landing Page
router.get('/', (req, res) => {
    res.render('index');
});

// 🔹 Home Page
router.get('/home', async (req, res) => {
    res.render('home', { pageId: 'home-page', isAdmin: false });
    // const result = await axios.get(`${API_BASE}/admin`, { headers: getAuthHeaders() });
    // res.render('home', { pageId: 'home-page', isAdmin: result.data.isAdmin });
});

// 🔹 Admin Dashboard (Protected)
router.get('/admin', async (req, res) => {
    try {
        const result = await axios.get(`${API_BASE}/admin`, { headers: getAuthHeaders() });
        console.log("Am I an admin: " + result.data.isAdmin);
        res.render('admin', {
            username: result.data.username,
            isAdmin: result.data.isAdmin,
            users: result.data.users,
            apiStats: result.data.apiStats || [],
            pageId: 'admin-page'
        });
    } catch (err) {
        console.error('Admin route failed:', err.message);
        res.status(err.response?.status || 500).send('Access Denied');
    }
});

// 🔹 Admin Search (Protected)
router.get('/admin/search', async (req, res) => {
    try {
        const result = await axios.get(`${API_BASE}/admin`, { headers: getAuthHeaders(), params: { username: req.query.username } });
        res.render('admin',
            {
                username: result.data.username,
                isAdmin: result.data.isAdmin,
                users: result.data.users,
                searchResult: result.data.users.length > 0 ? result.data.users[0] : null,
                searchAttempted: true
            });
    }
    catch (err) {
        res.status(err.response?.status || 500).send('Access Denied');
    }
});

// 🔹 Toggle Admin Status (Protected)
router.post('/admin/toggle-admin', async (req, res) => {
    try {
        const result = await axios.patch(`${API_BASE}/admin`, req.body, { headers: getAuthHeaders() });
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Delete User (Protected)
router.delete('/admin/delete-user', async (req, res) => {
    try {
        const result = await axios.delete(`${API_BASE}/admin`, { headers: getAuthHeaders(), data: req.body });
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Forgot Password
router.post('/forgot', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/forgot`, req.body);
        res.json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json({ success: false, message: err.response?.data?.message || 'Error sending reset email.' });
    }
});

// 🔹 Reset Password Page (Render the form)
router.get('/reset/:token', (req, res) => {
    res.render('resetPassword', { token: req.params.token });
});

// 🔹 Login (Stores JWT)
router.post('/login', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/login`, req.body);
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Login failed.' });
    }
});

// 🔹 Signup (Stores JWT)
router.post('/signup', async (req, res) => {
    try {
        const result = await axios.post(`${API_BASE}/signup`, req.body);
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Signup failed.' });
    }
});

// 🔹 File Upload (Protected)
router.post('/api/v3', async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('audioFile', req.file);

        const result = await axios.post(`${API_BASE}/audio`, formData, {
            headers: {
                ...getAuthHeaders(req), // Attach JWT
                'Content-Type': 'multipart/form-data',
            }
        });

        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'File upload failed.' });
    }
});


module.exports = router;
