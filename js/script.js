// Backend API Configuration
const API_ENDPOINT = '/api/send-email';

// Smooth Scroll to Section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const header = document.querySelector('.header');
        const headerHeight = header ? header.offsetHeight : 0;
        const top = section.getBoundingClientRect().top + window.scrollY - headerHeight;
        window.scrollTo({ top, behavior: 'smooth' });
        // Close mobile menu if open
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle.getAttribute('aria-expanded') === 'true') {
            menuToggle.click();
        }
    }
}

// Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.querySelector('.nav-links');

menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', !isOpen);
    navLinks.style.display = isOpen ? 'none' : 'flex';
    navLinks.style.flexDirection = isOpen ? 'row' : 'column';
});

// Contact Form Handling with Backend API
const contactForm = document.getElementById('contactForm');
const formMessage = document.getElementById('formMessage');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Field validation functions
function validateField(fieldName, value) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const fieldElement = document.getElementById(fieldName);
    let error = null;

    switch (fieldName) {
        case 'name':
            if (!value || value.trim() === '') {
                error = 'Name is required';
            }
            break;
        case 'email':
            if (!value || value.trim() === '') {
                error = 'Email is required';
            } else if (!emailRegex.test(value)) {
                error = 'Please enter a valid email address';
            }
            break;
        case 'phone':
            // Phone is optional, but validate if provided
            if (value && value.trim() !== '' && value.length < 10) {
                error = 'Please enter a valid phone number';
            }
            break;
        case 'poolType':
            // Pool type is optional
            break;
        case 'title':
            if (!value || value.trim() === '') {
                error = 'Title/Subject is required';
            }
            break;
        case 'message':
            if (!value || value.trim() === '') {
                error = 'Message is required';
            } else if (value.trim().length < 10) {
                error = 'Message must be at least 10 characters';
            }
            break;
    }

    // Update UI based on validation
    if (error) {
        errorElement.textContent = error;
        errorElement.classList.add('show');
        fieldElement.classList.add('invalid');
        return false;
    } else {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
        fieldElement.classList.remove('invalid');
        return true;
    }
}

// Add real-time validation on blur
['name', 'email', 'phone', 'title', 'message'].forEach((fieldName) => {
    const field = document.getElementById(fieldName);
    field.addEventListener('blur', () => {
        validateField(fieldName, field.value);
    });
});

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        poolType: document.getElementById('poolType').value,
        title: document.getElementById('title').value,
        message: document.getElementById('message').value,
    };

    // Validate all fields
    const fieldsToValidate = ['name', 'email', 'phone', 'title', 'message'];
    let hasErrors = false;

    fieldsToValidate.forEach((fieldName) => {
        if (!validateField(fieldName, formData[fieldName])) {
            hasErrors = true;
        }
    });

    if (hasErrors) {
        return;
    }

    // Show loading state
    const submitBtn = contactForm.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    try {
        // Send email via backend API
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Show success message
            showFormMessage('✓ Thank you! We will contact you soon.', 'success');
            console.log('Email sent successfully!');

            // Reset form and clear errors
            contactForm.reset();
            ['name', 'email', 'phone', 'title', 'message'].forEach((fieldName) => {
                const errorElement = document.getElementById(`${fieldName}Error`);
                const fieldElement = document.getElementById(fieldName);
                errorElement.textContent = '';
                errorElement.classList.remove('show');
                fieldElement.classList.remove('invalid');
            });

            // Clear message after 5 seconds
            setTimeout(() => {
                formMessage.classList.remove('success', 'error');
                formMessage.textContent = '';
            }, 5000);

        } else {
            showFormMessage(`✗ ${result.error || 'Failed to send message. Please try again later.'}`, 'error');

            // Clear error message after 5 seconds
            setTimeout(() => {
                formMessage.classList.remove('success', 'error');
                formMessage.textContent = '';
            }, 5000);
        }

    } catch (error) {
        console.error('Error:', error);
        showFormMessage('✗ Failed to send message. Please check your connection and try again.', 'error');

        // Clear error message after 5 seconds
        setTimeout(() => {
            formMessage.classList.remove('success', 'error');
            formMessage.textContent = '';
        }, 5000);

    } finally {
        // Restore button state
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

function showFormMessage(message, type) {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
}

// Add smooth fade-in effect to elements on scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards and other elements
document.querySelectorAll('.service-card, .feature-item, .contact-item').forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Prevent default on nav buttons and handle with scroll function
document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
    });
});

// Add click handlers to all CTA buttons
document.querySelectorAll('button[onclick*="scrollToSection"]').forEach((btn) => {
    btn.style.cursor = 'pointer';
});
