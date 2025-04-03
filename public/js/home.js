const express = require('express');
const router = express.Router();
const axios = require('axios'); // Forward requests to API server

const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3';

// 🔹 Helper function to retrieve JWT token from local storage
function getAuthHeaders(req)
{
    const authHeader = req.headers.authorization; // Access authorization header
    if (!authHeader || !authHeader.startsWith("Bearer "))
    {
        console.error("Authorization token is missing or malformed:", authHeader);
        return {}; // Return empty headers to prevent errors
    }

    const token = authHeader.split(" ")[1];
    console.log("Extracted JWT token:", token); // Debugging log
    return { Authorization: `Bearer ${ token }` };
}

async function makeApiRequest(endpoint, options = {})
{
    try
    {
        const response = await fetch(`${ API_BASE }${ endpoint }`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ localStorage.getItem("authToken") }`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok)
        {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (err)
    {
        console.error(`API request failed (${ endpoint }):`, err.message);
        alert(err.message || 'An unexpected error occurred. Please try again.');
        return null;
    }
}

// 🔹 Landing Page
router.get('/', (req, res) => {
    res.render('index');
});

// 🔹 Home Page
router.get('/home', async (req, res) => {
    try {
        res.render('home', { pageId: 'home-page', isAdmin: false });
    } catch (err) {
        console.error("Error rendering home page:", err);
        res.status(500).send("Error rendering home page.");
    }
    // const result = await axios.get(`${API_BASE}/admin`, { headers: getAuthHeaders(req) });
    // res.render('home', { pageId: 'home-page', isAdmin: result.data.isAdmin });
});

router.get('/admin', async (req, res) => {
    try {
        console.log("Checking admin status...");
        
        // Fetch the current user data to check if they are an admin
        const data = await makeApiRequest('/currentUser', { method: 'GET' });
        const { username, isAdmin } = data.user;
        console.log("Am I an admin: " + isAdmin);

        // Fetch the list of users
        const usersResponse = await makeApiRequest('/users', { method: 'GET' });
        const users = usersResponse.data.users || [];

        // Fetch the API usage stats
        const statsResponse = await makeApiRequest('/api-stats', { method: 'GET' });
        const apiStats = statsResponse.data.apiStats || [];

        // Render the admin page with the data
        res.render('admin', {
            username: username,
            isAdmin: isAdmin,
            users: users,
            apiStats: apiStats,
            pageId: 'admin-page'
        });
    } catch (err) {
        console.error('Admin route failed:', err.message);
        res.status(err.response?.status || 500).send(`Access Denied: ${ err.message }`);
    }
});





// 🔹 Admin Dashboard (Protected)
// router.get('/admin', async (req, res) => {
//     try {
//         console.log("Checking admin status...");
//         const result = await axios.get(`${ API_BASE}/currentUser`, { headers: getAuthHeaders(req) });
//         console.log("Am I an admin: " + result.data.isAdmin);
//         res.render('admin', {
//             username: result.data.username,
//             isAdmin: result.data.isAdmin,
//             users: result.data.users || [],
//             apiStats: result.data.apiStats || [],
//             pageId: 'admin-page'
//         });
//     } catch (err) {
//         console.error('Admin route failed:', err.message);
//         res.status(err.response?.status || 500).send(`Access Denied: ${ err.message }`);
//     }
// });

// 🔹 Admin Search (Protected)
router.get('/admin/search', async (req, res) => {
    try {
        const result = await axios.get(`${API_BASE}/admin`, { headers: getAuthHeaders(req), params: { username: req.query.username } });
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
        const result = await axios.patch(`${API_BASE}/admin`, req.body, { headers: getAuthHeaders(req) });
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Delete User (Protected)
router.delete('/admin/delete-user', async (req, res) => {
    try {
        const result = await axios.delete(`${ API_BASE }/admin`, { headers: getAuthHeaders(req), data: req.body });
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
    catch (err) 
    {
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
