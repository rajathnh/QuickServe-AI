// DOM Ready Event Listener for initialization
document.addEventListener("DOMContentLoaded", async function () {
    initNavbarEffects();
    initMobileMenu();
    
    // Chat input enter key handler
    document.getElementById("chatInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
    
    try {
        // Load data from API
        await fetchUserProfile();
        await fetchOrderHistory();
        await fetchAppointmentHistory();
        await loadChatHistory();
    } catch (error) {
        console.error("Error during initialization:", error);
        // Fallback to simulated data if API calls fail
        loadSimulatedData();
    }
});

// ===== NAVIGATION FUNCTIONS =====

function initMobileMenu() {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    function closeMobileMenu() {
        mobileMenu.classList.add('hidden');
    }

    mobileMenuButton.addEventListener('click', (e) => {
        e.stopPropagation();
        mobileMenu.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
            closeMobileMenu();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeMobileMenu();
    });
}

function initNavbarEffects() {
    let lastScroll = 0;
    const navbar = document.getElementById('navbar');

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        const scrollDelta = currentScroll - lastScroll;
        
        if (scrollDelta > 0) { // Scrolling down
            navbar.style.top = `${Math.min(20 + (currentScroll * 0.15), 30)}px`;
        } else { // Scrolling up
            navbar.style.top = `${Math.max(20 - (currentScroll * 0.1), 15)}px`;
        }

        navbar.classList.toggle('shadow-lg', currentScroll > 100);
        lastScroll = currentScroll;
    });
}

function scrollToChatbox() {
    document.getElementById("chatMessages").scrollIntoView({ behavior: "smooth" });
}

// ===== API DATA FETCHING =====

async function fetchUserProfile() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/user/me", {
            credentials: "include",
        });
        const data = await response.json();

        if (response.ok) {
            // Update all userName elements (there may be multiple)
            const userNameElements = document.querySelectorAll("#userName");
            userNameElements.forEach(element => {
                element.textContent = data.user.name;
            });
            
            document.getElementById("userEmail").textContent = data.user.email;
            document.getElementById("userPhone").textContent = data.user.phoneNumber;
        } else {
            console.warn("Failed to fetch user profile:", data.message);
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error fetching user profile:", error);
        throw error;
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
            
            if (data.orders.length === 0) {
                ordersList.innerHTML = `
                    <li class="flex items-center p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p class="text-gray-500">No orders found</p>
                        </div>
                    </li>
                `;
                return;
            }
            
            data.orders.forEach((order) => {
                const orderItem = document.createElement("li");
                orderItem.className = "flex justify-between items-center bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors p-4";
                
                const orderDetails = document.createElement("div");
                
                const orderTitle = document.createElement("p");
                orderTitle.className = "font-medium text-gray-700";
                orderTitle.textContent = `Order #${order._id.slice(-5)}`;
                
                const orderItems = document.createElement("p");
                orderItems.className = "text-sm text-gray-500";
                orderItems.textContent = `Items: ${order.items.map(item => item.menuItem.name).join(", ")}`;
                
                orderDetails.appendChild(orderTitle);
                orderDetails.appendChild(orderItems);
                
                const orderPrice = document.createElement("span");
                orderPrice.className = "text-blue-600 font-medium";
                orderPrice.textContent = `$${order.totalPrice.toFixed(2)}`;
                
                orderItem.appendChild(orderDetails);
                orderItem.appendChild(orderPrice);
                
                ordersList.appendChild(orderItem);
            });
        } else {
            console.warn("Failed to fetch orders:", data.message);
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Error fetching order history:", error);
        throw error;
    }
}

async function fetchAppointmentHistory() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/user/appointments", {
            credentials: "include",
        });

        const data = await response.json();
        const appointmentsList = document.getElementById("appointmentsList");
        appointmentsList.innerHTML = "";

        if (response.status === 404 || !data.appointments || data.appointments.length === 0) {
            appointmentsList.innerHTML = `
                <li class="flex items-center p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p class="text-gray-500">No appointments found</p>
                    </div>
                </li>
            `;
            return;
        }

        if (!response.ok) {
            throw new Error(data.message || "Failed to fetch appointment history");
        }

        data.appointments.forEach((appt) => {
            const appointmentItem = document.createElement("li");
            appointmentItem.className = "flex justify-between items-center bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors p-4";
            
            const apptDetails = document.createElement("div");
            
            const apptTitle = document.createElement("p");
            apptTitle.className = "font-medium text-gray-700";
            apptTitle.textContent = `Dr. ${appt.doctorName} (${appt.specialization})`;
            
            const apptTime = document.createElement("p");
            apptTime.className = "text-sm text-gray-500";
            apptTime.textContent = `${appt.clinicName} | ${appt.appointmentTime}`;
            
            apptDetails.appendChild(apptTitle);
            apptDetails.appendChild(apptTime);
            
            const apptStatus = document.createElement("span");
            apptStatus.className = "text-purple-600 font-medium";
            apptStatus.textContent = appt.status;
            
            appointmentItem.appendChild(apptDetails);
            appointmentItem.appendChild(apptStatus);
            
            appointmentsList.appendChild(appointmentItem);
        });
    } catch (error) {
        console.error("Error fetching appointment history:", error);
        throw error;
    }
}

