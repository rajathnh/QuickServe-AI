// routes/clinicRoutes.js
const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');

// Get all doctors
router.get('/doctors', clinicController.getDoctors);

router.post('/doctors', clinicController.addDoctor);

// Book a new appointment
router.post('/book-appointment', clinicController.bookAppointment);

// Get a specific appointment
router.get('/appointment/:appointmentId', clinicController.getAppointment);

// Get all appointments for a user (via query parameter)
router.get('/appointments', clinicController.getAppointmentsForUser);

// Update an appointment
router.put('/appointment/:appointmentId', clinicController.updateAppointment);

module.exports = router;
