const Menu = require('../models/Menu');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Review = require('../models/Review');
const User = require('../models/User');


// 1. Check Menu: Retrieve all menu items for a given restaurant
const checkMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const menuItems = await Menu.find({ restaurant: restaurantId });
    res.status(200).json({ menuItems });
  } catch (error) {
    console.error('Error retrieving menu:', error);
    res.status(500).json({ message: 'Error retrieving menu', error: error.message });
  }
};

// 2. Find Food According to Specific Food Labelling
const findFoodByFoodLabelling = async (req, res) => {
  try {
    const { labelling } = req.params;
    const restaurants = await Restaurant.find({ foodLabelling: labelling });
    if (restaurants.length === 0) {
      return res.status(404).json({ message: 'No restaurants found with this food labelling' });
    }
    const restaurantIds = restaurants.map(r => r._id);
    const menuItems = await Menu.find({ restaurant: { $in: restaurantIds } });
    res.status(200).json({ menuItems });
  } catch (error) {
    console.error('Error finding food by labelling:', error);
    res.status(500).json({ message: 'Error finding food by labelling', error: error.message });
  }
};

// 3. Get Details of a Particular Dish
const getDishDetails = async (req, res) => {
  try {
    const { dishId } = req.params;
    const dish = await Menu.findById(dishId).populate('restaurant', 'name address');
    if (!dish) {
      return res.status(404).json({ message: 'Dish not found' });
    }
    res.status(200).json({ dish });
  } catch (error) {
    console.error('Error retrieving dish details:', error);
    res.status(500).json({ message: 'Error retrieving dish details', error: error.message });
  }
};



const placeOrder = async (req, res) => {
  try {
    const { user, items, type } = req.body;
    let totalPrice = 0;
    let totalDuration = 0;
    
    for (const item of items) {
      const menuItem = await Menu.findById(item.menuItem);
      if (!menuItem) {
        return res.status(404).json({ message: `Menu item not found: ${item.menuItem}` });
      }
      totalPrice += menuItem.price * item.quantity;
      if (menuItem.preparationDuration) {
        totalDuration += menuItem.preparationDuration * item.quantity;
      }
    }
    
    const order = new Order({
      user,
      items,
      totalPrice,
      totalDuration,
      type,
      status: 'Pending'
    });
    
    await order.save();

    // Update user's order history
    await User.findByIdAndUpdate(user, { $push: { orderHistory: order._id } });
    
    res.status(201).json({ message: 'Order placed successfully', order });
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Error placing order', error: error.message });
  }
};


// 5. Get Estimated Order Preparation Time
const getOrderEstimatedTime = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json({ estimatedTime: order.totalDuration });
  } catch (error) {
    console.error('Error retrieving order estimated time:', error);
    res.status(500).json({ message: 'Error retrieving order estimated time', error: error.message });
  }
};

// 6. Add Review and Rating for a Restaurant
const addReview = async (req, res) => {
  try {
    const { restaurantId, user, rating, comment } = req.body;
    
    // Create a new review
    const review = new Review({
      user,
      rating,
      comment
    });
    
    await review.save();
    
    // Update the Restaurant: add review to its reviews array
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    restaurant.reviews.push(review._id);
    
    // Optionally update the restaurant's star rating based on all reviews
    const reviews = await Review.find({ _id: { $in: restaurant.reviews } });
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    restaurant.starRatings = avgRating;
    
    await restaurant.save();
    
    res.status(201).json({ message: 'Review added successfully', review });
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};

// 7. Get Restaurant Details (with reviews and menu items)
const getRestaurantDetails = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await Restaurant.findById(restaurantId).populate('reviews');
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    // Retrieve menu items for the restaurant from the Menu collection
    const menuItems = await Menu.find({ restaurant: restaurantId });
    
    res.status(200).json({ restaurant, menu: menuItems });
  } catch (error) {
    console.error('Error retrieving restaurant details:', error);
    res.status(500).json({ message: 'Error retrieving restaurant details', error: error.message });
  }
};

const addMenuItem = async (req, res) => {
    try {
      const {
        name,
        briefDescription,
        ingredients,
        nutritionalValue,
        calories,
        preparationDuration,
        stars,
        description,
        price,
        servingSize,
        taste,
        restaurant
      } = req.body;
  
      // Create a new Menu item
      const menuItem = new Menu({
        name,
        briefDescription,
        ingredients,
        nutritionalValue,
        calories,
        preparationDuration,
        stars,
        description,
        price,
        servingSize,
        taste,
        restaurant
      });
  
      // Save the menu item to the database
      await menuItem.save();
      res.status(201).json({ message: 'Menu item added successfully', menuItem });
    } catch (error) {
      console.error('Error adding menu item:', error);
      res.status(500).json({ message: 'Error adding menu item', error: error.message });
    }
  };

  
module.exports = {
  checkMenu,
  findFoodByFoodLabelling,
  getDishDetails,
  placeOrder,
  getOrderEstimatedTime,
  addReview,
  getRestaurantDetails,
  addMenuItem 
};
