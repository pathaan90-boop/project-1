const mongoose = require("mongoose");
const { LocalOrder } = require("../dataStore");

const OrderItemSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product"
    },
    name: String,
    price: Number,
    image: String,
    size: { type: String, default: "M" },
    color: { type: String, default: "Default" },
    qty: { type: Number, default: 1 }
}, { _id: false });

const ReturnRequestSchema = new mongoose.Schema({
    itemIndex: { type: Number, required: true, min: 0 },
    productId: { type: String, default: "" },
    productName: { type: String, required: true, trim: true },
    productImage: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    size: { type: String, default: "M" },
    color: { type: String, default: "Default" },
    reason: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true },
    requestedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ["Requested", "Approved", "Rejected", "Received", "Refunded"],
        default: "Requested"
    }
});

const OrderSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    name: String,
    price: Number,
    image: String,
    size: String,
    color: String,
    qty: Number,
    items: [OrderItemSchema],
    totalAmount: { type: Number, default: 0 },
    subtotal: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    customerName: { type: String, required: true },
    email: String,
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: String,
    pincode: String,
    state: String,
    location: { type: String },
    status: {
        type: String,
        enum: ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"],
        default: "Pending"
    },
    paymentMethod: {
        type: String,
        enum: ["COD", "UPI", "Card", "NetBanking"],
        default: "COD"
    },
    paymentStatus: {
        type: String,
        enum: ["Pending", "Initiated", "Paid", "Failed", "Refunded"],
        default: "Pending"
    },
    paymentDetails: {
        transactionId: String,
        upiId: String,
        paidAt: Date
    },
    deliveryOtp: { type: String },
    deliveryOtpEmailSentAt: { type: Date },
    otpVerified: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    returnRequests: { type: [ReturnRequestSchema], default: [] },
    cancelReason: String,
    createdAt: { type: Date, default: Date.now }
});

const MongooseOrder = mongoose.models.Order || mongoose.model("Order", OrderSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const OrderProxy = new Proxy(MongooseOrder, {
    construct(target, args) {
        if (isConnected()) {
            return new MongooseOrder(...args);
        }
        return new LocalOrder(...args);
    },
    get(target, prop) {
        if (isConnected()) {
            return MongooseOrder[prop];
        }
        return LocalOrder[prop] !== undefined ? LocalOrder[prop] : MongooseOrder[prop];
    }
});

module.exports = OrderProxy;