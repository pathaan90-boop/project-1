const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { profile: upload } = require("../middleware/upload");
const router = express.Router();
const { uploadProfileImage } = require("../services/cloudinary");

const User = require("../models/User");
const auth = require("../middleware/auth");

function addLegacyAddress(user) {
    if (!Array.isArray(user.addresses)) user.addresses = [];
    if (user.addresses.length || !String(user.address || "").trim()) return false;

    user.addresses.push({
        label: "Home",
        name: user.name || "",
        phone: user.phone || "",
        address: user.address,
        city: user.city || "",
        state: user.state || "",
        pincode: user.pincode || "",
        isDefault: true
    });
    return true;
}

function syncDefaultAddress(user) {
    const defaultAddress = user.addresses.find(address => address.isDefault);
    if (!defaultAddress) return;
    if (defaultAddress.name) user.name = defaultAddress.name;
    if (defaultAddress.phone) user.phone = defaultAddress.phone;
    user.address = defaultAddress.address;
    user.city = defaultAddress.city;
    user.state = defaultAddress.state;
    user.pincode = defaultAddress.pincode;
}

function normalizeAddress(input = {}) {
    return {
        label: String(input.label || "Home").trim(),
        name: String(input.name || "").trim(),
        phone: String(input.phone || "").trim(),
        address: String(input.address || "").trim(),
        city: String(input.city || "").trim(),
        state: String(input.state || "").trim(),
        pincode: String(input.pincode || "").trim()
    };
}

function hasRequiredAddressFields(address) {
    return ["name", "phone", "address", "city", "state", "pincode"]
        .every(field => address[field]);
}

// GET LANGUAGE AND CURRENCY PREFERENCES
router.get("/preferences", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("language currency notifications");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json({
            language: user.language || "en",
            currency: user.currency || "INR",
            notifications: {
                orderUpdates: Boolean(user.notifications && user.notifications.orderUpdates),
                offersPromotions: Boolean(user.notifications && user.notifications.offersPromotions)
            }
        });
    } catch (err) {
        console.error("Get Preferences Error:", err);
        res.status(500).json({ msg: "Server error fetching preferences" });
    }
});

// 1. GET PROFILE
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -otp -otpExpires");
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }
        res.json(user);
    } catch (err) {
        console.error("Get Profile Error:", err);
        res.status(500).json({ msg: "Server error fetching profile" });
    }
});

