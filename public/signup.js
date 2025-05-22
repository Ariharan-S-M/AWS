let countryData = []; // globally store country list
    let lastSubmittedEmail = ''; // Track last submitted email for resend

    // Load country data
    window.onload = function () {
      fetch('countries_pincode.json')
        .then(response => response.json())
        .then(data => {
          countryData = data;
          const select = document.getElementById('country');
          select.innerHTML = "";
          data.forEach(country => {
            const option = document.createElement("option");
            option.value = country.name; // store name only
            option.textContent = `${country.name} (+${country.code})`;
            select.appendChild(option);
          });
          select.value = "India"; // default selection
        })
        .catch(error => {
          console.error("Failed to load countries:", error);
          const select = document.getElementById('country');
          select.innerHTML = '<option value="">Failed to load</option>';
        });
    };

 function Register() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const gmail = document.getElementById("email").value.trim();
  let phone = document.getElementById("phone").value.trim();
  const country = document.getElementById("country").value;
  const genderRadio = document.querySelector("input[name='gender']:checked");
  const gender = genderRadio ? genderRadio.value : "";
  const errorDiv = document.getElementById("phone-error");
  const responseMsg = document.getElementById("response-msg");

  // Clear previous messages
  responseMsg.textContent = "";
  responseMsg.style.color = "";

  // Phone validation
  if (!/^\d{10}$/.test(phone)) {
    errorDiv.textContent = "Phone number must be exactly 10 digits.";
    return;
  } else {
    errorDiv.textContent = "";
  }

  // Remove leading zero if exists
  if (phone.startsWith("0")) {
    phone = phone.substring(1);
  }

  // Find country code from name
  const countryCode = countryData.find(c => c.name === country)?.code || "";
  const fullPhone = `+${countryCode}${phone}`;

  const data = {
    username,
    password,
    gmail,
    phone: fullPhone,
    gender,
    country
  };

  // Store the email for potential resend
  lastSubmittedEmail = gmail;

  // Send to backend
  fetch('http://13.126.122.0:3000/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(res => {
    if (!res.ok) {
      return res.json().then(errData => {
        throw errData;
      });
    }
    return res.json();
  })
  .then(data => {
    if (data.success) {
      showVerificationModal();
      document.querySelector(".login-form").reset();
    } else {
      responseMsg.style.color = "red";
      responseMsg.textContent = data.message || "Registration failed. Please try again.";
    }
  })
  .catch(err => {
    console.error(err);
    responseMsg.style.color = "red";
    if (err.message && err.message.includes('The username already exists')) {
      responseMsg.textContent = "The username already exists, please try again!";
    } else if (err.message && err.message.includes('Email already registered')) {
      responseMsg.textContent = "Email already registered. Please use a different email.";
    } else {
      responseMsg.textContent = "Registration failed. Please try again.";
    }
  });
}

    // Modal functions
    function showVerificationModal() {
      const modal = document.getElementById("verificationModal");
      modal.style.display = "block";
    }

    function closeModal() {
      const modal = document.getElementById("verificationModal");
      modal.style.display = "none";
    }

    function resendVerification() {
      if (!lastSubmittedEmail) return;
      
      fetch('http://13.126.122.0:3000/api/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lastSubmittedEmail })
      })
      .then(res => res.json())
      .then(data => {
        const modalMessage = document.getElementById("modalMessage");
        if (data.success) {
          modalMessage.textContent = "Verification email resent successfully! Please check your inbox.";
        } else {
          modalMessage.textContent = "Failed to resend verification email. " + (data.message || "Please try again later.");
        }
      })
      .catch(err => {
        console.error(err);
        const modalMessage = document.getElementById("modalMessage");
        modalMessage.textContent = "Error resending verification email. Please try again later.";
      });
    }

    // Close modal when clicking outside of it
    window.onclick = function(event) {
      const modal = document.getElementById("verificationModal");
      if (event.target == modal) {
        closeModal();
      }
    }