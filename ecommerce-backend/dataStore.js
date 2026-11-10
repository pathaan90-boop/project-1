const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const productCategories = require("./data/productCategories");

const DATA_DIR = path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadCollection(name, defaultData = []) {
    const file = path.join(DATA_DIR, `${name}.json`);
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify(defaultData, null, 2), "utf8");
        return defaultData;
    }
    try {
        const content = fs.readFileSync(file, "utf8");
        return JSON.parse(content || "[]");
    } catch (e) {
        console.error(`Error loading ${name}.json:`, e.message);
        return defaultData;
    }
}

function saveCollection(name, data) {
    const file = path.join(DATA_DIR, `${name}.json`);
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
        console.error(`Error saving ${name}.json:`, e.message);
    }
}

// Check if a document matches a MongoDB-style filter
function matchesFilter(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;

    if (filter.$or && Array.isArray(filter.$or)) {
        const matchesAny = filter.$or.some(subFilter => matchesFilter(doc, subFilter));
        if (!matchesAny) return false;
    }

    for (const key of Object.keys(filter)) {
        if (key === "$or") continue;
        const targetVal = filter[key];
        const docVal = doc[key];

        if (targetVal instanceof RegExp) {
            if (!targetVal.test(String(docVal || ""))) return false;
        } else if (targetVal && typeof targetVal === "object" && !Array.isArray(targetVal)) {
            // Check regex object { $regex: "...", $options: "i" }
            if (targetVal.$regex) {
                const reg = new RegExp(targetVal.$regex, targetVal.$options || "");
                if (!reg.test(String(docVal || ""))) return false;
            }
            if (targetVal.$gte !== undefined && !(Number(docVal) >= Number(targetVal.$gte))) return false;
            if (targetVal.$lte !== undefined && !(Number(docVal) <= Number(targetVal.$lte))) return false;
            if (targetVal.$gt !== undefined && !(Number(docVal) > Number(targetVal.$gt))) return false;
            if (targetVal.$lt !== undefined && !(Number(docVal) < Number(targetVal.$lt))) return false;
        } else {
            // String / primitive comparison (handle ObjectId / string matching)
            if (String(docVal) !== String(targetVal)) {
                return false;
            }
        }
    }
    return true;
}

// Create a query wrapper that supports .sort(), .skip(), .limit(), .populate(), .select() and await
class QueryWrapper {
    constructor(collectionName, filter, isFindOne = false) {
        this.collectionName = collectionName;
        this.filter = filter;
        this.isFindOne = isFindOne;
        this._sort = null;
        this._skip = 0;
        this._limit = 0;
        this._populateFields = [];
        this._selectExcludes = [];
        this._selectIncludes = [];
    }

    sort(sortObj) {
        this._sort = sortObj;
        return this;
    }

    skip(n) {
        this._skip = Number(n) || 0;
        return this;
    }

    limit(n) {
        this._limit = Number(n) || 0;
        return this;
    }

    populate(field) {
        this._populateFields.push(field);
        return this;
    }

    select(fieldsStr) {
        if (typeof fieldsStr === "string") {
            const parts = fieldsStr.split(" ").map(s => s.trim()).filter(Boolean);
            for (const p of parts) {
                if (p.startsWith("-")) {
                    this._selectExcludes.push(p.substring(1));
                } else {
                    this._selectIncludes.push(p);
                }
            }
        }
        return this;
    }

