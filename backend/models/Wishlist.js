const mongoose = require("mongoose");
const { LocalWishlist } = require("../dataStore");

const WishlistSchema = new mongoose.Schema({
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
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const MongooseWishlist = mongoose.models.Wishlist || mongoose.model("Wishlist", WishlistSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const WishlistProxy = new Proxy(MongooseWishlist, {
    construct(target, args) {
        if (isConnected()) {
            return new MongooseWishlist(...args);
        }
        return new LocalWishlist(...args);
    },
    get(target, prop) {
        if (isConnected()) {
            return MongooseWishlist[prop];
        }
        return LocalWishlist[prop] !== undefined ? LocalWishlist[prop] : MongooseWishlist[prop];
    }
});

module.exports = WishlistProxy;