// ===== CHAT FUNCTIONALITY =====

async function loadChatHistory() {
    try {
        const response = await fetch("http://localhost:5000/api/v1/chat/history", {
            credentials: "include",
        });

        if (!response.ok) {
            throw new Error("Failed to fetch chat history");
        }

        const result = await response.json();
        const chatMessages = document.getElementById("chatMessages");
        
        // Clear existing welcome message if there's chat history
        if (result.messages && result.messages.length > 0) {
            chatMessages.innerHTML = "";
        }

        result.messages.forEach(({ sender, message }) => {
            if (sender === "User") {
                addUserMessage(message);
            } else {
                addBotMessage(message);
            }
        });
        
        // Scroll to bottom of chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error("Error loading chat history:", error);
    }
}

function addUserMessage(message) {
    const messagesContainer = document.getElementById("chatMessages");
    
    messagesContainer.innerHTML += `
        <div class="chat-message user-message animate-fade-in flex justify-end">
            <div class="bg-blue-600 text-white rounded-2xl p-5 max-w-[80%] shadow-sm">
                <p>${message}</p>
                <span class="text-xs opacity-75 mt-2 block">Just now</span>
            </div>
        </div>
    `;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function addBotMessage(message) {
    const messagesContainer = document.getElementById("chatMessages");
    
    messagesContainer.innerHTML += `
        <div class="chat-message ai-message animate-fade-in flex">
            <div class="bg-white border border-blue-100 rounded-2xl p-5 max-w-[90%] shadow-sm">
                <p class="text-gray-700">${message}</p>
                <span class="text-xs text-gray-400 mt-2 block">Just now</span>
            </div>
        </div>
    `;
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
    const input = document.getElementById("chatInput");
    const message = input.value.trim();
    if (!message) return;

    // Display user message
    addUserMessage(message);
    
    // Clear input field
    input.value = "";

    try {
        // Send message to chatbot API
        const response = await fetch("http://localhost:5000/api/v1/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ message }),
        });

        const result = await response.json();
        
        // Display bot response
        addBotMessage(result.message);

        // Store chat history in database
        await fetch("http://localhost:5000/api/v1/chat/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ message, botMessage: result.message }),
        });
    } catch (error) {
        console.error("Chat error:", error);
        addBotMessage("Sorry, something went wrong. Please try again later.");
    }
}

// ===== FALLBACK DATA =====

function loadSimulatedData() {
    console.log("Loading simulated data as fallback");
    
    // Set user profile
    const userNameElements = document.querySelectorAll("#userName");
    userNameElements.forEach(element => {
        element.textContent = 'John Doe';
    });
    document.getElementById('userEmail').textContent = 'john@example.com';
    document.getElementById('userPhone').textContent = '+1 234 567 890';
    
    // Load orders
    const orders = [
        { id: 1, date: '2024-03-15', items: '3 items', total: '$45.00' },
        { id: 2, date: '2024-03-14', items: '2 items', total: '$28.50' }
    ];
    
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = orders.map(order => `
        <li class="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
            <div>
                <span class="font-medium">Order #${order.id}</span>
                <span class="text-sm text-gray-500">${order.date}</span>
            </div>
            <span class="text-blue-600 font-medium">${order.total}</span>
        </li>
    `).join('');
    
    // Load appointments
    const appointments = [
        { id: 1, date: '2024-03-20', time: '10:00 AM', doctor: 'Dr. Smith' },
        { id: 2, date: '2024-03-22', time: '02:30 PM', doctor: 'Dr. Johnson' }
    ];
    
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = appointments.map(appointment => `
        <li class="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition">
            <div>
                <span class="font-medium">${appointment.doctor}</span>
                <span class="text-sm text-gray-500">${appointment.date} at ${appointment.time}</span>
            </div>
            <span class="text-purple-600 font-medium">Upcoming</span>
        </li>
    `).join('');
}