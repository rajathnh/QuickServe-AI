const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinicController');

// Retrieve all doctors
router.get('/doctors', clinicController.getAllDoctors);

// Retrieve doctors by specialization (e.g., /doctors/specialization/Cardiology)
router.get('/doctors/specialization/:specialization', clinicController.getDoctorsBySpecialization);

// Get clinic timings by clinic id (e.g., /clinic/timings/60a...id)
router.get('/clinic/timings/:clinicId', clinicController.getClinicTimings);

// Get individual doctor timings by doctor id (e.g., /doctor/timings/60a...id)
router.get('/doctor/timings/:doctorId', clinicController.getDoctorTimings);

// Add a new doctor
router.post('/doctor', clinicController.addNewDoctor);

// Book an appointment
router.post('/appointment', clinicController.bookAppointment);

// Retrieve appointment details by appointment id
router.get('/appointment/:appointmentId', clinicController.getAppointmentDetails);

// Retrieve specific user appointments
router.get('/appointments/user/:userId', clinicController.getUserAppointments);

module.exports = router;
