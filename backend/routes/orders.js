const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const router = express.Router();

const Order = require("../models/Order");
const Product = require("../models/Product");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { ORDER_CONFIRMATION_DELAY_MS, confirmExpiredPendingOrders } = require("../services/orderLifecycle");
const getTransporter = require("../services/emailTransporter");

const RETURN_WINDOW_MS = 3 * 60 * 60 * 1000;
const ACTIVE_RETURN_STATUSES = new Set(["Requested", "Approved", "Received", "Refunded"]);
const ORDER_PAYMENT_METHODS = new Set(["COD", "UPI", "Card", "NetBanking"]);
const RETURN_STATUS_TRANSITIONS = {
    Requested: new Set(["Approved", "Rejected"]),
    Approved: new Set(["Received", "Rejected"]),
    Received: new Set(["Refunded"]),
    Rejected: new Set(),
    Refunded: new Set()
};

function sanitizeOrder(order) {
    if (!order) return order;
    const safeOrder = typeof order.toObject === "function" ? order.toObject() : { ...order };
    delete safeOrder.deliveryOtp;
    return safeOrder;
}

// 1. CREATE ORDER (Authenticated customer)
router.post("/add", auth, async (req, res) => {
    try {
        const {
            name, price, image, size, color, qty,
            items, subtotal, shippingFee, discount, totalAmount,
            customerName, email, phone, address, city, pincode, state, location,
            paymentMethod, paymentDetails
        } = req.body;

        if (!customerName || !phone || !address) {
            return res.status(400).json({ msg: "Customer Name, Phone and Address are required" });
        }

        const normalizedPaymentMethod = paymentMethod === "ONLINE" ? "Card" : (paymentMethod || "COD");
        if (!ORDER_PAYMENT_METHODS.has(normalizedPaymentMethod)) {
            return res.status(400).json({ msg: "Invalid payment method" });
        }

        let finalItems = items || [];
        let calculatedTotal = totalAmount || 0;

        // If single item order sent (e.g. from Buy Now button)
        if (!finalItems.length && name && price) {
            finalItems = [{
                name,
                price: Number(price),
                image: image || "",
                size: size || "M",
                color: color || "Default",
                qty: Number(qty) || 1
            }];
            calculatedTotal = Number(price) * (Number(qty) || 1);
        } else if (finalItems.length && !calculatedTotal) {
            calculatedTotal = finalItems.reduce((acc, it) => acc + (it.price * (it.qty || 1)), 0);
        }

        const newOrder = new Order({
            id: new mongoose.Types.ObjectId().toString(),
            userId: req.user.id,
            // Single-item fallback fields for backwards compatibility
            name: (finalItems[0] && finalItems[0].name) || name || "Order Item",
            price: (finalItems[0] && finalItems[0].price) || price || calculatedTotal,
            image: (finalItems[0] && finalItems[0].image) || image || "",
            size: (finalItems[0] && finalItems[0].size) || size || "M",
            color: (finalItems[0] && finalItems[0].color) || color || "Default",
            qty: (finalItems[0] && finalItems[0].qty) || qty || 1,

            // Multi-item details
            items: finalItems,
            subtotal: subtotal || calculatedTotal,
            shippingFee: shippingFee || 0,
            discount: discount || 0,
            totalAmount: calculatedTotal,

            customerName: customerName.trim(),
            email: email || req.user.email || "",
            phone: phone.trim(),
            address: address.trim(),
            city: city || "",
            pincode: pincode || "",
            state: state || "",
            location: location || "",

            paymentMethod: normalizedPaymentMethod,
            paymentStatus: normalizedPaymentMethod === "COD" ? "Pending" : "Initiated",
            paymentDetails: paymentDetails || {},

            status: "Pending"
        });

        await newOrder.save();

        // Reduce product stock if productId is present
        for (const it of finalItems) {
            if (it.productId && mongoose.Types.ObjectId.isValid(it.productId)) {
                await Product.findByIdAndUpdate(it.productId, {
                    $inc: { stock: -(it.qty || 1) }
                }).catch(() => {});
            }
        }

        // Send confirmation email without the delivery OTP.
        const recipientEmail = email || req.user.email;
        if (recipientEmail) {
            const transporter = getTransporter();
            if (transporter) {
                transporter.sendMail({
                    from: `"Pathaan Collection" <${process.env.EMAIL}>`,
                    to: recipientEmail,
                    subject: `Order Confirmation #${newOrder._id.toString().slice(-6).toUpperCase()} - Pathaan Collection`,
                    text: `Thank you for shopping with us, ${customerName}.\nOrder ID: #${newOrder._id.toString().slice(-6).toUpperCase()}\nTotal Amount: ₹${calculatedTotal} (${normalizedPaymentMethod})\nDelivery Address: ${address}`
                }).catch(err => console.error("Order email error:", err.message));
            }
        }

        res.status(201).json({
            msg: "Order Placed Successfully",
            order: sanitizeOrder(newOrder)
        });
    } catch (err) {
        console.error("Add Order Error:", err);
        res.status(500).json({ msg: "Server error while placing order: " + err.message });
    }
});

