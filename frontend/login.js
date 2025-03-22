document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const data = { email, password };

    // Dynamically select API base URL
    const API_BASE_URL = window.location.hostname === "localhost" 
        ? "http://localhost:5000" 
        : "https://quickserve-ai-1.onrender.com";

    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        if (response.ok) {
            alert("Login Successful!");
            window.location.href = "/dashboard.html"; // Redirect after login
        } else {
            alert(result.message || "Invalid credentials");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Login failed. Please try again later.");
    }
});
