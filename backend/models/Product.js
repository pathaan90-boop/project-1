const mongoose = require("mongoose");
const { LocalProduct } = require("../dataStore");
const productCategories = require("../data/productCategories");

const ProductSchema = new mongoose.Schema({
    id: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    originalPrice: {
        type: Number,
        default: function() {
            return Math.round(this.price * 1.3);
        }
    },
    images: [
        {
            type: String
        }
    ],
    description: {
        type: String,
        default: "Premium quality Pathaan Collection apparel with exceptional craftsmanship and comfortable fit."
    },
    category: {
        type: String,
        enum: productCategories,
        required: true,
        trim: true
    },
    stock: {
        type: Number,
        default: 25,
        min: 0
    },
    inStock: {
        type: Boolean,
        default: true
    },
    sizes: {
        type: [String],
        default: ["S", "M", "L", "XL", "XXL"]
    },
    colors: {
        type: [String],
        default: ["Black", "White", "Navy Blue", "Olive Green"]
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 4.8
    },
    reviewsCount: {
        type: Number,
        default: 56
    },
    featured: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

ProductSchema.pre("save", function() {
    this.inStock = this.stock > 0;
});

const MongooseProduct = mongoose.models.Product || mongoose.model("Product", ProductSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const ProductProxy = new Proxy(MongooseProduct, {
    construct(target, args) {
        if (isConnected()) {
            return new MongooseProduct(...args);
        }
        return new LocalProduct(...args);
    },
    get(target, prop) {
        if (isConnected()) {
            return MongooseProduct[prop];
        }
        return LocalProduct[prop] !== undefined ? LocalProduct[prop] : MongooseProduct[prop];
    }
});

module.exports = ProductProxy;