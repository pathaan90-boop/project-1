const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const auth = require("../middleware/auth");

// 1. GET USER WISHLIST
router.get("/", auth, async (req, res) => {
    try {
        const items = await Wishlist.find({ userId: req.user.id })
            .populate("productId")
            .sort({ addedAt: -1 });

        const validItems = items.filter(item => item.productId !== null);
        res.json(validItems);
    } catch (err) {
        console.error("Get Wishlist Error:", err);
        res.status(500).json({ msg: "Server error fetching wishlist" });
    }
});

// 2. ADD PRODUCT TO WISHLIST
router.post("/add", auth, async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ msg: "Valid Product ID is required" });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        const exists = await Wishlist.findOne({ userId: req.user.id, productId });
        if (exists) {
            return res.json({ msg: "Product already in wishlist", inWishlist: true });
        }

        const item = new Wishlist({ userId: req.user.id, productId });
        await item.save();

        res.status(201).json({ msg: "Added to wishlist", inWishlist: true, item });
    } catch (err) {
        console.error("Add Wishlist Error:", err);
        res.status(500).json({ msg: "Server error adding to wishlist" });
    }
});

// 3. REMOVE PRODUCT FROM WISHLIST (by productId)
router.delete("/:productId", auth, async (req, res) => {
    try {
        const { productId } = req.params;
        await Wishlist.findOneAndDelete({ userId: req.user.id, productId });
        res.json({ msg: "Removed from wishlist", inWishlist: false });
    } catch (err) {
        console.error("Remove Wishlist Error:", err);
        res.status(500).json({ msg: "Server error removing from wishlist" });
    }
});

module.exports = router;
