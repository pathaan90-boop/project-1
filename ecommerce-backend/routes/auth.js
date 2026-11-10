const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const rateLimit = require("express-rate-limit");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");
const getTransporter = require("../services/emailTransporter");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || "dummy-client-id");
const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: "Too many password reset attempts. Please try again later." }
});

function generateToken(user) {
    const secret = process.env.JWT_SECRET || "pathaan_collection_jwt_secret_key_2026_super_secure_auth";
    return jwt.sign(
        { id: user._id, isAdmin: user.isAdmin, email: user.email, name: user.name },
        secret,
        { expiresIn: "30d" }
    );
}

// Helper to safely send email with OTP fallback
async function sendOtpEmail(email, name, otp, subject = "Verify Your Pathaan Collection Account") {
    const transporter = getTransporter();
    if (transporter) {
        try {
            await transporter.sendMail({
                from: `"Pathaan Collection" <${process.env.EMAIL}>`,
                to: email,
                subject: subject,
                html: `
                    <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:25px;border:1px solid #222;border-radius:15px;background:#0d0d0d;color:#fff;text-align:center;">
                        <h2 style="color:#ff7b22;letter-spacing:1px;">Pathaan Collection 🔥</h2>
                        <p style="font-size:16px;color:#ddd;">Hello <b>${name || 'Customer'}</b>,</p>
                        <p style="color:#aaa;">Your one-time verification code is:</p>
                        <div style="background:#1a1a1a;padding:15px 30px;display:inline-block;border-radius:10px;margin:15px 0;">
                            <span style="font-size:32px;font-weight:bold;color:#00ffcc;letter-spacing:6px;">${otp}</span>
                        </div>
                        <p style="color:#888;font-size:13px;">Valid for 10 minutes. Do not share this code with anyone.</p>
                    </div>
                `
            });
            return true;
        } catch (err) {
            console.error("Email sending failed (falling back to console):", err.message);
            return false;
        }
    } else {
        console.log(`\n========================================`);
        console.log(`[PATHAAN AUTH DEV OTP] Email: ${email} | OTP: ${otp}`);
        console.log(`========================================\n`);
        return false;
    }
}

function getPasswordResetCodeHash(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
}

async function sendPasswordResetCode(user) {
    const transporter = getTransporter();
    if (!transporter) {
        return false;
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    user.passwordResetCodeHash = getPasswordResetCodeHash(code);
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.passwordResetAttempts = 0;
    await user.save();

    try {
        const safeName = String(user.name || "Customer").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        })[character]);
        await transporter.sendMail({
            from: `"Pathaan Collection" <${process.env.EMAIL}>`,
            to: user.email,
            subject: "Password Reset Code - Pathaan Collection",
            html: `
                <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:25px;border:1px solid #222;border-radius:15px;background:#0d0d0d;color:#fff;text-align:center;">
                    <h2 style="color:#d8b576;">Pathaan Collection</h2>
                    <p style="font-size:16px;color:#ddd;">Hello <b>${safeName}</b>,</p>
                    <p style="color:#aaa;">Use this one-time code to reset your password:</p>
                    <div style="background:#1a1a1a;padding:15px 30px;display:inline-block;border-radius:10px;margin:15px 0;">
                        <span style="font-size:32px;font-weight:bold;color:#d8b576;letter-spacing:6px;">${code}</span>
                    </div>
                    <p style="color:#888;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
                </div>
            `
        });
        return true;
    } catch (error) {
        user.passwordResetCodeHash = "";
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        await user.save();
        throw error;
    }
}

