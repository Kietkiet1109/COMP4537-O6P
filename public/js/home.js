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

// 🔹 Landing Page
router.get('/', (req, res) =>
{
    res.render('index');
});

// 🔹 Home Page
router.get('/home', async (req, res) =>
{
    try
    {
        res.render('home', { pageId: 'home-page', isAdmin: false });
    } catch (err)
    {
        console.error("Error rendering home page:", err);
        res.status(500).send("Error rendering home page.");
    }
    // const result = await axios.get(`${process.env.API_BASE}/admin`, { headers: getAuthHeaders(req) });
    // res.render('home', { pageId: 'home-page', isAdmin: result.data.isAdmin });
});

router.get('/admin', async (req, res) =>
{
    try
    {
        console.log("Checking admin status...");
        const params = req.query;
        console.log("Received query parameters:", params);

        const response = await axios.get(`${ process.env.API_BASE }/getUsers`, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ params.token }`
            }
        });
        const users = Array.isArray(response.data.users) ? response.data.users : [];

        const api = await axios.get(`${ process.env.API_BASE }/getStats`, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ params.token }`
            }
        });
        const apiStats = Array.isArray(api.data.apiStats) ? api.data.apiStats : [];
        // Ensure `users` and `apiStats` are arrays before rendering



        res.render('admin', {
            username: params.username || "Unknown User",
            isAdmin: params.isAdmin,
            users: users, // Pass as an array, not a JSON string
            apiStats: apiStats, // Pass as an array, not a JSON string
            searchResult: null,
            searchAttempted: false,
            pageId: 'admin-page'
        });

    } catch (err)
    {
        console.error("Admin route failed:", err.message);
        res.status(err.response?.status || 500).send(`Access Denied: ${ err.message }`);
    }
});




// 🔹 Admin Search (Protected)
router.get('/admin/search', async (req, res) =>
{
    try
    {
        const params = req.query;
        console.log("Received query parameters:", params);

        const result = await axios.get(`${ process.env.API_BASE }/admin`, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ params.token }`
            },
            params: { username: req.query.username }
        });
        console.log("res:", JSON.stringify(result));
        const users = Array.isArray(response.data.users) ? response.data.users : [];
        res.render('admin',
            {
                username: result.data.username ? result.username : result.data.username,
                isAdmin: result.data.isAdmin ? result.isAdmin : result.data.isAdmin,
                users: users,
                searchResult: result.data.users.length > 0 ? result.data.users[0] : null,
                searchAttempted: true
            });
    }
    catch (err)
    {
        res.status(err.response?.status || 500).send(err);
    }
});

// 🔹 Toggle Admin Status (Protected)
router.post('/admin/toggle-admin', async (req, res) =>
{

    try
    {
        const params = req.query;
        const result = await axios.patch(`${ process.env.API_BASE }/admin`, req.body, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ params.token }`
            },
        });
        res.status(200).json(result.data);
    }
    catch (err)
    {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Delete User (Protected)
router.delete('/admin/delete-user', async (req, res) =>
{
    try
    {
        const params = req.query;
        const result = await axios.delete(`${ process.env.API_BASE }/admin`, {
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${ params.token }`
            }, data: req.body
        });
        res.status(200).json(result.data);
    }
    catch (err)
    {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Unauthorized.' });
    }
});

// 🔹 Forgot Password
router.post('/forgot', async (req, res) =>
{
    try
    {
        const result = await axios.post(`${ process.env.API_BASE }/forgot`, req.body);
        res.json(result.data);
    }
    catch (err)
    {
        res.status(err.response?.status || 500).json({ success: false, message: err.response?.data?.message || 'Error sending reset email.' });
    }
});

// 🔹 Reset Password Page (Render the form)
router.get('/reset/:token', (req, res) =>
{
    res.render('resetPassword', { token: req.params.token });
});

// 🔹 Login (Stores JWT)
router.post('/login', async (req, res) =>
{
    try
    {
        const result = await axios.post(`${ process.env.API_BASE }/login`, req.body);
        res.status(200).json(result.data);
    }
    catch (err)
    {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Login failed.' });
    }
});

// 🔹 Signup (Stores JWT)
router.post('/signup', async (req, res) =>
{
    try
    {
        const result = await axios.post(`${ process.env.API_BASE }/signup`, req.body);
        res.status(200).json(result.data);
    }
    catch (err) 
    {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'Signup failed.' });
    }
});

// 🔹 File Upload (Protected)
router.post('/api/v3', async (req, res) =>
{
    try
    {
        const formData = new FormData();
        formData.append('audioFile', req.file);

        const result = await axios.post(`${ process.env.API_BASE }/audio`, formData, {
            headers: {
                ...getAuthHeaders(req), // Attach JWT
                'Content-Type': 'multipart/form-data',
            }
        });

        res.status(200).json(result.data);
    }
    catch (err)
    {
        res.status(err.response?.status || 500).json(err.response?.data || { success: false, message: 'File upload failed.' });
    }
});


module.exports = router;