    async exec() {
        let items = loadCollection(this.collectionName, []);
        let results = items.filter(doc => matchesFilter(doc, this.filter));

        // Sort
        if (this._sort) {
            results.sort((a, b) => {
                for (const [k, dir] of Object.entries(this._sort)) {
                    let va = a[k];
                    let vb = b[k];
                    if (k === "createdAt") {
                        va = new Date(va).getTime();
                        vb = new Date(vb).getTime();
                    }
                    if (va < vb) return dir === 1 ? -1 : 1;
                    if (va > vb) return dir === 1 ? 1 : -1;
                }
                return 0;
            });
        }

        if (this.isFindOne) {
            const found = results[0] || null;
            if (!found) return null;
            return wrapDoc(this.collectionName, applySelect(found, this._selectExcludes, this._selectIncludes));
        }

        // Pagination
        if (this._skip > 0) results = results.slice(this._skip);
        if (this._limit > 0) results = results.slice(0, this._limit);

        // Populate
        if (this._populateFields.includes("productId")) {
            const products = loadCollection("products", []);
            results = results.map(item => {
                const prod = products.find(p => String(p._id) === String(item.productId));
                return { ...item, productId: prod || null };
            });
        }

        return results.map(d => wrapDoc(this.collectionName, applySelect(d, this._selectExcludes, this._selectIncludes)));
    }

    then(resolve, reject) {
        return this.exec().then(resolve, reject);
    }
}

function applySelect(doc, excludes, includes) {
    if (!doc) return doc;
    const copy = { ...doc };
    if (excludes.length > 0) {
        for (const ex of excludes) {
            delete copy[ex];
        }
    }
    return copy;
}

function wrapDoc(collectionName, data) {
    if (!data) return null;
    const doc = { ...data };

    doc.save = async function() {
        const items = loadCollection(collectionName, []);
        const idx = items.findIndex(i => String(i._id) === String(doc._id));
        if (idx !== -1) {
            items[idx] = { ...items[idx], ...doc };
        } else {
            items.push(doc);
        }
        saveCollection(collectionName, items);
        return wrapDoc(collectionName, doc);
    };

    doc.deleteOne = async function() {
        let items = loadCollection(collectionName, []);
        items = items.filter(i => String(i._id) !== String(doc._id));
        saveCollection(collectionName, items);
        return { acknowledged: true, deletedCount: 1 };
    };

    return doc;
}

// Generate base model factory
function createLocalModel(collectionName, defaultItemFactory) {
    function ModelConstructor(initialData = {}) {
        const id = initialData._id || new mongoose.Types.ObjectId().toString();
        const base = defaultItemFactory ? defaultItemFactory(initialData) : {};
        const merged = {
            _id: id,
            createdAt: new Date().toISOString(),
            ...base,
            ...initialData
        };
        return wrapDoc(collectionName, merged);
    }

    ModelConstructor.find = function(filter = {}) {
        return new QueryWrapper(collectionName, filter, false);
    };

    ModelConstructor.findOne = function(filter = {}) {
        return new QueryWrapper(collectionName, filter, true);
    };

    ModelConstructor.findById = function(id) {
        return new QueryWrapper(collectionName, { _id: String(id) }, true);
    };

    ModelConstructor.countDocuments = async function(filter = {}) {
        const items = loadCollection(collectionName, []);
        return items.filter(d => matchesFilter(d, filter)).length;
    };

    ModelConstructor.distinct = async function(field, filter = {}) {
        const items = loadCollection(collectionName, []);
        return [...new Set(items
            .filter(item => matchesFilter(item, filter))
            .map(item => item[field])
            .filter(value => value !== undefined && value !== null && value !== ""))];
    };

    ModelConstructor.findByIdAndUpdate = async function(id, updateData, options = {}) {
        const items = loadCollection(collectionName, []);
        const idx = items.findIndex(i => String(i._id) === String(id));
        if (idx === -1) return null;
        const current = items[idx];
        const updated = { ...current, ...(updateData.$set || updateData) };
        items[idx] = updated;
        saveCollection(collectionName, items);
        return wrapDoc(collectionName, updated);
    };

    ModelConstructor.findByIdAndDelete = async function(id) {
        let items = loadCollection(collectionName, []);
        const found = items.find(i => String(i._id) === String(id));
        if (!found) return null;
        items = items.filter(i => String(i._id) !== String(id));
        saveCollection(collectionName, items);
        return wrapDoc(collectionName, found);
    };

    ModelConstructor.findOneAndDelete = async function(filter) {
        let items = loadCollection(collectionName, []);
        const found = items.find(i => matchesFilter(i, filter));
        if (!found) return null;
        items = items.filter(i => String(i._id) !== String(found._id));
        saveCollection(collectionName, items);
        return wrapDoc(collectionName, found);
    };

    ModelConstructor.deleteMany = async function(filter) {
        let items = loadCollection(collectionName, []);
        const originalCount = items.length;
        items = items.filter(i => !matchesFilter(i, filter));
        saveCollection(collectionName, items);
        return { acknowledged: true, deletedCount: originalCount - items.length };
    };

    return ModelConstructor;
}

