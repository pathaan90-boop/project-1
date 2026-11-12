const Order = require("../models/Order");

const ORDER_CONFIRMATION_DELAY_MS = 30 * 60 * 1000;

async function confirmExpiredPendingOrders(now = Date.now()) {
    const pendingOrders = await Order.find({ status: "Pending" });
    let confirmedCount = 0;

    for (const order of pendingOrders) {
        const createdAt = new Date(order.createdAt).getTime();
        if (!Number.isFinite(createdAt) || now - createdAt < ORDER_CONFIRMATION_DELAY_MS) continue;

        order.status = "Confirmed";
        await order.save();
        confirmedCount++;
    }

    return confirmedCount;
}

module.exports = {
    ORDER_CONFIRMATION_DELAY_MS,
    confirmExpiredPendingOrders
};
