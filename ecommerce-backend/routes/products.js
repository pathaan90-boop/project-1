const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const Product = require("../models/Product");
const { products: upload } = require("../middleware/upload");
const productCategories = require("../data/productCategories");
const { uploadProductImages, deleteCloudinaryAssets, deleteCloudinaryImages } = require("../services/cloudinary");

function parseList(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    if (typeof value === "string") return value.split(",").map(item => item.trim()).filter(Boolean);
    return [];
}

function parseRating(value, defaultValue = 4.8) {
    if (value === undefined) return defaultValue;
    if ((typeof value !== "string" && typeof value !== "number") || String(value).trim() === "") {
        return NaN;
    }
    return Number(value);
}

// 1. GET ALL PRODUCTS (with search, category, sort, price filter)
router.get("/", async (req, res) => {
    try {
        const { category, search, sort, minPrice, maxPrice, inStock, featured } = req.query;
        let filter = {};

        if (category && category !== "All") {
            filter.category = { $regex: new RegExp("^" + category + "$", "i") };
        }

        if (search && search.trim()) {
            const query = search.trim();
            const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { name: { $regex: escapedQuery, $options: "i" } },
                { description: { $regex: escapedQuery, $options: "i" } },
                { category: { $regex: escapedQuery, $options: "i" } }
            ];
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (inStock === "true") {
            filter.stock = { $gt: 0 };
        }

        if (featured === "true") {
            filter.featured = true;
        }

        let queryObj = Product.find(filter);

        // Sorting
        if (sort === "price_asc") {
            queryObj = queryObj.sort({ price: 1 });
        } else if (sort === "price_desc") {
            queryObj = queryObj.sort({ price: -1 });
        } else if (sort === "name_asc") {
            queryObj = queryObj.sort({ name: 1 });
        } else {
            // Default newest first
            queryObj = queryObj.sort({ createdAt: -1 });
        }

        const products = await queryObj;
        res.json(products);
    } catch (err) {
        console.error("Get Products Error:", err);
        res.status(500).json({ msg: "Server error fetching products" });
    }
});

// 2. GET DISTINCT CATEGORIES
router.get("/categories", async (req, res) => {
    try {
        const categories = await Product.distinct("category");
        const existingCategories = new Set(categories.map(category => String(category).toLowerCase()));
        res.json(productCategories.filter(category => existingCategories.has(category.toLowerCase())));
    } catch (err) {
        res.status(500).json({ msg: "Error fetching categories" });
    }
});

// 3. GET SINGLE PRODUCT BY ID
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid product ID format" });
        }
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msg: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        console.error("Get Single Product Error:", err);
        res.status(500).json({ msg: "Server error fetching product" });
    }
});

// 4. ADD PRODUCT (Admin only)
router.post("/add", auth, admin, upload.array("images", 6), async (req, res) => {
    let uploadedAssets = [];
    try {
        const { name, price, originalPrice, description, category, stock, sizes, colors, featured } = req.body;

        const parsedPrice = Number(price);
        const parsedOrigPrice = originalPrice ? Number(originalPrice) : Math.round(parsedPrice * 1.35);
        const parsedStock = stock !== undefined && stock !== "" ? Number(stock) : 25;
        const parsedRating = parseRating(req.body.rating);

        if (!name || !name.trim()) {
            return res.status(400).json({ msg: "Product name is required" });
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
            return res.status(400).json({ msg: "Product price must be greater than zero" });
        }
        if (!Number.isFinite(parsedOrigPrice) || parsedOrigPrice < parsedPrice) {
            return res.status(400).json({ msg: "Original price must be equal to or greater than the selling price" });
        }
        if (!Number.isInteger(parsedStock) || parsedStock < 0) {
            return res.status(400).json({ msg: "Stock must be a non-negative whole number" });
        }
        if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
            return res.status(400).json({ msg: "Product rating must be between 0 and 5" });
        }
        if (!productCategories.includes(String(category || "").trim())) {
            return res.status(400).json({ msg: `Choose a valid product category: ${productCategories.join(", ")}` });
        }

        uploadedAssets = await uploadProductImages(req.files || []);
        const uploadedImages = uploadedAssets.map(asset => asset.url);
        let finalImages = uploadedImages;

        // If no file uploaded, check if imageUrl or default placeholder is provided
        if (finalImages.length === 0) {
            if (req.body.imageUrl) {
                finalImages = [req.body.imageUrl];
            } else {
                finalImages = ["/uploads/1780399038393-IMG_20250917_085603.png"];
            }
        }

        const parsedSizes = sizes ? parseList(sizes) : ["S", "M", "L", "XL", "XXL"];
        const parsedColors = colors ? parseList(colors) : ["Black", "White", "Navy Blue", "Olive Green"];

        const newProduct = new Product({
            name: name.trim(),
            price: parsedPrice,
            originalPrice: parsedOrigPrice,
            images: finalImages,
            description: description || "Premium Pathaan Collection fashion wear.",
            category: category.trim(),
            stock: parsedStock,
            inStock: parsedStock > 0,
            sizes: parsedSizes.length ? parsedSizes : ["M", "L", "XL"],
            colors: parsedColors.length ? parsedColors : ["Black", "White"],
            rating: parsedRating,
            featured: featured === "true" || featured === true
        });

        await newProduct.save();
        res.status(201).json({ msg: "Product added successfully", product: newProduct });
    } catch (err) {
        console.error("Add Product Error:", err);
        await deleteCloudinaryAssets(uploadedAssets.map(asset => asset.publicId));
        res.status(500).json({ msg: "Server error while adding product: " + err.message });
    }
});

