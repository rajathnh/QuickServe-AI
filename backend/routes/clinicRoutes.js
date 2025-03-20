// backend/routes/clinicRoutes.js
const express = require("express");
const router = express.Router();

// BOOK APPOINTMENT
// POST /api/v1/clinic/book
router.post("/book", async (req, res) => {
  try {
    const { doctor_name, date, time, patientName, patientPhone } = req.body;
    if (!doctor_name || !date || !time || !patientName) {
      return res.status(400).json({ error: "Missing appointment details" });
    }

    // Find the doctor by name (assuming doctor names are unique; otherwise, adjust accordingly)
    const db = req.app.locals.db;
    const doctor = await db
      .collection("doctors")
      .findOne({ name: doctor_name });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Create the appointment document
    const appointment = {
      doctorId: doctor._id,
      patientName,
      patientPhone: patientPhone || "",
      appointmentTime: new Date(`${date} ${time}`),
      status: "confirmed",
      createdAt: new Date(),
    };

    const result = await db.collection("appointments").insertOne(appointment);

    res.json({
      message: "Appointment booked successfully",
      appointment_id: result.insertedId,
    });
  } catch (error) {
    console.error("Booking Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to book appointment", details: error.message });
  }
});

// CHECK AVAILABILITY
// POST /api/v1/clinic/availability
router.post("/availability", async (req, res) => {
  try {
    const { doctor_name, date } = req.body;
    if (!doctor_name || !date) {
      return res
        .status(400)
        .json({ error: "Doctor name and date are required" });
    }

    const db = req.app.locals.db;
    const doctor = await db
      .collection("doctors")
      .findOne({ name: doctor_name });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Find the schedule for the given date.
    const scheduleEntry = doctor.schedule.find((entry) => {
      // Compare date parts only
      const entryDate = new Date(entry.date).toDateString();
      return entryDate === new Date(date).toDateString();
    });

    if (!scheduleEntry) {
      return res
        .status(404)
        .json({ error: "No schedule available for that date" });
    }

    // Optionally, you could also check existing appointments to filter out booked slots.
    const bookedSlots = await db
      .collection("appointments")
      .find({
        doctorId: doctor._id,
        appointmentTime: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).setDate(new Date(date).getDate() + 1)),
        },
      })
      .toArray();

    // Extract times already booked
    const bookedTimes = bookedSlots.map((a) =>
      new Date(a.appointmentTime).toTimeString().substring(0, 5)
    );

    // Filter available slots (assuming scheduleEntry.slots are strings like "09:00", "10:00", etc.)
    const availableSlots = scheduleEntry.slots.filter(
      (slot) => !bookedTimes.includes(slot)
    );

    res.json({ doctor_name, date, availableSlots });
  } catch (error) {
    console.error("Availability Check Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to check availability", details: error.message });
  }
});

// CANCEL APPOINTMENT
// POST /api/v1/clinic/cancel
router.post("/cancel", async (req, res) => {
  try {
    const { appointment_id } = req.body;
    if (!appointment_id) {
      return res.status(400).json({ error: "Appointment ID is required" });
    }

    const db = req.app.locals.db;
    const result = await db
      .collection("appointments")
      .updateOne(
        { _id: new require("mongodb").ObjectId(appointment_id) },
        { $set: { status: "cancelled" } }
      );

    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Appointment not found or already cancelled" });
    }

    res.json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Cancel Appointment Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to cancel appointment", details: error.message });
  }
});

module.exports = router;
