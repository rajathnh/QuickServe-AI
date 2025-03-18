// controllers/restaurantController.js
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// Retrieve all restaurants
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving restaurants', error: err.message });
  }
};

// Retrieve the menu for a specific restaurant by its ID
const getRestaurantMenu = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    res.json(restaurant.menu_items);
  } catch (err) {
    res.status(500).json({ message: 'Server error retrieving menu', error: err.message });
  }
};

// Place a new order
const placeOrder = async (req, res) => {
  try {
    const { userId, restaurantId, items } = req.body;

    const newOrder = new Order({
      user: userId,
      restaurant: restaurantId,
      items,      
      status: 'Pending'
    });

    await newOrder.save();
    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: 'Error placing order', error: err.message });
  }
};

// Retrieve details of a specific order by its ID
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate('restaurant')
      .populate('user');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order', error: err.message });
  }
};

// Retrieve all orders for a given user (query parameter: userId)
const getOrdersForUser = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: 'UserId is required' });
    }
    const orders = await Order.find({ user: userId }).populate('restaurant');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving orders', error: err.message });
  }
};

// Update an existing order (if modifications are allowed)
const updateOrder = async (req, res) => {
  try {
    const { items, status } = req.body;
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    if (items) order.items = items;
    
    if (status) order.status = status;

    await order.save();
    res.json({ message: 'Order updated successfully', order });
  } catch (err) {
    res.status(500).json({ message: 'Error updating order', error: err.message });
  }
};


const addRestaurant = async (req, res) => {
    try {
      const newRestaurant = new Restaurant(req.body);
      await newRestaurant.save();
      res.status(201).json({ message: 'Restaurant added successfully', restaurant: newRestaurant });
    } catch (err) {
      res.status(500).json({ message: 'Error adding restaurant', error: err.message });
    }
  };
  

module.exports = {
    getRestaurants,
    getRestaurantMenu,
    placeOrder,
    getOrder,
    getOrdersForUser,
    updateOrder,
    addRestaurant,
  };