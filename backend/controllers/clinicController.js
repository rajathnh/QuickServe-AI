// controllers/clinicController.js
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

/**
 * GET /api/doctors
 * Retrieve a list of all available doctors.
 */
exports.getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving doctors', error: err.message });
  }
};

/**
 * POST /api/book-appointment
 * Book a new appointment.
 * Expected JSON body:
 * {
 *   "userId": "user_object_id",
 *   "doctorId": "doctor_object_id",
 *   "date": "YYYY-MM-DD",
 *   "time": "HH:MM AM/PM"
 * }
 */
exports.bookAppointment = async (req, res) => {
  try {
    const { user_id, doctor, date, time } = req.body;

    // Optional: Validate doctor availability here if needed.

    const newAppointment = new Appointment({
      user_id: user_id,
      doctor: doctor,
      date,
      time,
      status: 'Booked'
    });

    await newAppointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment: newAppointment });
  } catch (err) {
    res.status(500).json({ message: 'Error booking appointment', error: err.message });
  }
};

/**
 * GET /api/appointment/:appointmentId
 * Retrieve details of a specific appointment.
 */
exports.getAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('doctor')
      .populate('user');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointment', error: err.message });
  }
};

/**
 * GET /api/appointments?userId=...
 * Retrieve all appointments for a given user.
 */
exports.getAppointmentsForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }
    const appointments = await Appointment.find({ user: userId }).populate('doctor');
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving appointments', error: err.message });
  }
};

/**
 * PUT /api/appointment/:appointmentId
 * Update an existing appointment.
 * Expected JSON body (any of these fields can be updated):
 * {
 *   "date": "YYYY-MM-DD",
 *   "time": "HH:MM AM/PM",
 *   "status": "Updated"
 * }
 */
exports.updateAppointment = async (req, res) => {
  try {
    const { date, time, status } = req.body;
    const appointment = await Appointment.findById(req.params.appointmentId);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (status) appointment.status = status;
    await appointment.save();
    res.json({ message: 'Appointment updated successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Error updating appointment', error: err.message });
  }
};

exports.addDoctor = async (req, res) => {
    try {
      const { name, specialization, available_slots, fee } = req.body;
  
      // Create a new Doctor document
      const newDoctor = new Doctor({
        name,
        specialization,
        available_slots,
        fee
      });
  
      await newDoctor.save();
      res.status(201).json({ message: 'Doctor added successfully', doctor: newDoctor });
    } catch (error) {
      res.status(500).json({ message: 'Error adding doctor', error: error.message });
    }
  };