// 1. REGISTER
router.post("/register", async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ msg: "Please fill all required fields (Name, Email, Password)" });
        }
        if (password.length < 6) {
            return res.status(400).json({ msg: "Password must be at least 6 characters" });
        }

        const cleanEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: cleanEmail });

        if (user && user.verified === true) {
            return res.status(400).json({ msg: "An account with this email already exists. Please login." });
        }

        const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
        const hashedPassword = await bcrypt.hash(password, 10);
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
        const transporter = getTransporter();
        const autoVerify = !transporter; // Auto verify if SMTP not configured

        if (user) {
            user.name = name.trim();
            user.password = hashedPassword;
            user.phone = phone ? phone.trim() : user.phone;
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.verified = autoVerify;
        } else {
            const count = await User.countDocuments();
            const isAdmin = count === 0 || cleanEmail.startsWith("admin@");

            user = new User({
                name: name.trim(),
                email: cleanEmail,
                password: hashedPassword,
                phone: phone ? phone.trim() : "",
                otp,
                otpExpires,
                verified: autoVerify,
                isAdmin
            });
        }
        await user.save();

        if (autoVerify) {
            const token = generateToken(user);
            return res.json({
                msg: "Registration successful! Welcome to Pathaan Collection.",
                autoLogin: true,
                token,
                email: cleanEmail,
                isAdmin: user.isAdmin,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    isAdmin: user.isAdmin,
                    profileImage: user.profileImage
                }
            });
        }

        const emailSent = await sendOtpEmail(cleanEmail, name, otp);

        res.json({
            msg: emailSent ? "OTP sent to your email" : `Verification OTP generated. Code: ${otp}`,
            email: cleanEmail,
            devOtp: emailSent ? undefined : otp
        });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ msg: "Server error during registration. " + err.message });
    }
});

// 2. VERIFY OTP
router.post("/verify-otp", async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ msg: "Email and OTP are required" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(404).json({ msg: "User not found" });
        }

        if (String(user.otp).trim() !== String(otp).trim()) {
            return res.status(400).json({ msg: "Invalid OTP. Please check and try again." });
        }

        user.verified = true;
        user.otp = "";
        user.otpExpires = null;
        await user.save();

        const token = generateToken(user);
        res.json({
            msg: "Account verified successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                isAdmin: user.isAdmin,
                profileImage: user.profileImage
            },
            isAdmin: user.isAdmin,
            email: user.email
        });
    } catch (err) {
        console.error("Verify OTP Error:", err);
        res.status(500).json({ msg: "Server error during verification" });
    }
});

// 3. LOGIN
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ msg: "Please enter email and password" });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) {
            return res.status(400).json({ msg: "No account found with this email" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: "Incorrect password" });
        }

        // If user is unverified
        if (user.verified !== true) {
            const transporter = getTransporter();
            if (!transporter) {
                // Auto verify upon correct password when SMTP is offline
                user.verified = true;
                user.otp = "";
                await user.save();
            } else {
                const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, lowerCaseAlphabets: false, specialChars: false });
                user.otp = otp;
                await user.save();
                const sent = await sendOtpEmail(cleanEmail, user.name, otp);

                return res.status(403).json({
                    msg: "Please verify your email first. A new OTP has been sent.",
                    needVerification: true,
                    email: cleanEmail,
                    devOtp: sent ? undefined : otp
                });
            }
        }

        const token = generateToken(user);
        res.json({
            msg: "Login Success",
            token,
            isAdmin: user.isAdmin,
            email: user.email,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                isAdmin: user.isAdmin,
                profileImage: user.profileImage,
                language: user.language || "en",
                currency: user.currency || "INR"
            }
        });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ msg: "Server error during login" });
    }
});

// 4. GET CURRENT LOGGED IN USER (/api/auth/me)
router.get("/me", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password -otp");
        if (!user) return res.status(404).json({ msg: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ msg: "Server Error" });
    }
});

// 5. GOOGLE OAUTH LOGIN
router.post("/google", async (req, res) => {
    const { credential } = req.body;
    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, name, sub: googleId, picture } = payload;
        const cleanEmail = email.toLowerCase().trim();

        let user = await User.findOne({ email: cleanEmail });
        if (!user) {
            const count = await User.countDocuments();
            user = new User({
                name,
                email: cleanEmail,
                googleId,
                password: "",
                verified: true,
                profileImage: picture || "https://i.ibb.co/4pDNDk1/avatar.png",
                isAdmin: count === 0
            });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.verified = true;
            if (picture && (!user.profileImage || user.profileImage.includes("avatar.png"))) {
                user.profileImage = picture;
            }
            await user.save();
        }

        const token = generateToken(user);
        res.json({
            msg: "Google Login Success",
            token,
            isAdmin: user.isAdmin,
            email: user.email,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
                profileImage: user.profileImage
            }
        });
    } catch (err) {
        console.error("Google Login Error:", err);
        res.status(401).json({ msg: "Google login verification failed" });
    }
});

