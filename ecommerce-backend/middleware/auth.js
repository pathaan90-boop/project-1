const jwt = require("jsonwebtoken");

module.exports = function(req, res, next) {
    let token = req.header("token") || req.header("x-auth-token");

    // Support standard Authorization: Bearer <token>
    const authHeader = req.header("Authorization");
    if (!token && authHeader) {
        if (authHeader.startsWith("Bearer ")) {
            token = authHeader.slice(7).trim();
        } else {
            token = authHeader.trim();
        }
    }

    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    try {
        const secret = process.env.JWT_SECRET || "pathaan_collection_jwt_secret_key_2026_super_secure_auth";
        const verified = jwt.verify(token, secret);
        req.user = verified;
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ msg: "Token expired, please login again", expired: true });
        }
        res.status(401).json({ msg: "Invalid or expired token" });
    }
};