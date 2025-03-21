document.addEventListener("DOMContentLoaded", async function () {
  await fetchUserProfile();
  await fetchOrderHistory();
  await fetchAppointmentHistory();
});

document.getElementById("chatInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    sendMessage();
  }
});

async function fetchUserProfile() {
  try {
    const response = await fetch("http://localhost:5000/api/v1/user/me", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok) {
      document.getElementById("userName").textContent = data.user.name;
      document.getElementById("userEmail").textContent = data.user.email;
      document.getElementById("userPhone").textContent = data.user.phoneNumber;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
  }
}

async function fetchOrderHistory() {
  try {
    const response = await fetch("http://localhost:5000/api/v1/user/orders", {
      credentials: "include",
    });
    const data = await response.json();

    if (response.ok) {
      const ordersList = document.getElementById("ordersList");
      ordersList.innerHTML = "";
      data.orders.forEach((order) => {
        const li = document.createElement("li");
        li.textContent = `Order ID: ${order._id} | Items: ${order.items
          .map((item) => item.menuItem.name)
          .join(", ")} | Total: ${order.totalPrice}`;
        ordersList.appendChild(li);
      });
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error fetching order history:", error);
  }
}
async function fetchAppointmentHistory() {
  try {
    const response = await fetch(
      "http://localhost:5000/api/v1/user/appointments",
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (response.status === 404) {
      // Handle "No Appointments Found"
      console.log("No appointment history found.");
      document.getElementById("appointmentsList").innerHTML =
        "<li>No appointments found.</li>";
      return;
    }

    if (!response.ok) {
      // Handle other errors
      throw new Error(data.message || "Failed to fetch appointment history");
    }

    const appointmentsList = document.getElementById("appointmentsList");
    appointmentsList.innerHTML = "";

    data.appointments.forEach((appt) => {
      const li = document.createElement("li");
      li.textContent = `Dr. ${appt.doctorName} (${appt.specialization}) - ${appt.clinicName} | Time: ${appt.appointmentTime} | Status: ${appt.status}`;
      appointmentsList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching appointment history:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadChatHistory);

// Load chat history from database
async function loadChatHistory() {
  try {
    const response = await fetch("http://localhost:5000/api/v1/chat/history", {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch chat history");
    }

    const result = await response.json();

    if (!result.messages || result.messages.length === 0) {
      console.log("No previous chat history found.");
      return;
    }

    result.messages.forEach(({ sender, message }) => {
      appendMessage(sender === "User" ? "You" : "Bot", message);
    });
  } catch (error) {
    console.error("Error loading chat history:", error);
  }
}

// Append messages to chatbox
function appendMessage(sender, message) {
  const chatMessages = document.getElementById("chatMessages");
  const msgElement = document.createElement("p");
  msgElement.textContent = `${sender}: ${message}`;
  chatMessages.appendChild(msgElement);
}

// async function sendMessage() {
//   const input = document.getElementById("chatInput");
//   const message = input.value.trim();
//   if (!message) return;

//   // Display the user's message in the chatbox
//   appendMessage("You", message);

//   try {
//     // 1️⃣ Send message to chatbot API
//     const response = await fetch("http://localhost:5000/api/v1/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ message }),
//     });

//     const result = await response.json();
//     appendMessage("Bot", result.message);

//     // 2️⃣ Store the chat history in the database
//     await fetch("http://localhost:5000/api/v1/chat/history", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       credentials: "include",
//       body: JSON.stringify({ message, botMessage: result.message }),
//     });
//   } catch (error) {
//     console.error("Chat error:", error);
//     appendMessage("Bot", "Sorry, something went wrong!");
//   }

// Clear input field after sending
//   input.value = "";
// }

async function sendMessage() {
  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  // Display the user's message in the chatbox
  appendMessage("You", message);

  try {
    // 1️⃣ Send message to chatbot API
    const response = await fetch("http://localhost:5000/api/v1/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message }),
    });

    const result = await response.json();
    appendMessage("Bot", result.message);

    // 2️⃣ Store the chat history in the database
    await fetch("http://localhost:5000/api/v1/chat/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ message, botMessage: result.message }),
    });
  } catch (error) {
    console.error("Chat error:", error);
    appendMessage("Bot", "Sorry, something went wrong!");
  } finally {
    // Clear input field after sending, regardless of success or failure
    input.value = "";
  }
}
