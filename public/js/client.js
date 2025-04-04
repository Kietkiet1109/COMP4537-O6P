const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3';
const port = 3002;

/**
 * Reusable API request function.
 * Handles common headers, logging, and error handling.
 */
async function apiRequest(endpoint, options = {})
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

/**
 * Fetch user info and update DOM elements.
 */
async function fetchUserInfoAndInject()
{
    const data = await apiRequest('/currentUser', { method: 'GET' });
    if (!data || !data.user)
    {
        console.warn('Not authenticated');
        window.location.href = '/';
        return;
    }

    const { username, isAdmin } = data.user;

    // Update welcome message
    const welcomeText = document.getElementById('welcomeText');
    if (welcomeText)
    {
        welcomeText.textContent = `Welcome, ${ isAdmin ? 'Admin ' : '' }${ username }!`;
    }

    // Show admin panel link if user is admin
    const adminLink = document.getElementById('adminPanelLink');
    if (adminLink && isAdmin)
    {
        adminLink.style.display = 'inline-block';
    }

    // Protect admin-only content
    const adminPanelContainer = document.querySelector('.admin-container');
    if (adminPanelContainer && !isAdmin)
    {
        document.body.innerHTML = `
            <div class="text-center mt-5">
                <h2>Access Denied</h2>
                <p>You are not an admin.</p>
            </div>
        `;
    }
}

// Initialize WebSocket connection
function connectToEV3() {
    ws = new WebSocket(`ws://localhost:${port}`);

    ws.onopen = () => {
        console.log('Connected to EV3 WebSocket');
    };

    ws.onmessage = (event) => {
        console.log('Message from EV3:', event.data);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed');
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };
}


document.addEventListener('DOMContentLoaded', async () =>
{
    const pageId = document.body.id;
    if (pageId === 'home-page' || pageId === 'admin-page')
    {
        await fetchUserInfoAndInject();
    }

    const adminButton = document.getElementById('adminPanelLink');
    if (adminButton)
    {
        adminButton.addEventListener('click', async () =>
        {
            const data = await apiRequest('/currentUser', { method: 'GET' });

            if (!data) 
                return alert('data is undefined');

            if (!data.user.isAdmin) 
                return alert('You are not authorized to access this page.');

            try
            {
                const queryParams = new URLSearchParams({
                    username: data.user.username,
                    isAdmin: data.user.isAdmin,
                    token: localStorage.getItem("authToken"),
                }).toString();

                // Only navigate AFTER successful fetch
                window.location.href = `/admin?${ queryParams }`;
            } 
            catch (err)
            { 
                console.log('Error fetching admin data:', err);
                alert(`Error fetching admin data: ${ err.message}`); 
            }
        });
    }

    const adminSearchForm = document.getElementById('adminSearchButton'); // Updated to match form ID

    if (adminSearchForm)
    {
        adminSearchForm.addEventListener('submit', async (event) =>
        {
            event.preventDefault(); // Prevent default form submission behavior

            const data = await apiRequest('/currentUser', { method: 'GET' });

            if (!data)
            {
                return alert('data is undefined');
            }

            if (!data.user.isAdmin)
            {
                return alert('You are not authorized to access this page.');
            }

            try
            {
                const queryParams = new URLSearchParams({
                    username: document.getElementById('searchBar').value, // Get value from input field
                    token: localStorage.getItem("authToken")
                }).toString();

                // Navigate AFTER processing input
                window.location.href = `/admin/search?${ queryParams }`;
            } catch (err)
            {
                console.log('Error fetching admin data:', err);
                alert(`Error fetching admin data: ${ err.message }`);
            }
        });
    }


    // Handle forgot password modal
    const forgotPasswordButton = document.getElementById('forgotPasswordLink');
    if (forgotPasswordButton)
    {
        forgotPasswordButton.addEventListener('click', (event) =>
        {
            event.preventDefault();
            const modalInstance = new bootstrap.Modal(document.getElementById('enterEmailModal'));
            modalInstance.show();
        });
    }

    // Handle enter email form submission
    const enterEmailForm = document.getElementById('enter-email-form');
    if (enterEmailForm)
    {
        enterEmailForm.addEventListener('submit', async (event) =>
        {
            event.preventDefault();
            const email = document.getElementById('enter-email').value;
            if (email)
            {
                const data = await apiRequest('/forgot', {
                    method: 'POST',
                    body: JSON.stringify({ email })
                });

                if (data && data.success)
                {
                    const modalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                    modalInstance.show();
                } else
                {
                    alert(data?.message || 'Failed to send reset email.');
                }
            }
        });
    }

    // Handle login form submission
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm)
    {
        loginForm.addEventListener('submit', async (event) =>
        {
            event.preventDefault();
            const formData = new FormData(event.target);

            const data = await apiRequest('/login', {
                method: 'POST',
                body: JSON.stringify({
                    identifier: formData.get('identifier'),
                    password: formData.get('password')
                })
            });

            if (data && data.token)
            {
                localStorage.setItem('authToken', data.token);
                window.location.href = '/home';
            } else
            {
                const modalInstance = new bootstrap.Modal(document.getElementById('modalLoginFailed'));
                document.getElementById('errorMessageH').textContent = data?.message || 'Login failed';
                modalInstance.show();
            }
        });
    }

    // Handle reset password form submission
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm)
    {
        resetPasswordForm.addEventListener('submit', async (event) =>
        {
            event.preventDefault();

            const form = event.target;
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;

            if (password !== confirmPassword)
            {
                alert('Passwords do not match.');
                return;
            }

            const token = window.location.pathname.split('/').pop();

            const data = await apiRequest(`/reset/${ token }`, {
                method: 'POST',
                body: JSON.stringify({ password, confirmPassword })
            });

            if (data && data.success)
            {
                const modalInstance = new bootstrap.Modal(document.getElementById('modalTour'));
                modalInstance.show();
            } else
            {
                alert(data?.message || 'Password reset failed.');
            }
        });
    }

    // Handle user signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm)
    {
        signupForm.addEventListener('submit', async (event) =>
        {
            event.preventDefault();
            const formData = new FormData(event.target);

            const jsonData = {};
            formData.forEach((value, key) =>
            {
                jsonData[key] = value;
            });

            const data = await apiRequest('/signup', {
                method: 'POST',
                body: JSON.stringify(jsonData)
            });

            if (data && data.success && data.token)
            {
                localStorage.setItem('authToken', data.token);
                window.location.href = '/home';
            } else if (data?.message === 'User already exists.')
            {
                const modalInstance = new bootstrap.Modal(document.getElementById('modalUserExists'));
                modalInstance.show();
            } else
            {
                alert(data?.message || 'Signup failed.');
            }
        });
    }

    // Call the connectToEV3 function to establish the WebSocket connection
    connectToEV3();
});

// Prevent unnecessary page reloads
window.onload = () =>
{
    if (localStorage.getItem('refresh') === 'true')
    {
        localStorage.removeItem('refresh');
        location.reload();
    }
};

window.onpageshow = (event) =>
{
    if (event.persisted)
    {
        window.location.reload();
    }
};