// 2. GET USER'S OWN ORDERS
router.get("/my", auth, async (req, res) => {
    try {
        await confirmExpiredPendingOrders();
        const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(orders.map(sanitizeOrder));
    } catch (err) {
        console.error("Get My Orders Error:", err);
        res.status(500).json({ msg: "Server error fetching user orders" });
    }
});

// Pending return requests for the admin alert badge and new-request notifications.
router.get("/return-requests", auth, admin, async (req, res) => {
    try {
        const orders = await Order.find({});
        const requests = orders.flatMap(order =>
            (order.returnRequests || [])
                .filter(request => (request.status || "Requested") === "Requested")
                .map(request => ({
                    orderId: String(order._id),
                    orderRef: order.orderRef || String(order._id).slice(-6).toUpperCase(),
                    customerName: order.customerName || "Customer",
                    productName: request.productName || "Returned product",
                    requestedAt: request.requestedAt,
                    returnRequestId: String(request._id)
                }))
        );
        res.json(requests);
    } catch (err) {
        console.error("Get Pending Return Requests Error:", err);
        res.status(500).json({ msg: "Server error fetching pending return requests" });
    }
});

// 3. ADMIN STATS SUMMARY (Admin only)
router.get("/stats/summary", auth, admin, async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const pendingOrders = await Order.countDocuments({ status: "Pending" });
        const deliveredOrders = await Order.countDocuments({ status: "Delivered" });
        const cancelledOrders = await Order.countDocuments({ status: "Cancelled" });

        const orders = await Order.find({ status: { $ne: "Cancelled" } });
        const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || o.price || 0), 0);

        const Product = require("../models/Product");
        const User = require("../models/User");
        const totalProducts = await Product.countDocuments();
        const totalUsers = await User.countDocuments();

        res.json({
            totalOrders,
            pendingOrders,
            deliveredOrders,
            cancelledOrders,
            totalRevenue,
            totalProducts,
            totalUsers
        });
    } catch (err) {
        console.error("Order Stats Error:", err);
        res.status(500).json({ msg: "Error fetching admin stats" });
    }
});

// 4. GET ALL ORDERS (Admin only)
router.get("/", auth, admin, async (req, res) => {
    try {
        await confirmExpiredPendingOrders();
        const { status } = req.query;
        let filter = {};
        if (status && status !== "All") {
            filter.status = status;
        }
        const orders = await Order.find(filter).sort({ createdAt: -1 });
        res.json(orders.map(sanitizeOrder));
    } catch (err) {
        console.error("Admin Get Orders Error:", err);
        res.status(500).json({ msg: "Server error fetching orders" });
    }
});

