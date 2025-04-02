/**
 * Event listener for DOMContentLoaded.
 * Initializes various modal instances and handles form submissions and button clicks.
 */
const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api/v3';

async function fetchUserInfoAndInject() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${API_BASE}/currentUser`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        console.log('[fetchUserInfoAndInject] API response:', data);

        if (!data.success || !data.user) {
            console.warn('Not authenticated');
            window.location.href = '/';
            return;
        }

        const { username, isAdmin } = data.user;

        // 🔹 Update welcome message
        const welcomeText = document.getElementById('welcomeText');
        if (welcomeText) {
            welcomeText.textContent = `Welcome, ${isAdmin ? 'Admin ' : ''}${username}!`;
        }

        // 🔹 Show admin panel link if user is admin
        const adminLink = document.getElementById('adminPanelLink');
        if (adminLink && isAdmin) {
            adminLink.style.display = 'inline-block';
        }

        // 🔹 Protect admin-only content
        const adminPanelContainer = document.querySelector('.admin-container');
        if (adminPanelContainer && !isAdmin) {
            document.body.innerHTML = `
                <div class="text-center mt-5">
                    <h2>Access Denied</h2>
                    <p>You are not an admin.</p>
                </div>
            `;
        }

    } catch (err) {
        console.error("Auth check failed:", err);
        window.location.href = '/'; // Fallback
    }
}


document.addEventListener('DOMContentLoaded', function () {
    const pageId = document.body.id;
    if (pageId === 'home-page' || pageId === 'admin-page') {
        fetchUserInfoAndInject();
    }

    let enterEmailModalInstance;
    let successModalInstance;
    let loginFailedModalInstance;

    const forgotPasswordButton = document.getElementById('forgotPasswordLink');
    const enterEmailForm = document.getElementById('enter-email-form');
    const successButton = document.getElementById('successButton');

    // Show enter email modal
    if (forgotPasswordButton) {
        forgotPasswordButton.addEventListener('click', function (event) {
            event.preventDefault();
            if (!enterEmailModalInstance) {
                enterEmailModalInstance = new bootstrap.Modal(document.getElementById('enterEmailModal'));
            }
            enterEmailModalInstance.show();
        });
    }

    // Handle enter email form submission
    if (enterEmailForm) {
        enterEmailForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const email = document.getElementById('enter-email').value;
            if (email) {
                try {
                    const response = await fetch(`${API_BASE}/forgot`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ email })
                    });

                    const data = await response.json();
                    if (data.success) {
                        if (!successModalInstance) {
                            successModalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                        }
                        enterEmailModalInstance.hide();
                        successModalInstance.show();
                    } else {
                        alert(data.message || 'Failed to send reset email. Please try again.');
                    }
                } catch (error) {
                    alert('Failed to send reset email. Please try again.');
                }
            }
        });
    }

    // Handle success modal close button
    if (successButton) {
        successButton.addEventListener('click', function () {
            if (successModalInstance) {
                successModalInstance.hide();
            }
        });
    }

    // Handle login form submission
    const loginForm = document.querySelector('form[action="/login"]');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const form = event.target;
            const formData = new FormData(form);
            const data = {
                identifier: formData.get('identifier'),
                password: formData.get('password')
            };
            try {
                const response = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });
                const errorData = await response.json();
                if (response.ok && errorData.token) {
                    localStorage.setItem('authToken', errorData.token);
                    window.location.href = '/home';
                } else {
                    const errorMessageHeader = document.getElementById('errorMessageH');
                    const errorMessageBody = document.getElementById('errorMessageB');
                    if (!loginFailedModalInstance) {
                        loginFailedModalInstance = new bootstrap.Modal(document.getElementById('modalLoginFailed'));
                    }
                    errorMessageHeader.textContent = errorData.message.charAt(0).toUpperCase() + errorData.message.slice(1);
                    errorMessageBody.textContent = errorData.message;
                    loginFailedModalInstance.show();
                }
            } catch (err) {
                alert('Login failed. Please try again.');
            }
        });
    }

    // Handle reset password form submission
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', async function (event) {
            event.preventDefault();

            const form = event.target;
            const password = form.password.value;
            const confirmPassword = form.confirmPassword.value;

            // Extract token from the current URL
            const token = window.location.pathname.split('/').pop();

            try {
                const response = await fetch(`${API_BASE}/reset/${token}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ password, confirmPassword })
                });

                const result = await response.json();
                if (response.ok && result.success) {
                    const modalElement = document.getElementById('modalTour');
                    if (modalElement) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                } else {
                    alert(result.message || 'Password reset failed.');
                }
            } catch (err) {
                console.error('Reset error:', err);
                alert('Password reset failed. Please try again.');
            }
        });
    }

    // Handle modal button click
    const modalButton = document.getElementById('modalButton');
    if (modalButton) {
        modalButton.addEventListener('click', function () {
            window.location.href = '/';
        });
    }

    // Handle user already exists modal
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async function (event) {
            event.preventDefault();
            const formData = new FormData(this);
            const jsonData = {};
            formData.forEach((value, key) => {
                jsonData[key] = value;
            });
            try {
                const response = await fetch(`${API_BASE}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(jsonData)
                });

                const data = await response.json();
                
                if (data.success && data.token) {
                    localStorage.setItem('authToken', data.token);
                    window.location.href = "/home";
                } else if (data.message === "User already exists.") {
                    $('#modalUserExists').modal('show');
                } else {
                    alert(data.message || 'Signup failed. Please try again.');
                }
            } catch (err) {
                alert('Signup request failed.');
            }
        });
    }
});

/**
 * Sets a flag in localStorage to refresh the page and navigates back in browser history.
 */
function goBack() {
    localStorage.setItem('refresh', 'true');
    window.history.back();
}

/**
 * Event listener for window load.
 * Reloads the page if the refresh flag is set in localStorage.
 */
window.onload = function () {
    if (localStorage.getItem('refresh') === 'true') {
        localStorage.removeItem('refresh');
        location.reload();
    }
}

/**
 * Event listener for page show.
 * Reloads the page if it was loaded from the cache.
 * 
 * @param {PageTransitionEvent} event - The event object.
 */
window.onpageshow = function (event) {
    if (event.persisted) {
        window.location.reload();
    }
};