// 1.1. UPDATE LANGUAGE AND CURRENCY PREFERENCES
router.put("/preferences", auth, async (req, res) => {
    try {
        const { language, currency, notifications } = req.body;
        if (language !== undefined && !["en", "hi"].includes(language)) {
            return res.status(400).json({ msg: "Language must be en or hi" });
        }
        if (currency !== undefined && !["INR", "USD"].includes(currency)) {
            return res.status(400).json({ msg: "Currency must be INR or USD" });
        }
        if (notifications !== undefined && (
            !notifications ||
            typeof notifications.orderUpdates !== "boolean" ||
            typeof notifications.offersPromotions !== "boolean"
        )) {
            return res.status(400).json({ msg: "Notification preferences must include orderUpdates and offersPromotions booleans" });
        }
        if (language === undefined && currency === undefined && notifications === undefined) {
            return res.status(400).json({ msg: "Provide a language, currency, or notification preference" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (language !== undefined) user.language = language;
        if (currency !== undefined) user.currency = currency;
        if (notifications !== undefined) user.notifications = notifications;
        await user.save();

        res.json({
            msg: "Settings saved to your account",
            preferences: {
                language: user.language || "en",
                currency: user.currency || "INR",
                notifications: user.notifications
            }
        });
    } catch (err) {
        console.error("Update Preferences Error:", err);
        res.status(500).json({ msg: "Server error saving preferences" });
    }
});

router.get("/addresses", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        if (addLegacyAddress(user)) await user.save();
        res.json({ addresses: user.addresses || [] });
    } catch (err) {
        console.error("Get Addresses Error:", err);
        res.status(500).json({ msg: "Server error fetching delivery addresses" });
    }
});

router.post("/addresses", auth, async (req, res) => {
    try {
        const address = normalizeAddress(req.body);
        if (!hasRequiredAddressFields(address)) {
            return res.status(400).json({ msg: "Name, phone, address, city, state, and pincode are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        addLegacyAddress(user);
        if (!Array.isArray(user.addresses)) user.addresses = [];
        const isDefault = req.body.isDefault === true || !user.addresses.some(item => item.isDefault);
        if (isDefault) user.addresses.forEach(item => { item.isDefault = false; });
        const newAddress = { ...address, isDefault, _id: new mongoose.Types.ObjectId().toString() };
        user.addresses.push(newAddress);
        syncDefaultAddress(user);
        await user.save();
        res.status(201).json({ msg: "Delivery address added", address: newAddress, addresses: user.addresses });
    } catch (err) {
        console.error("Add Address Error:", err);
        res.status(500).json({ msg: "Server error adding delivery address" });
    }
});

router.put("/addresses/:addressId", auth, async (req, res) => {
    try {
        const address = normalizeAddress(req.body);
        if (!hasRequiredAddressFields(address)) {
            return res.status(400).json({ msg: "Name, phone, address, city, state, and pincode are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        addLegacyAddress(user);
        const current = (user.addresses || []).find(item => String(item._id) === req.params.addressId);
        if (!current) return res.status(404).json({ msg: "Delivery address not found" });

        Object.assign(current, address);
        if (req.body.isDefault === true) {
            user.addresses.forEach(item => { item.isDefault = String(item._id) === req.params.addressId; });
        } else if (req.body.isDefault === false && current.isDefault) {
            current.isDefault = false;
        }
        if (!user.addresses.some(item => item.isDefault) && user.addresses.length) {
            user.addresses[0].isDefault = true;
        }
        syncDefaultAddress(user);
        await user.save();
        res.json({ msg: "Delivery address updated", address: current, addresses: user.addresses });
    } catch (err) {
        console.error("Update Address Error:", err);
        res.status(500).json({ msg: "Server error updating delivery address" });
    }
});

router.put("/addresses/:addressId/default", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        addLegacyAddress(user);
        const selected = (user.addresses || []).find(item => String(item._id) === req.params.addressId);
        if (!selected) return res.status(404).json({ msg: "Delivery address not found" });
        user.addresses.forEach(item => { item.isDefault = String(item._id) === req.params.addressId; });
        syncDefaultAddress(user);
        await user.save();
        res.json({ msg: "Default delivery address updated", addresses: user.addresses });
    } catch (err) {
        console.error("Set Default Address Error:", err);
        res.status(500).json({ msg: "Server error setting default address" });
    }
});

router.delete("/addresses/:addressId", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });
        addLegacyAddress(user);
        const addressIndex = (user.addresses || []).findIndex(item => String(item._id) === req.params.addressId);
        if (addressIndex === -1) return res.status(404).json({ msg: "Delivery address not found" });
        user.addresses.splice(addressIndex, 1);
        if (user.addresses.length && !user.addresses.some(item => item.isDefault)) {
            user.addresses[0].isDefault = true;
        }
        if (user.addresses.length) {
            syncDefaultAddress(user);
        } else {
            user.address = "";
            user.city = "";
            user.state = "";
            user.pincode = "";
        }
        await user.save();
        res.json({ msg: "Delivery address deleted", addresses: user.addresses });
    } catch (err) {
        console.error("Delete Address Error:", err);
        res.status(500).json({ msg: "Server error deleting delivery address" });
    }
});

// Upload and save the signed-in user's profile photo
router.post("/image", auth, (req, res, next) => {
    upload.single("profileImage")(req, res, err => {
        if (err) {
            const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            return res.status(status).json({ msg: err.message || "Could not upload profile photo" });
        }
        next();
    });
}, async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ msg: "Choose an image to upload" });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        user.profileImage = req.file.buffer
            ? await uploadProfileImage(req.file)
            : `/uploads/${req.file.filename}`;
        await user.save();

        res.json({
            msg: "Profile photo saved to your account",
            profileImage: user.profileImage
        });
    } catch (err) {
        console.error("Upload Profile Photo Error:", err);
        res.status(500).json({ msg: "Server error saving profile photo" });
    }
});

// 2. UPDATE PROFILE
router.put("/update", auth, async (req, res) => {
    try {
        const { name, phone, address, city, pincode, state, profileImage } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (name) user.name = name.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address !== undefined) user.address = address.trim();
        if (city !== undefined) user.city = city.trim();
        if (pincode !== undefined) user.pincode = pincode.trim();
        if (state !== undefined) user.state = state.trim();
        if (profileImage !== undefined) user.profileImage = profileImage.trim();

        const defaultAddress = Array.isArray(user.addresses)
            ? user.addresses.find(item => item.isDefault)
            : null;
        if (defaultAddress) {
            if (name) defaultAddress.name = user.name;
            if (phone !== undefined) defaultAddress.phone = user.phone;
            if (address !== undefined) defaultAddress.address = user.address;
            if (city !== undefined) defaultAddress.city = user.city;
            if (pincode !== undefined) defaultAddress.pincode = user.pincode;
            if (state !== undefined) defaultAddress.state = user.state;
        }

        await user.save();

        res.json({
            msg: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                city: user.city,
                pincode: user.pincode,
                state: user.state,
                profileImage: user.profileImage,
                isAdmin: user.isAdmin
            }
        });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ msg: "Server error updating profile" });
    }
});

// 3. CHANGE PASSWORD
router.put("/password", auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: "Current and new password are required" });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ msg: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Current password does not match" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetCodeHash = "";
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        await user.save();

        res.json({ msg: "Password changed successfully" });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ msg: "Server error updating password" });
    }
});

// 4. GET ALL CLIENTS (Admin only)
const admin = require("../middleware/admin");
router.get("/all", auth, admin, async (req, res) => {
    try {
        const users = await User.find().select("-password -otp -otpExpires");
        res.json(users);
    } catch (err) {
        console.error("Get All Clients Error:", err);
        res.status(500).json({ msg: "Server error fetching clients" });
    }
});

module.exports = router;