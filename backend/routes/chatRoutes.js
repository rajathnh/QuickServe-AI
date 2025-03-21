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
            try {
              console.log("Handling check_availability intent:", intentData);
          
              if (!intentData.doctor_name || !intentData.date) {
                rawResult = "Please provide the doctor's name and the date to check availability.";
                break;
              }
          
              // Remove ordinal suffixes (st, nd, rd, th) from the date
              let formattedDate = intentData.date.replace(/(\d+)(st|nd|rd|th)/, "$1");
          
              console.log("Formatted date after removing ordinal suffixes:", formattedDate);
          
              // Convert the formatted date into a proper Date object
              let givenDate = new Date(`${formattedDate} 2025`);  // Assuming year 2025 for now
              console.log("Parsed date:", givenDate);
          
              // Ensure the parsed date is valid
              if (isNaN(givenDate)) {
                rawResult = "The provided date is invalid. Please enter a valid date.";
                break;
              }
          
              // Get the day of the week (e.g., Monday, Tuesday)
              const dayOfWeek = givenDate.toLocaleDateString("en-US", { weekday: "long" });
          
              // Search for the doctor by name
              const doctor = await Doctor.findOne({ name: new RegExp(`^${intentData.doctor_name}$`, "i") });
          
              if (!doctor) {
                rawResult = `Sorry, I couldn't find any doctor named ${intentData.doctor_name}.`;
                break;
              }
          
              console.log(`Doctor found: ${doctor.name}, ID: ${doctor._id}, Working Days: ${doctor.workingDays}`);
          
              // Check if the doctor works on that day
              if (!doctor.workingDays.includes(dayOfWeek)) {
                rawResult = `${doctor.name} does not work on ${dayOfWeek}. Please choose a different day.`;
                break;
              }
          
              // Check available slots
              const availableSlots = doctor.freeSlots;
          
              if (!availableSlots || availableSlots.length === 0) {
                rawResult = `${doctor.name} is fully booked on ${formattedDate}. Please choose another date.`;
              } else {
                rawResult = `${doctor.name} is available on ${formattedDate} during ${doctor.workingHours}. Available slots: ${availableSlots.join(", ")}.`;
              }
          
            } catch (error) {
              console.error("Error fetching doctor availability:", error);
              rawResult = "I couldn't retrieve the doctor's availability right now. Please try again later.";
            }
            break;
          
            case "check_general_checkup_fee": {
                try {
                  console.log("Handling check_general_checkup_fee intent:", intentData);
              
                  // 1️⃣ Fetch all doctors with their consultation fees
                  const doctors = await Doctor.find({}, "name specialization consultationFee");
                  
                  if (doctors.length === 0) {
                    rawResult = "I'm sorry, but I couldn't find any doctor details at the moment.";
                  } else {
                    // 2️⃣ Format the doctor list
                    const doctorList = doctors.map(doc => 
                      `📌 ${doc.name} (${doc.specialization}) - $${doc.consultationFee}`
                    ).join("\n");
              
                    // 3️⃣ Final response message
                    rawResult = `The consultation fee depends on the doctor. Here are some available doctors and their fees:\n\n${doctorList}\n\nWould you like to book an appointment with a specific doctor?`;
                  }
              
                  console.log("General check-up fees response:", rawResult);
                } catch (error) {
                  console.error("Error fetching doctor consultation fees:", error);
                  rawResult = "I'm having trouble retrieving the consultation fee details right now. Please try again later.";
                }
              
                // Refine and send response
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
              }
              break;
              case "recommend_food_by_taste": {
                try {
                    console.log("Handling recommend_food_by_taste intent:", intentData);
            
                    // Extracting taste preference properly
                    let taste_preference = intentData.taste_preference || intentData["taste preference"];
                    if (!taste_preference) {
                        rawResult = "Please specify a taste preference such as Spicy, Sweet, Sour, or Salty.";
                        break;
                    }
            
                    // Normalize taste_preference to an array
                    if (typeof taste_preference === "string") {
                        taste_preference = taste_preference.split(/[/,]| and /i).map(taste => taste.trim());
                    }
            
                    console.log("Finding dishes for taste preference:", taste_preference);
            
                    // Convert taste labels to capitalized format for accurate matching
                    const formattedTastes = taste_preference.map(taste => 
                        taste.charAt(0).toUpperCase() + taste.slice(1).toLowerCase()
                    );
            
                    // Find dishes that match at least one of the requested taste labels
                    const dishes = await Menu.find({ taste: { $in: formattedTastes } }, "name price taste");
            
                    if (dishes.length === 0) {
                        rawResult = `Sorry, we don't have any dishes that match your taste preferences: ${formattedTastes.join(", ")}.`;
                    } else {
                        const dishList = dishes.map(dish => `${dish.name} ($${dish.price})`).join(", ");
                        rawResult = `Here are some ${formattedTastes.join(", ")} dishes you might like: ${dishList}`;
                    }
            
                    console.log("Recommended dishes response:", rawResult);
                } catch (error) {
                    console.error("Error recommending food based on taste:", error);
                    rawResult = "I'm having trouble finding dishes right now. Please try again later.";
                }
            
                // Refine and send response
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
            }
            break;
            
            case "recommend_meal_combo": {
                try {
                  console.log("Handling recommend_meal_combo intent for user:", req.user.id);
              
                  // Call the controller function directly (since it uses req.user.id)
                  const mealRes = await axios.get("http://localhost:5000/api/v1/user/recommend-meal", {
                    headers: { Cookie: req.headers.cookie } // Ensures authentication is passed
                  });
              
                  console.log("Meal recommendation response:", mealRes.data);
                  rawResult = mealRes.data.message;
                } catch (error) {
                  console.error("Error recommending meal combo:", error.message);
                  rawResult = "I'm having trouble finding a meal recommendation for you right now. Please try again later.";
                }
              
                // Refine the response before sending
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
              }
              break;
              
            case "order_estimated_time": {
                try {
                  console.log("Handling order_estimated_time intent:", intentData);
              
                  // Call the endpoint to get the latest order's estimated preparation time
                  const orderTimeRes = await axios.get("http://localhost:5000/api/v1/restaurant/order/latest", {
                    headers: { Cookie: req.headers.cookie } // Ensure authentication is passed
                  });
              
                  console.log("Order estimated time response:", orderTimeRes.data);
              
                  if (orderTimeRes.data.estimatedTime) {
                    rawResult = `Your latest order will take approximately ${orderTimeRes.data.estimatedTime} minutes to be ready.`;
                  } else {
                    rawResult = "I couldn't retrieve your order's estimated time right now. Please try again later.";
                  }
                } catch (error) {
                  console.error("Error retrieving order estimated time:", error.message);
                  rawResult = "I'm unable to find your order's estimated time at the moment. Have you placed an order recently?";
                }
              
                // Refine and send response
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
              }
              break;
              
            
              case "filter_dishes": {
                try {
                    console.log("Handling filter_dishes intent:", intentData);
            
                    let { dietary_preference } = intentData;
            
                    // Ensure dietary_preference is an array and properly split by '/' or ','
                    if (typeof dietary_preference === "string") {
                        dietary_preference = dietary_preference
                            .split(/[/,]/) // Split by both '/' and ','
                            .map(pref => pref.trim()) // Trim spaces
                            .filter(pref => pref.length > 0); // Remove empty values
                    }
            
                    if (!Array.isArray(dietary_preference) || dietary_preference.length === 0) {
                        rawResult = "Please specify whether you're looking for vegetarian, vegan, or gluten-free options.";
                        break;
                    }
            
                    // Sort the preferences to make order irrelevant
                    const sortedLabels = dietary_preference.sort();
                    console.log("Filtering dishes for sorted labels:", sortedLabels);
            
                    // Find dishes that contain ALL requested labels
                    const dishes = await Menu.find({ labels: { $all: sortedLabels } }, "name price labels");
            
                    if (dishes.length === 0) {
                        rawResult = `Sorry, we don't have any ${dietary_preference.join(", ")} dishes available right now.`;
                    } else {
                        const dishList = dishes.map(dish => `${dish.name} ($${dish.price})`).join(", ");
                        rawResult = `Here are our ${dietary_preference.join(", ")} dishes: ${dishList}`;
                    }
            
                    console.log("Filtered dishes response:", rawResult);
                } catch (error) {
                    console.error("Error filtering dishes:", error);
                    rawResult = "I'm having trouble retrieving the menu right now. Please try again later.";
                }
            
                // Refine and send response
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
            }
            break;           
              

              case "check_doctors_available": {
                try {
                  console.log("Handling check_doctors_available intent:", intentData);
              
                  const { date } = intentData;
                  if (!date) {
                    rawResult = "Please provide a specific date to check doctor availability.";
                    break;
                  }
              
                  console.log("Checking availability for date:", date);
              
                  // Assuming all doctors work based on working days, find those who work on the given date's weekday
                  const cleanedDate = date.replace(/(\d+)(st|nd|rd|th)/, "$1"); // Remove suffixes
const parsedDate = new Date(cleanedDate + " 2025"); // Ensure valid format
if (isNaN(parsedDate)) {
  rawResult = "Invalid date format. Please provide a valid date.";
  break;
}
const dayOfWeek = parsedDate.toLocaleDateString("en-US", { weekday: "long" });

                  console.log(`Parsed date: ${date}, Day of week: ${dayOfWeek}`);
              
                  const doctors = await Doctor.find({ workingDays: dayOfWeek }, "name specialization workingHours");
              
                  if (doctors.length === 0) {
                    rawResult = `No doctors are available on ${date}. Please try another day.`;
                  } else {
                    // Format doctor list
                    const doctorList = doctors.map(doc =>
                      `📌 ${doc.name} (${doc.specialization}) - ${doc.workingHours}`
                    ).join("\n");
              
                    rawResult = `Here are the doctors available on ${date}:\n\n${doctorList}\n\nWould you like to book an appointment?`;
                  }
              
                  console.log("Available doctors response:", rawResult);
                } catch (error) {
                  console.error("Error checking doctor availability:", error);
                  rawResult = "I'm having trouble retrieving the doctor availability right now. Please try again later.";
                }
              
                // Refine and send response
                rawResult = await refineResponse(rawResult);
                res.json({ message: rawResult });
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
        rawResult = message;
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
