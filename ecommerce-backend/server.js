const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const fs = require("fs");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("./models/Product");
const menswearProducts = require("./data/menswearProducts");
const { confirmExpiredPendingOrders } = require("./services/orderLifecycle");

const app = express();

// Ensure uploads folder exists
const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}

// CORS & Body parser
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets
app.use("/uploads", express.static(uploadsPath));
app.use(express.static(path.join(__dirname, "public")));

// Rate limiter for auth routes (100 requests / 15 mins)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { msg: "Too many authentication attempts, please try again later" }
});

// Database connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/pathaan_collection";
mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000
})
    .then(async () => {
        console.log("MongoDB Connected Successfully 🔥");
        try {
            const ProductModel = mongoose.model("Product");
            const existingProducts = await ProductModel.find({
                _id: { $in: menswearProducts.map(product => product._id) }
            }).select("_id").lean();
            const existingProductIds = new Set(existingProducts.map(product => String(product._id)));
            const missingProducts = menswearProducts.filter(product => !existingProductIds.has(product._id));
            if (missingProducts.length > 0) {
                await ProductModel.insertMany(missingProducts, { ordered: false });
            }
            console.log(`Menswear catalog ready (${missingProducts.length} products added).`);
        } catch (err) {
            console.error("Could not seed the menswear catalog into MongoDB:", err);
        }
        startOrderConfirmationScheduler();
    })
    .catch(err => {
        console.error("MongoDB connection failed; using local JSON storage fallback:", err.message);
        startOrderConfirmationScheduler();
    });

function startOrderConfirmationScheduler() {
    const confirmExpiredOrders = () => {
        confirmExpiredPendingOrders().catch(err => {
            console.error("Automatic order confirmation failed:", err);
        });
    };

    confirmExpiredOrders();
    const timer = setInterval(confirmExpiredOrders, 30 * 1000);
    timer.unref();
}

// API Routes
app.use("/api/auth", authLimiter, require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/cart", require("./routes/cart"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/store-settings", require("./routes/storeSettings"));

// Health check API
app.get("/api/health", (req, res) => {
    res.json({
        status: "online",
        service: "Pathaan Collection API",
        database: mongoose.connection.readyState === 1 ? "mongodb" : "local_storage",
        timestamp: new Date()
    });
});

// Clean frontend page routes (supports both /page and /page.html)
const publicDir = path.join(__dirname, "public");
app.get("/", (req, res) => res.sendFile(path.join(publicDir, "shop.html")));
app.get("/shop", (req, res) => res.sendFile(path.join(publicDir, "shop.html")));
app.get("/intro", (req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.get("/cart", (req, res) => res.sendFile(path.join(publicDir, "cart.html")));
app.get("/checkout", (req, res) => res.sendFile(path.join(publicDir, "contact.html")));
app.get("/contact", (req, res) => res.sendFile(path.join(publicDir, "contact.html")));
app.get("/payment", (req, res) => res.sendFile(path.join(publicDir, "payment.html")));
app.get("/orders", (req, res) => res.sendFile(path.join(publicDir, "orders.html")));
app.get("/my-orders", (req, res) => res.sendFile(path.join(publicDir, "my-orders.html")));
app.get("/profile", (req, res) => res.sendFile(path.join(publicDir, "profile.html")));
app.get("/settings", (req, res) => res.sendFile(path.join(publicDir, "settings.html")));
app.get("/dashboard", (req, res) => res.sendFile(path.join(publicDir, "dashboard.html")));
app.get("/login", (req, res) => res.sendFile(path.join(publicDir, "login.html")));
app.get("/register", (req, res) => res.sendFile(path.join(publicDir, "register.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(publicDir, "admin.html")));
app.get("/product-details", (req, res) => res.sendFile(path.join(publicDir, "product-details.html")));
app.get("/about", (req, res) => res.sendFile(path.join(publicDir, "about.html")));
app.get("/faq", (req, res) => res.sendFile(path.join(publicDir, "faq.html")));
app.get("/policy", (req, res) => res.sendFile(path.join(publicDir, "policy.html")));
app.get("/terms", (req, res) => res.sendFile(path.join(publicDir, "terms.html")));

// 404 handler for unknown routes
app.use((req, res, next) => {
    if (req.accepts("html")) {
        return res.status(404).sendFile(path.join(publicDir, "shop.html"));
    }
    res.status(404).json({ msg: "Endpoint not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Pathaan Collection server running on http://localhost:${PORT}`));
