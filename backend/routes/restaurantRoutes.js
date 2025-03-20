// backend/routes/restaurantRoutes.js
const express = require("express");
const router = express.Router();

// PLACE ORDER
// POST /api/v1/restaurant/order
router.post("/order", async (req, res) => {
  try {
    const { userId, items } = req.body; // items is an array of { itemId, quantity }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order items are required" });
    }

    const db = req.app.locals.db;
    let total = 0;
    const detailedItems = [];

    for (const item of items) {
      const menuItem = await db
        .collection("menu")
        .findOne({ _id: new require("mongodb").ObjectId(item.itemId) });
      if (!menuItem) {
        return res
          .status(404)
          .json({ error: `Menu item not found: ${item.itemId}` });
      }
      total += menuItem.price * item.quantity;
      detailedItems.push({
        itemId: menuItem._id,
        name: menuItem.name,
        quantity: item.quantity,
        price: menuItem.price,
      });
    }

    const order = {
      userId: userId || null,
      items: detailedItems,
      total,
      status: "pending",
      createdAt: new Date(),
      // You can calculate estimatedReadyTime if desired
    };

    const result = await db.collection("orders").insertOne(order);

    res.json({
      message: "Order placed successfully",
      order_id: result.insertedId,
      total,
    });
  } catch (error) {
    console.error("Place Order Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to place order", details: error.message });
  }
});

// CHECK MENU
// GET /api/v1/restaurant/menu
router.get("/menu", async (req, res) => {
  try {
    const db = req.app.locals.db;
    const menuItems = await db
      .collection("menu")
      .find({ available: true })
      .toArray();
    res.json(menuItems);
  } catch (error) {
    console.error("Check Menu Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to fetch menu", details: error.message });
  }
});

// CANCEL ORDER
// POST /api/v1/restaurant/cancel
router.post("/cancel", async (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) {
      return res.status(400).json({ error: "Order ID is required" });
    }
    const db = req.app.locals.db;
    const result = await db
      .collection("orders")
      .updateOne(
        { _id: new require("mongodb").ObjectId(order_id) },
        { $set: { status: "cancelled" } }
      );
    if (result.modifiedCount === 0) {
      return res
        .status(404)
        .json({ error: "Order not found or already cancelled" });
    }
    res.json({ message: "Order cancelled successfully" });
  } catch (error) {
    console.error("Cancel Order Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to cancel order", details: error.message });
  }
});

module.exports = router;