// 5. GET SINGLE ORDER DETAILS
router.get("/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        // Ensure user owns this order or is admin
        if (order.userId && String(order.userId) !== String(req.user.id) && !req.user.isAdmin) {
            return res.status(403).json({ msg: "Access denied" });
        }

        res.json(sanitizeOrder(order));
    } catch (err) {
        res.status(500).json({ msg: "Server error fetching order details" });
    }
});

// 6. UPDATE STATUS (Admin only)
router.put("/:id", auth, admin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }
        const { status, paymentStatus } = req.body;
        const validStatuses = ["Pending", "Confirmed", "Processing", "Packed", "Shipped", "Delivered", "Cancelled"];
        const validPaymentStatuses = ["Pending", "Initiated", "Paid", "Failed", "Refunded"];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ msg: "Invalid order status" });
        }
        if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ msg: "Invalid payment status" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        const terminalStatuses = ["Cancelled", "Delivered"];
        if (status && terminalStatuses.includes(order.status) && status !== order.status) {
            return res.status(409).json({
                msg: `This order is already ${order.status.toLowerCase()}; its status is locked and cannot be changed.`
            });
        }

        if (status) order.status = status;
        if (paymentStatus) order.paymentStatus = paymentStatus;
        if (typeof order.validate === "function") await order.validate();

        if (status === "Delivered" && !order.otpVerified) {
            return res.status(400).json({ msg: "Verify the customer's delivery OTP before marking this order delivered" });
        }

        if (status === "Shipped" && !order.deliveryOtpEmailSentAt) {
            const recipientEmail = order.email;
            if (!recipientEmail) {
                return res.status(400).json({ msg: "Customer email is missing; add a valid email before shipping this order" });
            }

            const transporter = getTransporter();
            if (!transporter) {
                return res.status(503).json({ msg: "Email is not configured. Configure EMAIL and EMAIL_PASS before shipping so the customer can receive their delivery OTP." });
            }

            const deliveryOtp = crypto.randomInt(100000, 1000000).toString();
            try {
                await transporter.sendMail({
                    from: `"Pathaan Collection" <${process.env.EMAIL}>`,
                    to: recipientEmail,
                    subject: `Your delivery OTP for order #${order._id.toString().slice(-6).toUpperCase()}`,
                    text: `Hello ${order.customerName || "Customer"},\n\nYour order #${order._id.toString().slice(-6).toUpperCase()} has been shipped. Your delivery OTP is ${deliveryOtp}. Share it with the delivery agent only when your package arrives.\n\nThank you for shopping with Pathaan Collection.`
                });
            } catch (emailError) {
                console.error("Delivery OTP email error:", emailError.message);
                return res.status(502).json({ msg: "Could not email the delivery OTP. The order was not marked as shipped; please retry after checking the email service." });
            }

            order.deliveryOtp = deliveryOtp;
            order.deliveryOtpEmailSentAt = new Date();
        }

        const updated = await order.save();

        res.json({ msg: "Order Status Updated", order: sanitizeOrder(updated) });
    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ msg: "Server error updating order status" });
    }
});

// 7. CANCEL ORDER (Customer or Admin)
router.put("/cancel/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }
        if (!req.user.isAdmin) await confirmExpiredPendingOrders();
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        if (order.userId && String(order.userId) !== String(req.user.id) && !req.user.isAdmin) {
            return res.status(403).json({ msg: "Not authorized to cancel this order" });
        }

        if (order.status === "Delivered") {
            return res.status(400).json({ msg: "Cannot cancel an order that has already been delivered" });
        }

        if (!req.user.isAdmin) {
            const createdAt = new Date(order.createdAt).getTime();
            if (!Number.isFinite(createdAt) || Date.now() - createdAt >= ORDER_CONFIRMATION_DELAY_MS || order.status !== "Pending") {
                if (order.status === "Pending" && Number.isFinite(createdAt)) {
                    order.status = "Confirmed";
                    await order.save();
                }
                return res.status(400).json({ msg: "This order is confirmed after 30 minutes and can no longer be cancelled." });
            }
        }

        order.status = "Cancelled";
        const cancelReason = req.body && typeof req.body.reason === "string" ? req.body.reason.trim() : "";
        if (cancelReason) order.cancelReason = cancelReason;
        await order.save();

        res.json({ msg: "Order Cancelled Successfully", order: sanitizeOrder(order) });
    } catch (err) {
        console.error("Cancel Order Error:", err);
        res.status(500).json({ msg: "Server error cancelling order" });
    }
});

