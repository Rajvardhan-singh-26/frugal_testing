const locationData = {
    "USA": {
        "California": ["Los Angeles", "San Francisco", "San Diego"],
        "Texas": ["Houston", "Austin", "Dallas"],
        "New York": ["New York City", "Buffalo", "Albany"]
    },
    "India": {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur"],
        "Karnataka": ["Bangalore", "Mysore", "Hubli"],
        "Delhi": ["New Delhi", "Noida", "Gurgaon"]
    },
    "UK": {
        "England": ["London", "Manchester", "Liverpool"],
        "Scotland": ["Edinburgh", "Glasgow", "Aberdeen"]
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registration-form');
    const countrySel = document.getElementById('country');
    const stateSel = document.getElementById('state');
    const citySel = document.getElementById('city');
    const passwordInput = document.getElementById('password');
    const confirmInput = document.getElementById('confirm-password');
    const submitBtn = document.getElementById('submit-btn');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    // 1. Populate Dropdowns Logic
    Object.keys(locationData).forEach(country => {
        const opt = document.createElement('option');
        opt.value = country;
        opt.innerText = country;
        countrySel.appendChild(opt);
    });

    countrySel.addEventListener('change', () => {
        const country = countrySel.value;
        stateSel.innerHTML = '<option value="">Select State</option>';
        citySel.innerHTML = '<option value="">Select City</option>';
        citySel.disabled = true;

        if (country && locationData[country]) {
            stateSel.disabled = false;
            Object.keys(locationData[country]).forEach(state => {
                const opt = document.createElement('option');
                opt.value = state;
                opt.innerText = state;
                stateSel.appendChild(opt);
            });
        } else {
            stateSel.disabled = true;
        }
        validateField(countrySel);
    });

    stateSel.addEventListener('change', () => {
        const country = countrySel.value;
        const state = stateSel.value;
        citySel.innerHTML = '<option value="">Select City</option>';

        if (country && state && locationData[country][state]) {
            citySel.disabled = false;
            locationData[country][state].forEach(city => {
                const opt = document.createElement('option');
                opt.value = city;
                opt.innerText = city;
                citySel.appendChild(opt);
            });
        } else {
            citySel.disabled = true;
        }
        validateField(stateSel);
    });

    citySel.addEventListener('change', () => {
        validateField(citySel);
    });

    // 2. Real-time Validation Helper
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
            if (input.classList.contains('invalid')) validateField(input);
            checkFormValidity();
        });
    });

    function validateField(input) {
        let valid = true;
        if (input.type === 'radio') {
            const group = document.getElementsByName(input.name);
            let checked = false;
            group.forEach(r => { if (r.checked) checked = true; });
            valid = checked;
            // Hacky visual for radio group
            input.closest('.form-group').classList.toggle('invalid', !valid);
        } else if (input.type === 'checkbox') {
            valid = input.checked;
            input.parentElement.classList.toggle('invalid', !valid); // Specifc for Term check
        } else {
            valid = input.checkValidity();
            if (input.id === 'confirm-password') {
                valid = valid && (input.value === passwordInput.value);
            }
            if (input.id === 'state' && input.disabled) valid = true; // Ignore if disabled
            if (input.id === 'city' && input.disabled) valid = true;

            input.classList.toggle('valid', valid);
            input.classList.toggle('invalid', !valid);
        }
        return valid;
    }

    // 3. Password Logic
    passwordInput.addEventListener('input', () => {
        const val = passwordInput.value;
        let strength = 0;
        if (val.length > 5) strength++;
        if (val.length > 8) strength++;
        if (/[A-Z]/.test(val)) strength++;
        if (/[0-9]/.test(val)) strength++;
        if (/[^A-Za-z0-9]/.test(val)) strength++;

        const colors = ['#ef4444', '#f59e0b', '#10b981', '#059669'];
        const widths = ['20%', '50%', '80%', '100%'];
        const texts = ['Weak', 'Medium', 'Strong', 'Very Strong'];

        const idx = Math.min(Math.max(0, strength - 1), 3);

        strengthBar.style.width = val.length > 0 ? widths[idx] : '0%';
        strengthBar.style.backgroundColor = colors[idx];
        strengthText.innerText = val.length > 0 ? texts[idx] : 'Weak';

        if (confirmInput.value) validateField(confirmInput);
    });

    // 4. Submit Logic
    function checkFormValidity() {
        // Implementing simple check to enable button
        // For Scenario C, users might want the button enabled but failing validation 
        // OR disabled until valid. The Prompt says "Disable submit button until all fields are valid"
        const isValid = form.checkValidity() &&
            (passwordInput.value === confirmInput.value) &&
            !stateSel.disabled; // Basic check
        submitBtn.disabled = !isValid;
    }

    form.addEventListener('change', checkFormValidity);
    form.addEventListener('keyup', checkFormValidity);

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Final Validation Check
        let allValid = true;
        inputs.forEach(input => {
            if (!validateField(input)) allValid = false;
        });

        if (allValid) {
            form.style.display = 'none';
            document.getElementById('success-message').classList.remove('hidden');
        }
    });

    document.getElementById('reset-btn').addEventListener('click', () => {
        form.reset();
        form.style.display = 'block';
        document.getElementById('success-message').classList.add('hidden');
        submitBtn.disabled = true;
        strengthBar.style.width = '0%';
        inputs.forEach(i => i.classList.remove('valid', 'invalid'));
    });
});
