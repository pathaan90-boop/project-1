const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const profileDiskStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Sanitize original filename
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
        cb(null, Date.now() + "-" + cleanName);
    }
});

const profileStorage = process.env.VERCEL ? multer.memoryStorage() : profileDiskStorage;

const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error("Only image files (jpeg, jpg, png, webp, gif) are allowed"), false);
    }
};

const createUpload = storage => multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter
});

module.exports = {
    profile: createUpload(profileStorage),
    products: createUpload(multer.memoryStorage())
};