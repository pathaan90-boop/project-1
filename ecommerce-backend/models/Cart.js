const mongoose = require("mongoose");
const { LocalCart } = require("../dataStore");

const CartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    size: {
        type: String,
        default: "M"
    },
    color: {
        type: String,
        default: "Default"
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const MongooseCart = mongoose.models.Cart || mongoose.model("Cart", CartSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const CartProxy = new Proxy(MongooseCart, {
    construct(target, args) {
        if (isConnected()) {
            return new MongooseCart(...args);
        }
        return new LocalCart(...args);
    },
    get(target, prop) {
        if (isConnected()) {
            return MongooseCart[prop];
        }
        return LocalCart[prop] !== undefined ? LocalCart[prop] : MongooseCart[prop];
    }
});

module.exports = CartProxy;