const Doctor = require('../models/Doctor');
const Clinic = require('../models/Clinic');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// 1. Retrieve all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Error retrieving doctors:', error);
    res.status(500).json({ message: 'Error retrieving doctors', error: error.message });
  }
};

// 2. Retrieve doctors according to specialization
const getDoctorsBySpecialization = async (req, res) => {
  try {
    const { specialization } = req.params;
    const doctors = await Doctor.find({ specialization });
    res.status(200).json({ doctors });
  } catch (error) {
    console.error('Error retrieving doctors by specialization:', error);
    res.status(500).json({ message: 'Error retrieving doctors by specialization', error: error.message });
  }
};

// 3. Return clinic timings
const getClinicTimings = async (req, res) => {
  try {
    const { clinicId } = req.params;
    const clinic = await Clinic.findById(clinicId);
    if (!clinic) {
      return res.status(404).json({ message: 'Clinic not found' });
    }
    res.status(200).json({ timings: clinic.timings });
  } catch (error) {
    console.error('Error retrieving clinic timings:', error);
    res.status(500).json({ message: 'Error retrieving clinic timings', error: error.message });
  }
};

// 4. Return individual doctor timings
const getDoctorTimings = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json({ workingHours: doctor.workingHours });
  } catch (error) {
    console.error('Error retrieving doctor timings:', error);
    res.status(500).json({ message: 'Error retrieving doctor timings', error: error.message });
  }
};

// 5. Add new doctor
const addNewDoctor = async (req, res) => {
  try {
    const {
      name,
      details,
      experience,
      specialization,
      dailyPatientLimit,
      workingHours,
      workingDays,
      consultationFee,
      allottedSlots, // Optional: array of time slots e.g., ["10:00 AM", "10:30 AM"]
      freeSlots      // Optional: available slots
    } = req.body;
    
    // Create and save the new doctor instance
    const doctor = new Doctor({
      name,
      details,
      experience,
      specialization,
      dailyPatientLimit,
      workingHours,
      workingDays,
      consultationFee,
      allottedSlots: allottedSlots || [],
      freeSlots: freeSlots || []
    });
    await doctor.save();
    res.status(201).json({ message: 'Doctor added successfully', doctor });
  } catch (error) {
    console.error('Error adding doctor:', error);
    res.status(500).json({ message: 'Error adding doctor', error: error.message });
  }
};

// 6. Book an appointment


const bookAppointment = async (req, res) => {
  try {
    const { clinic, patient, patientName, doctor, doctorName, appointmentTime, charges } = req.body;
    
    const appointment = new Appointment({
      clinic,
      patient,
      patientName,
      doctor,
      doctorName,
      appointmentTime,
      charges,
      status: 'Scheduled'
    });
    
    await appointment.save();

    // Update user's appointment history
    await User.findByIdAndUpdate(patient, { $push: { previousAppointments: appointment._id } });

    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ message: 'Error booking appointment', error: error.message });
  }
};


// 7. Retrieve appointment details
const getAppointmentDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId)
      .populate('clinic', 'name address timings')
      .populate('doctor', 'name specialization workingHours')
      .populate('patient', 'name email phoneNumber');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.status(200).json({ appointment });
  } catch (error) {
    console.error('Error retrieving appointment details:', error);
    res.status(500).json({ message: 'Error retrieving appointment details', error: error.message });
  }
};

// 8. Retrieve specific user appointments
const getUserAppointments = async (req, res) => {
    try {
      const { userId } = req.params;
      const appointments = await Appointment.find({ patient: userId })
        .populate('clinic', 'name address timings')
        .populate('doctor', 'name specialization workingHours')
        .populate('patient', 'name email phoneNumber');
      
      res.status(200).json({ appointments });
    } catch (error) {
      console.error('Error retrieving user appointments:', error);
      res.status(500).json({ message: 'Error retrieving user appointments', error: error.message });
    }
  };
  

module.exports = {
  getAllDoctors,
  getDoctorsBySpecialization,
  getClinicTimings,
  getDoctorTimings,
  addNewDoctor,
  bookAppointment,
  getAppointmentDetails,
  getUserAppointments
};