// Initialize seed data for users (default admin: admin@pathaan.com / admin123)
const salt = bcrypt.genSaltSync(10);
const hashedAdminPassword = bcrypt.hashSync("admin123", salt);

const defaultAdminUser = {
    _id: "660000000000000000000001",
    name: "Pathaan Admin",
    email: "admin@pathaan.com",
    password: hashedAdminPassword,
    phone: "9876543210",
    address: "Pathaan Collection HQ",
    city: "Mumbai",
    pincode: "400001",
    state: "Maharashtra",
    verified: true,
    isAdmin: true,
    profileImage: "https://i.ibb.co/4pDNDk1/avatar.png",
    createdAt: new Date().toISOString()
};

const defaultProducts = require("./data/menswearProducts");

// Seed on startup if files don't exist
const existingUsers = loadCollection("users", []);
if (existingUsers.length === 0) {
    saveCollection("users", [defaultAdminUser]);
}

const existingProducts = loadCollection("products", []);
const existingProductIds = new Set(existingProducts.map(product => String(product._id)));
const missingSeedProducts = defaultProducts.filter(product => !existingProductIds.has(String(product._id)));
if (missingSeedProducts.length > 0) {
    saveCollection("products", [...existingProducts, ...missingSeedProducts]);
}

// Local models
const LocalUser = createLocalModel("users", data => ({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    otp: "",
    otpExpires: null,
    passwordResetCodeHash: "",
    passwordResetExpires: null,
    passwordResetAttempts: 0,
    verified: true, // auto-verified locally for zero roadblocks
    isAdmin: false,
    profileImage: "https://i.ibb.co/4pDNDk1/avatar.png",
    language: "en",
    currency: "INR",
    notifications: { orderUpdates: false, offersPromotions: false },
    addresses: []
}));

const LocalProduct = createLocalModel("products", data => ({
    name: "",
    price: 0,
    originalPrice: data.price ? Math.round(data.price * 1.3) : 0,
    category: productCategories[0],
    description: "Premium apparel from Pathaan Collection",
    images: [],
    stock: 25,
    inStock: true,
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White"],
    rating: 4.8,
    reviewsCount: 20,
    featured: false
}));

const LocalOrder = createLocalModel("orders", data => ({
    id: new mongoose.Types.ObjectId().toString(),
    userId: "",
    customerName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
    state: "",
    items: [],
    totalAmount: 0,
    status: "Pending",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    deliveryOtp: "",
    deliveryOtpEmailSentAt: null,
    otpVerified: false,
    deliveredAt: null,
    returnRequests: []
}));

const LocalCart = createLocalModel("carts", data => ({
    userId: "",
    productId: "",
    quantity: 1,
    size: "M",
    color: "Default"
}));

const LocalWishlist = createLocalModel("wishlists", data => ({
    userId: "",
    productId: ""
}));

const LocalStoreSettings = createLocalModel("storeSettings", data => ({
    about: "",
    instagram: "",
    facebook: "",
    whatsappPhone: ""
}));

module.exports = {
    LocalUser,
    LocalProduct,
    LocalOrder,
    LocalCart,
    LocalWishlist,
    LocalStoreSettings
};