async function completePasswordReset(user, code, password) {
    const expiresAt = user.passwordResetExpires ? new Date(user.passwordResetExpires).getTime() : 0;
    if (!user.passwordResetCodeHash || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        user.passwordResetCodeHash = "";
        user.passwordResetExpires = null;
        user.passwordResetAttempts = 0;
        await user.save();
        return { status: 400, msg: "Reset code is invalid or expired. Request a new code." };
    }

    const submittedHash = Buffer.from(getPasswordResetCodeHash(code), "hex");
    const savedHash = Buffer.from(user.passwordResetCodeHash, "hex");
    if (submittedHash.length !== savedHash.length || !crypto.timingSafeEqual(submittedHash, savedHash)) {
        user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
        if (user.passwordResetAttempts >= 5) {
            user.passwordResetCodeHash = "";
            user.passwordResetExpires = null;
            user.passwordResetAttempts = 0;
            await user.save();
            return { status: 429, msg: "Too many incorrect codes. Request a new reset code." };
        }
        await user.save();
        return { status: 400, msg: "Invalid reset code." };
    }

    user.password = await bcrypt.hash(password, 10);
    user.passwordResetCodeHash = "";
    user.passwordResetExpires = null;
    user.passwordResetAttempts = 0;
    await user.save();
    return { status: 200, msg: "Password updated successfully. You can now sign in with your new password." };
}

// Email reset flow for signed-in users in account settings.
router.post("/password-reset/request", passwordResetLimiter, auth, async (req, res) => {
    try {
        if (!getTransporter()) {
            return res.status(503).json({ msg: "Password reset email is unavailable. Please contact support." });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        await sendPasswordResetCode(user);
        res.json({ msg: `A password reset code was sent to ${user.email}. It expires in 10 minutes.` });
    } catch (err) {
        console.error("Settings Password Reset Email Error:", err.message);
        res.status(502).json({ msg: "Could not send the reset email. Please try again." });
    }
});

router.post("/password-reset/confirm", passwordResetLimiter, auth, async (req, res) => {
    try {
        const { code, password } = req.body;
        if (typeof code !== "string" || !/^\d{6}$/.test(code.trim())) {
            return res.status(400).json({ msg: "Enter the 6-digit reset code from your email." });
        }
        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ msg: "New password must be at least 6 characters" });
        }

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: "User not found" });

        const result = await completePasswordReset(user, code.trim(), password);
        res.status(result.status).json({ msg: result.msg });
    } catch (err) {
        console.error("Settings Password Reset Error:", err);
        res.status(500).json({ msg: "Server error resetting password" });
    }
});

// 6. FORGOT PASSWORD
router.post("/forgot-password", passwordResetLimiter, async (req, res) => {
    const { email } = req.body;
    try {
        if (typeof email !== "string" || !email.trim()) {
            return res.status(400).json({ msg: "Email is required" });
        }
        if (!getTransporter()) {
            return res.status(503).json({ msg: "Password reset email is unavailable. Please contact support." });
        }
        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ msg: "No account found with this email" });

        await sendPasswordResetCode(user);
        res.json({ msg: "If an account exists for this email, a password reset code has been sent." });
    } catch (err) {
        console.error("Forgot Password Error:", err);
        res.status(502).json({ msg: "Could not send the reset email. Please try again." });
    }
});

// 7. RESET PASSWORD
router.post("/reset-password", passwordResetLimiter, async (req, res) => {
    const { email, otp, password } = req.body;
    try {
        if (!email || !otp || !password) {
            return res.status(400).json({ msg: "Email, OTP and new password are required" });
        }
        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({ msg: "New password must be at least 6 characters" });
        }
        if (typeof otp !== "string" || !/^\d{6}$/.test(otp.trim())) {
            return res.status(400).json({ msg: "Enter the 6-digit reset code from your email." });
        }

        const cleanEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: cleanEmail });
        if (!user) return res.status(404).json({ msg: "User not found" });

        const result = await completePasswordReset(user, otp.trim(), password);
        res.status(result.status).json({ msg: result.msg });
    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ msg: "Server error resetting password" });
    }
});

module.exports = router;
