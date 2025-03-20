const express = require("express");
const axios = require("axios");
const router = express.Router();
const Doctor = require('../models/Doctor'); 
const Menu = require('../models/Menu');// Import Doctor model
const Restaurant = require('../models/Restaurant');
const { getAppointmentHistoryForUser } = require('../controllers/userController');


const { authenticateUser } = require('../middleware/authMiddleware'); // Ensure authentication
const { fetchOrderHistory } = require('../controllers/userController');
const { getOrderHistoryForUser } = require('../controllers/userController');
// Utility function: call detect intent endpoint
async function detectIntent(prompt) {
  console.log("Detecting intent for prompt:", prompt);
  const response = await axios.post(
    "http://localhost:5000/api/v1/detect-intent",
    { prompt }
  );
  console.log("Intent detection response:", response.data);
  return response.data;
}

// Utility function: refine response via refine-response endpoint
async function refineResponse(rawMessage) {
  console.log("Refining raw message:", rawMessage);
  const response = await axios.post(
    "http://localhost:5000/api/v1/refine-response",
    { rawMessage }
  );
  console.log("Refined message response:", response.data);
  return response.data.refinedMessage;
}

// Helper function: Map Gemini output to full booking payload
async function mapBookingPayload(intentData, req) {
    console.log("Mapping booking payload from intent data:", intentData);
  
    // Get authenticated user info from req.user
    const patient = req.user.id;
    const patientName = req.user.name;  // Ensure that req.user.name exists
    if (!patientName) {
      throw new Error("Patient name is missing in the authenticated token");
    }
    console.log("Patient info from req.user:", { patient, patientName });
  
    // Set a valid default clinic ID (replace with a real ObjectId)
    const clinic = "60d21b4667d0d8992e610c85"; // Example valid ObjectId
    console.log("Using clinic ID:", clinic);
  
    // Lookup doctor by name using the provided intent data
    const doctorData = await Doctor.findOne({ name: intentData.doctor_name });
    console.log("Doctor lookup result:", doctorData);
    if (!doctorData) {
      throw new Error("Doctor not found");
    }
    const doctor = doctorData._id;
    const doctorName = doctorData.name;
    console.log("Mapped doctor details:", { doctor, doctorName });
  
    // Combine date and time into a valid appointment time.
   // Normalize the date (remove 'st', 'nd', 'rd', 'th')
const rawDate = intentData.date.trim().replace(/(\d+)(st|nd|rd|th)/, "$1");

// Append current year if missing
const currentYear = new Date().getFullYear();
const fullDateString = `${rawDate} ${currentYear} ${intentData.time.trim()}`;

console.log("Parsing date:", fullDateString);

// Convert to a valid Date object
const appointmentTime = new Date(fullDateString);
if (isNaN(appointmentTime.getTime())) {
  throw new Error("Invalid time format. Please check the date and time values.");
}

console.log("Computed appointment time:", appointmentTime.toISOString());
  
    // Set a default charge or use doctor's consultation fee if available
    const charges = doctorData.consultationFee || 150;
    console.log("Using charges:", charges);
  
    const payload = {
      clinic,
      patient,
      patientName,
      doctor,
      doctorName,
      appointmentTime,
      charges,
    };
    console.log("Final booking payload:", payload);
    return payload;
  }
  