// 5. UPDATE PRODUCT (Admin only)
router.put("/:id", auth, admin, upload.array("images", 6), async (req, res) => {
    let uploadedAssets = [];
    let replacedImages = [];
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        const { name, price, originalPrice, category, description, stock, sizes, colors, featured, rating } = req.body;

        if (name !== undefined) {
            if (!name.trim()) return res.status(400).json({ msg: "Product name cannot be empty" });
            product.name = name.trim();
        }
        if (price !== undefined) {
            const parsedPrice = Number(price);
            if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
                return res.status(400).json({ msg: "Product price must be greater than zero" });
            }
            product.price = parsedPrice;
        }
        if (originalPrice !== undefined && originalPrice !== "") {
            const parsedOrigPrice = Number(originalPrice);
            if (!Number.isFinite(parsedOrigPrice) || parsedOrigPrice < (price !== undefined ? Number(price) : product.price)) {
                return res.status(400).json({ msg: "Original price must be equal to or greater than the selling price" });
            }
            product.originalPrice = parsedOrigPrice;
        }
        if (category !== undefined) {
            const normalizedCategory = category.trim();
            if (!productCategories.includes(normalizedCategory)) {
                return res.status(400).json({ msg: `Choose a valid product category: ${productCategories.join(", ")}` });
            }
            product.category = normalizedCategory;
        }
        if (description) product.description = description;

        if (stock !== undefined) {
            const parsedStock = Number(stock);
            if (!Number.isInteger(parsedStock) || parsedStock < 0) {
                return res.status(400).json({ msg: "Stock must be a non-negative whole number" });
            }
            product.stock = parsedStock;
            product.inStock = product.stock > 0;
        }

        if (rating !== undefined) {
            const parsedRating = parseRating(rating);
            if (!Number.isFinite(parsedRating) || parsedRating < 0 || parsedRating > 5) {
                return res.status(400).json({ msg: "Product rating must be between 0 and 5" });
            }
            product.rating = parsedRating;
        }

        if (sizes) {
            const parsedSizes = parseList(sizes);
            if (!parsedSizes.length) return res.status(400).json({ msg: "At least one size is required" });
            product.sizes = parsedSizes;
        }

        if (colors) {
            const parsedColors = parseList(colors);
            if (!parsedColors.length) return res.status(400).json({ msg: "At least one color is required" });
            product.colors = parsedColors;
        }

        if (featured !== undefined) {
            product.featured = featured === "true" || featured === true;
        }

        // New images replacement
        if (req.files && req.files.length > 0) {
            replacedImages = [...product.images];
            uploadedAssets = await uploadProductImages(req.files);
            product.images = uploadedAssets.map(asset => asset.url);
        }

        await product.save();
        if (uploadedAssets.length > 0) {
            await deleteCloudinaryImages(replacedImages);
            replacedImages.forEach(imgPath => {
                if (imgPath && imgPath.startsWith("/uploads/")) {
                    const fullPath = path.join(__dirname, "..", imgPath);
                    fs.unlink(fullPath, err => {
                        if (err && err.code !== "ENOENT") console.error("Could not remove replaced product image:", err);
                    });
                }
            });
        }
        res.json({ msg: "Product updated successfully", product });
    } catch (err) {
        console.error("Update Product Error:", err);
        await deleteCloudinaryAssets(uploadedAssets.map(asset => asset.publicId));
        res.status(500).json({ msg: "Server error while updating product" });
    }
});

// 6. DELETE PRODUCT (Admin only)
router.delete("/:id", auth, admin, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: "Invalid product ID" });
        }

        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ msg: "Product not found" });

        const cloudinaryImages = product.images.filter(imgPath => imgPath && !imgPath.startsWith("/uploads/"));
        product.images.forEach(imgPath => {
            if (imgPath && imgPath.startsWith("/uploads/")) {
                const fullPath = path.join(__dirname, "..", imgPath);
                fs.unlink(fullPath, err => {
                    if (err && err.code !== "ENOENT") console.error("Could not remove deleted product image:", err);
                });
            }
        });

        await product.deleteOne();
        await deleteCloudinaryImages(cloudinaryImages);
        res.json({ msg: "Product deleted successfully" });
    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).json({ msg: "Server error while deleting product" });
    }
});

module.exports = router;
