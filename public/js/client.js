/**
 * Event listener for DOMContentLoaded.
 * Initializes various modal instances and handles form submissions and button clicks.
 */
document.addEventListener('DOMContentLoaded', function () {
    let enterEmailModalInstance;
    let successModalInstance;
    let loginFailedModalInstance;
    let enteredEmail = '';

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
                enteredEmail = email;  // Store the entered email
                fetch('/forgot', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email: email })
                })
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            if (!successModalInstance) {
                                successModalInstance = new bootstrap.Modal(document.getElementById('modalForgot'));
                            }
                            enterEmailModalInstance.hide();
                            successModalInstance.show();
                        } else {
                            alert(data.message || 'Failed to send reset email. Please try again.');
                        }
                    })
                    .catch(error => {
                        alert('Failed to send reset email. Please try again.');
                    });
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
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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

                // Update LoginFailed Modal
                let headerMsg = errorData.message;
                errorMessageHeader.textContent = headerMsg.charAt(0).toUpperCase() + headerMsg.slice(1);
                errorMessageBody.textContent = errorData.message;
                loginFailedModalInstance.show();
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
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
        signupForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const formData = $(this).serialize();
            console.log("Serialized Form Data:", formData);
            $.post('/signup', formData, function (data) {
                console.log("Server Response:", data);
                if (data.success) {
                    window.location.href = "/home";
                } else if (data.message === "User already exists.") {
                    $('#modalUserExists').modal('show');
                } else {
                    alert(data.message || 'Signup failed. Please try again.');
                }
            }).fail(function (xhr) {
                console.error("Signup request failed:", xhr.responseText);
            });
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

