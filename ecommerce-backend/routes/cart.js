const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Cart = require("../models/Cart");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// 1. CLEAR ENTIRE CART (Defined BEFORE /:id route so it doesn't get captured by param)
router.delete("/clear/all", auth, async (req, res) => {
    try {
        await Cart.deleteMany({ userId: req.user.id });
        res.json({ msg: "Cart cleared successfully" });
    } catch (err) {
        console.error("Clear Cart Error:", err);
        res.status(500).json({ msg: "Server error clearing cart" });
    }
});

// 2. GET CART ITEMS FOR CURRENT USER
router.get("/", auth, async (req, res) => {
    try {
        const items = await Cart.find({ userId: req.user.id })
            .populate("productId")
            .sort({ addedAt: -1 });

        // Filter out items where the product might have been deleted from DB
        const validItems = items.filter(item => item.productId !== null);
        res.json(validItems);
    } catch (err) {
        console.error("Get Cart Error:", err);
        res.status(500).json({ msg: "Server error fetching cart" });
    }
});

// 3. ADD ITEM TO CART
router.post("/add", auth, async (req, res) => {
    try {
        const { productId, quantity, size, color } = req.body;

        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ msg: "Valid Product ID is required" });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }

        const qtyToAdd = Math.max(1, parseInt(quantity) || 1);
        const itemSize = size || (product.sizes && product.sizes[0]) || "M";
        const itemColor = color || (product.colors && product.colors[0]) || "Default";

        // Check if same product with same size & color already in cart
        let existing = await Cart.findOne({
            userId: req.user.id,
            productId,
            size: itemSize,
            color: itemColor
        });

        if (existing) {
            existing.quantity += qtyToAdd;
            await existing.save();
            return res.json({ msg: "Cart quantity updated", cartItem: existing });
        }

        const newItem = new Cart({
            userId: req.user.id,
            productId,
            quantity: qtyToAdd,
            size: itemSize,
            color: itemColor
        });

        await newItem.save();
        res.status(201).json({ msg: "Added to cart successfully", cartItem: newItem });
    } catch (err) {
        console.error("Add Cart Error:", err);
        res.status(500).json({ msg: "Server error adding to cart" });
    }
});

// 4. UPDATE CART ITEM QUANTITY
router.put("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid cart item ID" });
        }

        const item = await Cart.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: "Cart item not found" });

        if (String(item.userId) !== String(req.user.id)) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        const newQty = parseInt(req.body.quantity);
        if (newQty <= 0) {
            await item.deleteOne();
            return res.json({ msg: "Item removed from cart" });
        }

        item.quantity = newQty;
        if (req.body.size) item.size = req.body.size;
        if (req.body.color) item.color = req.body.color;
        await item.save();

        res.json({ msg: "Cart quantity updated", cartItem: item });
    } catch (err) {
        console.error("Update Cart Error:", err);
        res.status(500).json({ msg: "Server error updating cart" });
    }
});

// 5. REMOVE ITEM FROM CART
router.delete("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid cart item ID" });
        }

        const item = await Cart.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: "Item not found in cart" });

        if (String(item.userId) !== String(req.user.id)) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        await item.deleteOne();
        res.json({ msg: "Item removed from cart" });
    } catch (err) {
        console.error("Delete Cart Error:", err);
        res.status(500).json({ msg: "Server error removing cart item" });
    }
});

module.exports = router;