// 8. CHANGE DELIVERY ADDRESS (Customer)
router.put("/address/:id", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        if (order.userId && String(order.userId) !== String(req.user.id) && !req.user.isAdmin) {
            return res.status(403).json({ msg: "Not authorized" });
        }

        if (["Shipped", "Delivered", "Cancelled"].includes(order.status)) {
            return res.status(400).json({ msg: `Cannot change address when order is ${order.status}` });
        }

        if (!req.body.address) {
            return res.status(400).json({ msg: "New address is required" });
        }

        order.address = req.body.address;
        if (req.body.phone) order.phone = req.body.phone;
        await order.save();

        res.json({ msg: "Delivery Address Updated", order: sanitizeOrder(order) });
    } catch (err) {
        console.error("Update Address Error:", err);
        res.status(500).json({ msg: "Server error updating address" });
    }
});

// Customer return request, available for three hours after delivery.
router.post("/:id/return", auth, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid order ID" });
        }

        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: "Order not found" });
        if (order.userId && String(order.userId) !== String(req.user.id) && !req.user.isAdmin) {
            return res.status(403).json({ msg: "Not authorized to request a return for this order" });
        }
        if (order.status !== "Delivered" || !order.deliveredAt) {
            return res.status(400).json({ msg: "Returns can only be requested after an order is delivered" });
        }

        const deliveredAt = new Date(order.deliveredAt).getTime();
        if (!Number.isFinite(deliveredAt) || Date.now() - deliveredAt >= RETURN_WINDOW_MS) {
            return res.status(400).json({ msg: "The 3-hour return window after delivery has expired" });
        }

        const itemIndex = Number(req.body?.itemIndex);
        const orderItems = Array.isArray(order.items) && order.items.length
            ? order.items
            : [{
                productId: order.productId,
                name: order.name || "Order item",
                image: order.image || "",
                qty: order.qty || 1,
                size: order.size || "M",
                color: order.color || "Default"
            }];
        if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= orderItems.length) {
            return res.status(400).json({ msg: "Select a valid product from this order" });
        }

        const item = orderItems[itemIndex];
        const quantity = Number(req.body?.quantity);
        const orderedQuantity = Math.max(1, Number(item.qty) || 1);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > orderedQuantity) {
            return res.status(400).json({ msg: `Return quantity must be between 1 and ${orderedQuantity}` });
        }

        const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
        const details = typeof req.body?.details === "string" ? req.body.details.trim() : "";
        if (reason.length < 3 || reason.length > 120) {
            return res.status(400).json({ msg: "Return reason must be between 3 and 120 characters" });
        }
        if (details.length < 10 || details.length > 1000) {
            return res.status(400).json({ msg: "Return details must be between 10 and 1000 characters" });
        }

        const returnRequests = Array.isArray(order.returnRequests) ? order.returnRequests : [];
        const hasActiveRequest = returnRequests.some(request =>
            Number(request.itemIndex) === itemIndex && ACTIVE_RETURN_STATUSES.has(request.status || "Requested")
        );
        if (hasActiveRequest) {
            return res.status(409).json({ msg: "A return request for this product is already in progress" });
        }

        order.returnRequests = [...returnRequests, {
            itemIndex,
            productId: item.productId ? String(item.productId) : "",
            productName: item.name || order.name || "Order item",
            productImage: item.image || order.image || "",
            quantity,
            size: item.size || order.size || "M",
            color: item.color || order.color || "Default",
            reason,
            details,
            requestedAt: new Date(),
            status: "Requested"
        }];
        await order.save();

        res.status(201).json({
            msg: "Return request submitted successfully",
            order: sanitizeOrder(order)
        });
    } catch (err) {
        console.error("Create Return Request Error:", err);
        res.status(500).json({ msg: "Server error submitting return request" });
    }
});

