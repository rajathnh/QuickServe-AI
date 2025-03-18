// authController.js
const User = require('../models/User'); // Adjust the path as needed
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Registration function
const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login function
const login = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      // Create payload for JWT
      const payload = {
        id: user._id,
        username: user.username,
        role: user.role
      };
  
      // Sign JWT token
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
  
      // Set token in a signed, HTTP-only cookie
      res.cookie('token', token, {
        httpOnly: true,
        signed: true,
        // secure: process.env.NODE_ENV === 'production' // Uncomment if using HTTPS in production
      });
  
      res.status(200).json({ message: 'Login successful' });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  };
  

// Logout function
const logout = async (req, res) => {
  // Since JWT is stateless, the simplest way to "logout" is to let the client delete the token.
  // If you want server-side logout, implement token blacklisting.
  res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { register, login, logout };
