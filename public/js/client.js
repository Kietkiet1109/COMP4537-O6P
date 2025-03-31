/**
 * Event listener for DOMContentLoaded.
 * Initializes various modal instances and handles form submissions and button clicks.
 */
document.addEventListener('DOMContentLoaded', function () {
    const API_BASE = 'https://exo-engine.com/COMP4537/TermProject/LegoControl/api';
    let enterEmailModalInstance;
    let successModalInstance;
    let loginFailedModalInstance;

    const forgotPasswordButton = document.getElementById('forgotPasswordLink');
    const enterEmailForm = document.getElementById('enter-email-form');
    const successButton = document.getElementById('successButton');

    // // loadUserInfo first
    // async function loadUserInfo() {
    //     const welcomeText = document.getElementById("welcomeText");
    //     const adminPanelLink = document.getElementById("adminPanelLink");

    //     if (!welcomeText && !adminPanelLink) return;

    //     try {
    //         const response = await fetch(`${API_BASE}/checkAuth`, {
    //             method: 'POST',
    //             headers: { 'Content-Type': 'application/json' },
    //             credentials: 'include'
    //         });

    //         const data = await response.json();

    //         if (data.success && data.user) {
    //             const { username, isAdmin } = data.user;
    //             if (welcomeText) {
    //                 welcomeText.textContent = `Welcome, ${isAdmin ? "Admin " : ""}${username}!`;
    //             }
    //             if (adminPanelLink && isAdmin) {
    //                 adminPanelLink.style.display = "inline";
    //             }
    //         } else {
    //             if (welcomeText) {
    //                 welcomeText.textContent = "Welcome, Guest!";
    //             }
    //         }
    //     } catch (err) {
    //         console.error("Failed to fetch user info:", err);
    //     }
    // }

    // loadUserInfo();

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
                if (response.ok) {
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
            const formData = new FormData(form);
            const data = {
                password: formData.get('password'),
                confirmPassword: formData.get('confirmPassword')
            };
            try {
                const response = await fetch(form.action.replace('/reset', `${API_BASE}/reset`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const modalElement = document.getElementById('modalTour');
                    if (modalElement) {
                        const modal = new bootstrap.Modal(modalElement);
                        modal.show();
                    }
                } else {
                    const errorData = await response.json();
                    alert('Error: ' + errorData.message);
                }
            } catch (err) {
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
                if (data.success) {
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