// Admin return processing; mark Refunded only after the refund is completed.
router.put("/:id/return/:returnRequestId", auth, admin, async (req, res) => {
    try {
        const { id, returnRequestId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(returnRequestId)) {
            return res.status(400).json({ msg: "Invalid order or return request ID" });
        }

        const nextStatus = req.body?.status;
        if (!Object.hasOwn(RETURN_STATUS_TRANSITIONS, nextStatus)) {
            return res.status(400).json({ msg: "Invalid return request status" });
        }

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        const request = (order.returnRequests || []).find(item => String(item._id) === returnRequestId);
        if (!request) return res.status(404).json({ msg: "Return request not found" });

        const currentStatus = request.status || "Requested";
        if (!RETURN_STATUS_TRANSITIONS[currentStatus]?.has(nextStatus)) {
            return res.status(409).json({
                msg: `Return request cannot move from ${currentStatus} to ${nextStatus}`
            });
        }

        request.status = nextStatus;
        await order.save();
        res.json({
            msg: `Return request marked ${nextStatus}`,
            order: sanitizeOrder(order)
        });
    } catch (err) {
        console.error("Update Return Request Status Error:", err);
        res.status(500).json({ msg: "Server error updating return request status" });
    }
});

// 9. VERIFY DELIVERY OTP (Admin or Delivery Person)
router.post("/verify-otp", auth, admin, async (req, res) => {
    try {
        const { orderId, otp } = req.body;
        if (!orderId || !otp) {
            return res.status(400).json({ msg: "Order ID and OTP are required" });
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        if (order.status !== "Shipped" || !order.deliveryOtpEmailSentAt || !order.deliveryOtp) {
            return res.status(400).json({ msg: "The delivery OTP is available only after the order has shipped" });
        }

        if (String(order.deliveryOtp).trim() !== String(otp).trim()) {
            return res.status(400).json({ msg: "Wrong Delivery OTP code" });
        }

        order.otpVerified = true;
        order.status = "Delivered";
        order.deliveredAt = new Date();
        if (order.paymentMethod === "COD") {
            order.paymentStatus = "Paid";
        }
        await order.save();

        res.json({ msg: "OTP Verified! Order Marked Delivered", order: sanitizeOrder(order) });
    } catch (err) {
        console.error("Verify Delivery OTP Error:", err);
        res.status(500).json({ msg: "Server error verifying OTP" });
    }
});

// 10. CONFIRM PAYMENT (Customer after completing UPI / Online payment)
router.post("/confirm-payment", auth, async (req, res) => {
    try {
        const { orderId, transactionId, paymentMethod, paymentDetails } = req.body;
        if (!orderId) return res.status(400).json({ msg: "Order ID is required" });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ msg: "Order not found" });

        if (order.userId && String(order.userId) !== String(req.user.id) && !req.user.isAdmin) {
            return res.status(403).json({ msg: "Access denied" });
        }

        order.paymentStatus = "Paid";
        if (paymentMethod) order.paymentMethod = paymentMethod;
        order.paymentDetails = {
            transactionId: transactionId || "UPI-" + Date.now(),
            paidAt: new Date(),
            ...paymentDetails
        };
        await order.save();

        res.json({ msg: "Payment Verified & Recorded", order: sanitizeOrder(order) });
    } catch (err) {
        console.error("Confirm Payment Error:", err);
        res.status(500).json({ msg: "Server error confirming payment" });
    }
});

module.exports = router;