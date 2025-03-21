document.getElementById("registerForm").addEventListener("submit", async function (e) {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const address = document.getElementById("address").value;
    const password = document.getElementById("password").value;

    // Get selected checkboxes
    const foodLabelling = Array.from(document.querySelectorAll(".foodLabelling:checked")).map(el => el.value);
    const choicesAndLiking = Array.from(document.querySelectorAll(".choicesAndLiking:checked")).map(el => el.value);

    const data = { name, email, phoneNumber, address, password, foodLabelling, choicesAndLiking };

    try {
        const response = await fetch("http://localhost:5000/api/v1/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (response.ok) {
            alert(result.message); // Show success message
            window.location.href = "dashboard.html"; // ✅ Redirect to dashboard
        } else {
            alert(result.message); // Show error message from backend
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Registration failed.");
    }
});
function redirectToLogin() {
    window.location.href = "login.html";
}
