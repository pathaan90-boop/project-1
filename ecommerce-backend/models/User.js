const mongoose = require("mongoose");
const { LocalUser } = require("../dataStore");

const AddressSchema = new mongoose.Schema({
    label: { type: String, default: "Home", trim: true },
    name: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    state: { type: String, default: "", trim: true },
    pincode: { type: String, default: "", trim: true },
    isDefault: { type: Boolean, default: false }
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    pincode: { type: String, default: "" },
    state: { type: String, default: "" },
    otp: { type: String, default: "" },
    otpExpires: { type: Date },
    passwordResetCodeHash: { type: String, default: "" },
    passwordResetExpires: { type: Date, default: null },
    passwordResetAttempts: { type: Number, default: 0, min: 0 },
    verified: { type: Boolean, default: false },
    googleId: { type: String, default: "" },
    profileImage: { type: String, default: "https://i.ibb.co/4pDNDk1/avatar.png" },
    language: { type: String, enum: ["en", "hi"], default: "en" },
    currency: { type: String, enum: ["INR", "USD"], default: "INR" },
    notifications: {
        orderUpdates: { type: Boolean, default: false },
        offersPromotions: { type: Boolean, default: false }
    },
    addresses: { type: [AddressSchema], default: [] },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const MongooseUser = mongoose.models.User || mongoose.model("User", UserSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const UserProxy = new Proxy(MongooseUser, {
    construct(target, args) {
        if (isConnected()) {
            return new MongooseUser(...args);
        }
        return new LocalUser(...args);
    },
    get(target, prop) {
        if (isConnected()) {
            return MongooseUser[prop];
        }
        return LocalUser[prop] !== undefined ? LocalUser[prop] : MongooseUser[prop];
    }
});

module.exports = UserProxy;