// Protect chat route so that req.user is available
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { message } = req.body;
    console.log("Received chat message:", message);
    if (!message) return res.status(400).json({ error: "Message is required" });

    // Step 1: Detect the intent of the message
    const intentData = await detectIntent(message);
    console.log("Detected intent data:", intentData);

    let rawResult = "";
    // Step 2: Route based on the intent
    switch (intentData.intent) {
      case "book_appointment":
        try {
          // Map the Gemini output to the complete payload required by the booking endpoint
          const bookingPayload = await mapBookingPayload(intentData, req);
          // Call the clinic booking endpoint with the enriched payload
          const bookRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/appointment",
            bookingPayload
          );
          console.log("Clinic booking response:", bookRes.data);
          rawResult = bookRes.data.message + ". Appointment ID: " + bookRes.data.appointment._id;
        } catch (error) {
          console.error("Error during booking mapping or request:", error);
          rawResult = "Failed to book appointment: " + error.message;
        }
        break;
      case "check_availability":
        {
          const availRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/availability",
            intentData
          );
          console.log("Availability response:", availRes.data);
          rawResult = "Available slots: " + availRes.data.availableSlots.join(", ");
        }
        break;
      case "cancel_appointment":
        {
          const cancelRes = await axios.post(
            "http://localhost:5000/api/v1/clinic/cancel",
            intentData
          );
          console.log("Cancel appointment response:", cancelRes.data);
          rawResult = cancelRes.data.message;
        }
        break;
        case "place_order":
  {
    try {
      console.log("Handling place_order intent:", intentData);
      let rawResult = "";
      
      // Normalize food_items and quantity into arrays
      let foodItems = Array.isArray(intentData.food_items)
        ? intentData.food_items
        : [intentData.food_items];
      let quantities = Array.isArray(intentData.quantity)
        ? intentData.quantity
        : [intentData.quantity];
      
      if (foodItems.length !== quantities.length) {
        throw new Error("Mismatch between number of food items and quantities.");
      }
      
      const items = [];
      for (let i = 0; i < foodItems.length; i++) {
        const dishName = foodItems[i];
        const quantity = quantities[i];
        console.log(`Looking up dish for: ${dishName} (quantity: ${quantity})`);
        
        // Lookup dish by name (case-insensitive)
        const dish = await Menu.findOne({ name: new RegExp(`^${dishName}$`, "i") });
        if (!dish) {
          throw new Error("Dish not found: " + dishName);
        }
        console.log(`Found dish: ${dish.name}, ID: ${dish._id}`);
        items.push({ menuItem: dish._id, quantity });
      }
      
      const orderPayload = {
        user: req.user.id,
        items,
        type: intentData.type || "Delivery"
      };
      console.log("Constructed order payload:", orderPayload);
      
      const orderRes = await axios.post("http://localhost:5000/api/v1/restaurant/order", orderPayload);
      console.log("Place order response:", orderRes.data);
      
      // Ensure the order is populated with the dish names.
      const order = orderRes.data.order;
      
      // Build a string with food item names and quantities.
      const itemsString = order.items.map(item => {
        // Check if menuItem is an object and has a name property.
        const name = item.menuItem && item.menuItem.name ? item.menuItem.name : item.menuItem;
        return `${name} (x${item.quantity})`;
      }).join(", ");
      
      rawResult = orderRes.data.message + ". Order ID: " + order._id + ". Items: " + itemsString;
      
      // Refine the raw result into a conversational reply.
      rawResult = await refineResponse(rawResult);
      res.json({ message: rawResult });
    } catch (error) {
      console.error("Error placing order:", error.message);
      res.status(500).json({ error: "Failed to place order", details: error.message });
    }
  }
  break;

  case "fetch_appointment_history":
  {
    try {
      console.log("Handling fetch_appointment_history intent...");
      
      // Call the function to fetch user's appointment history
      const appointmentsRes = await axios.get(
        "http://localhost:5000/api/v1/user/appointments",
        {
          headers: { Cookie: req.headers.cookie }, // Forward authentication
        }
      );

      console.log("Fetched appointments:", appointmentsRes.data);

      let rawResult = "";
      const appointments = appointmentsRes.data.appointments;

      if (appointments && appointments.length > 0) {
        rawResult = "Your previous appointments: " + appointments
          .map(appt => 
            `Appointment with Dr. ${appt.doctorName} (${appt.specialization}) at ${appt.clinicName} on ${new Date(appt.appointmentTime).toLocaleString()} (Status: ${appt.status}, Charges: $${appt.charges})`
          )
          .join(" | ");
      } else {
        rawResult = "You have no previous appointments.";
      }

      console.log("Raw appointment history result:", rawResult);

      const refinedMessage = await refineResponse(rawResult);
      return res.json({ message: refinedMessage });

    } catch (error) {
      console.error("Error fetching appointment history:", error.message);
      return res.status(500).json({ error: "Failed to fetch appointment history", details: error.message });
    }
  }
  break;

  
  case "get_doctor_timings":
    {
      try {
        console.log("Handling get_doctor_timings intent:", intentData);
        let rawResult = "";
        
        // Check if doctor_name is provided in the intent data.
        if (intentData.doctor_name) {
          console.log("Searching for doctor by name:", intentData.doctor_name);
          // Perform a case-insensitive search for the doctor.
          const doctor = await Doctor.findOne({ 
            name: new RegExp(`^${intentData.doctor_name}$`, "i") 
          });
          if (doctor) {
            console.log("Found doctor:", doctor);
            
            let timingInfo = "";
            // Use workingHours (which is required)
            if (doctor.workingHours) {
              timingInfo = `works from ${doctor.workingHours}`;
              // Check if workingDays has values
              if (doctor.workingDays && doctor.workingDays.length > 0) {
                timingInfo += ` on ${doctor.workingDays.join(", ")}`;
              } else {
                // Optionally, fallback to freeSlots if workingDays is empty
                if (doctor.freeSlots && doctor.freeSlots.length > 0) {
                  timingInfo += ` and has available slots at ${doctor.freeSlots.join(", ")}`;
                }
              }
            } else {
              // Fallback if workingHours is somehow not provided (shouldn't happen since it's required)
              if (doctor.freeSlots && doctor.freeSlots.length > 0) {
                timingInfo = `has available slots at ${doctor.freeSlots.join(", ")}`;
              } else {
                timingInfo = "schedule information is not available";
              }
            }
            
            rawResult = `Doctor ${doctor.name} ${timingInfo}.`;
          } else {
            rawResult = `No doctor found with the name "${intentData.doctor_name}".`;
          }
        } else {
          rawResult = "No doctor name provided in the intent.";
        }
        
        // Optionally refine the raw result into a conversational reply.
        rawResult = await refineResponse(rawResult);
        
        return res.json({ message: rawResult });
      } catch (error) {
        console.error("Error fetching doctor timings:", error.message);
        return res.status(500).json({ error: "Failed to fetch doctor timings", details: error.message });
      }
    }
    break;
  
  
  case "fetch_restaurant_details":
  {
    try {
      console.log("Handling fetch_restaurant_details intent:", intentData);
      let rawResult = "";
      
      // Expect intentData to include a restaurant_name.
      if (intentData.restaurant_name) {
        const restaurantName = intentData.restaurant_name;
        console.log("Searching for restaurant by name:", restaurantName);
        
        // Find the restaurant by name (case-insensitive)
        const restaurant = await Restaurant.findOne({
          name: new RegExp(`^${restaurantName}$`, "i")
        });
        
        if (!restaurant) {
          rawResult = `No restaurant found with the name ${restaurantName}.`;
        } else {
          console.log("Found restaurant:", restaurant);
          
          // Fetch all menu items for the found restaurant.
          const menuItems = await Menu.find({ restaurant: restaurant._id }).select('name price');
          console.log("Fetched menu items:", menuItems);
          
          // Combine restaurant details with the menu items.
          const restaurantDetails = {
            ...restaurant.toObject(),
            menu: menuItems
          };
          
          rawResult = "Restaurant Details: " + JSON.stringify(restaurantDetails);
        }
      } else {
        rawResult = "No restaurant name provided in intent.";
      }
      
      // Refine the raw result into a conversational reply.
      rawResult = await refineResponse(rawResult);
      res.json({ message: rawResult });
    } catch (error) {
      console.error("Error fetching restaurant details:", error);
      res.status(500).json({ error: "Failed to fetch restaurant details", details: error.message });
    }
  }
  break;

  case "check_appointment_cost":
  {
    try {
      console.log("Handling check_appointment_cost intent:", intentData);

      // Ensure doctor_name is provided
      if (!intentData.doctor_name) {
        rawResult = "Please provide the doctor's name to check the consultation fee.";
      } else {
        console.log("Searching for doctor's fee by name:", intentData.doctor_name);

        // Lookup doctor by name (case-insensitive)
        const doctor = await Doctor.findOne({ name: new RegExp(`^${intentData.doctor_name}$`, "i") });
        if (doctor) {
          console.log("Found doctor:", doctor);
          rawResult = `Dr. ${doctor.name} charges $${doctor.consultationFee} per appointment.`;
        } else {
          console.log("No doctor found with the name:", intentData.doctor_name);
          rawResult = `Sorry, I couldn't find any doctor named ${intentData.doctor_name}.`;
        }
      }

      // Refine the response to make it conversational
      rawResult = await refineResponse(rawResult);
      res.json({ message: rawResult });
    } catch (error) {
      console.error("Error fetching appointment cost:", error);
      res.status(500).json({ error: "Failed to fetch appointment cost", details: error.message });
    }
  }
  break;

      

        case "check_menu":
            {
              try {
                console.log("Fetching complete menu from restaurant endpoint...");
                // Call the endpoint to fetch all menu items
                const menuRes = await axios.get("http://localhost:5000/api/v1/restaurant/menu");
                console.log("Fetched menu data:", menuRes.data);
                
                // Check if menu items are returned and map dish names along with prices
                if (menuRes.data.menu && menuRes.data.menu.length > 0) {
                  rawResult = "Menu items: " + menuRes.data.menu
                    .map(item => `${item.name} ($${item.price})`)
                    .join(", ");
                } else {
                  rawResult = "No menu items found.";
                }
              } catch (error) {
                console.error("Error fetching complete menu:", error);
                rawResult = "Failed to fetch menu: " + error.message;
              }
            }
            break;
            case "get_dish_details":
                {
                  try {
                    console.log("Handling get_dish_details intent:", intentData);
                    let rawResult = "";
                    
                    // We expect intentData to include dish_name.
                    if (intentData.dish_name) {
                      console.log("Searching for dish by name in the database:", intentData.dish_name);
                      // Use a case-insensitive regex search to find the dish by name.
                      const dish = await Menu.findOne({ 
                        name: new RegExp(`^${intentData.dish_name}$`, "i") 
                      });
                      if (dish) {
                        console.log("Found dish in database:", dish);
                        rawResult = "Dish Details: " + JSON.stringify(dish);
                      } else {
                        console.log("No dish found with the name:", intentData.dish_name);
                        rawResult = "Dish not found.";
                      }
                    } else {
                      rawResult = "No dish name provided in intent.";
                    }
                    
                    // Optionally refine the raw result into a conversational reply.
                    rawResult = await refineResponse(rawResult);
                    
                    res.json({ message: rawResult });
                  } catch (error) {
                    console.error("Error fetching dish details:", error);
                    res.status(500).json({ error: "Failed to fetch dish details", details: error.message });
                  }
                }
                break;
            
                case "fetch_order_history":
  {
    try {
      console.log("Handling fetch_order_history intent:", intentData);
      
      // Use the helper function to get orders directly from the database.
      const orders = await getOrderHistoryForUser(req.user.id);
      console.log("Fetched orders:", orders);
      
      let rawResult = "";
      if (orders && orders.length > 0) {
        rawResult = "Your previous orders: " + orders.map(order => {
          let itemsString = "";
          if (order.items && order.items.length > 0) {
            itemsString = order.items.map(item => {
              // Use the populated dish name if available.
              const dishName = item.menuItem && item.menuItem.name ? item.menuItem.name : "Unknown dish";
              return `${dishName} (x${item.quantity})`;
            }).join(", ");
          }
          return `Order ${order._id}: ${itemsString} - Total: $${order.totalPrice}`;
        }).join(" | ");
      } else {
        rawResult = "You have no previous orders.";
      }
      
      console.log("Raw order history result:", rawResult);
      
      // Refine the raw result into a conversational reply.
      const refinedMessage = await refineResponse(rawResult);
      return res.json({ message: refinedMessage });
    } catch (error) {
      console.error("Error fetching order history:", error.message);
      return res.status(500).json({ error: "Failed to fetch order history", details: error.message });
    }
  }
  break;
                  
      case "cancel_order":
        {
          const cancelOrderRes = await axios.post(
            "http://localhost:5000/api/v1/restaurant/cancel",
            intentData
          );
          console.log("Cancel order response:", cancelOrderRes.data);
          rawResult = cancelOrderRes.data.message;
        }
        break;
      default:
        rawResult = "I'm not sure what you meant. Could you please clarify?";
        break;
    }

    console.log("Raw result before refinement:", rawResult);
    // Step 3: Refine the raw result to a conversational reply
    const refinedMessage = await refineResponse(rawResult);
    console.log("Final refined message:", refinedMessage);

    // Return the final refined message to the user
    res.json({ message: refinedMessage });
  } catch (error) {
    console.error("Chat Endpoint Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to process chat", details: error.message });
  }
});

module.exports = router;
