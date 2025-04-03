const express = require('express');
const router = express.Router();
const axios = require('axios'); // Forward requests to API server
require("dotenv").config();

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

// async function makeApiRequest(endpoint, options = {})
// {
//     try
//     {
//         const response = await fetch(`${ process.env.API_BASE }${ endpoint }`, {
//             ...options,
//             headers: {
//                 'Content-Type': 'application/json',
//                 "Authorization": `Bearer ${ localStorage.getItem("authToken") }`,
//                 ...options.headers
//             }
//         });

//         const data = await response.json();

//         if (!response.ok)
//         {
//             throw new Error(data.message || 'API request failed');
//         }

//         return data;
//     } catch (err)
//     {
//         console.error(`API request failed (${ endpoint }):`, err.message);
//         // alert(err.message || 'An unexpected error occurred. Please try again.');
//         return null;
//     }
// }

async function makeApiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${process.env.API_BASE}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ localStorage.getItem("authToken") }`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (err) {
        console.error(`API request failed (${endpoint}):`, err.message);
        return { success: false, message: err.message };  // Return a default object with failure status
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
    // const result = await axios.get(`${process.env.API_BASE}/admin`, { headers: getAuthHeaders(req) });
    // res.render('home', { pageId: 'home-page', isAdmin: result.data.isAdmin });
});

// router.get('/admin', async (req, res) =>
// {
//     try
//     {
//         console.log("Checking admin status...");
//         const params = req.query;
//         console.log("Received query parameters:", params);

//         // Set CSP Header **ONLY for the Admin Page**
//         // res.setHeader("Content-Security-Policy",
//         //     "default-src 'self'; " +
//         //     "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; " +
//         //     "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; " +
//         //     "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://code.jquery.com; " +
//         //     "img-src 'self' data: blob: https://comp4537-project-5ddxc.ondigitalocean.app;"
//         // );

//         // Ensure query params are handled safely
//         res.render('admin', {
//             username: params.username || "Unknown User",
//             isAdmin: params.isAdmin === "true",
//             users: params.users ? JSON.parse(params.users) : [],
//             apiStats: params.apiStats ? JSON.parse(params.apiStats) : [],
//             searchResult: null,
//             searchAttempted: true,
//             pageId: 'admin-page'
//         });

//     } catch (err)
//     {
//         console.error("Admin route failed:", err.message);
//         res.status(err.response?.status || 500).send(`Access Denied: ${ err.message }`);
//     }
// });


router.get('/admin', async (req, res) =>
{
    try
    {
        console.log("Checking admin status...");
        const params = req.query;
        console.log("Received query parameters:", params);

        res.setHeader("Content-Type", "application/json"); // Ensure response is JSON
        res.json({
            success: true,
            username: params.username || "Unknown User",
            isAdmin: params.isAdmin === "true",
            users: params.users ? JSON.parse(params.users) : [],
            apiStats: params.apiStats ? JSON.parse(params.apiStats) : []
        });

    } catch (err)
    {
        console.error("Admin route failed:", err.message);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});



// 🔹 Admin Search (Protected)
router.get('/admin/search', async (req, res) => {
    try {
        const result = await axios.get(`${process.env.API_BASE}/admin`, { headers: getAuthHeaders(req), params: { username: req.query.username } });
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
        const result = await axios.patch(`${process.env.API_BASE}/admin`, req.body, { headers: getAuthHeaders(req) });
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Delete User (Protected)
router.delete('/admin/delete-user', async (req, res) => {
    try {
        const result = await axios.delete(`${ process.env.API_BASE }/admin`, { headers: getAuthHeaders(req), data: req.body });
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Forgot Password
router.post('/forgot', async (req, res) => {
    try {
        const result = await axios.post(`${process.env.API_BASE}/forgot`, req.body);
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
        const result = await axios.post(`${process.env.API_BASE}/login`, req.body);
        res.status(200).json(result.data);
    }
    catch (err) {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Login failed.' });
    }
});

// 🔹 Signup (Stores JWT)
router.post('/signup', async (req, res) => {
    try {
        const result = await axios.post(`${process.env.API_BASE}/signup`, req.body);
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

        const result = await axios.post(`${process.env.API_BASE}/audio`, formData, {
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
