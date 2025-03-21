document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const data = { email, password };

    try {
        const response = await fetch("http://localhost:5000/api/v1/auth/login", {
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
            alert(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Login failed.");
    }
});
