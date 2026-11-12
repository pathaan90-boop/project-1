const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const StoreSettings = require("../models/StoreSettings");

const SETTINGS_ID = "000000000000000000000001";
const SETTINGS_FIELDS = ["about", "instagram", "facebook", "whatsappPhone"];
const PROFILE_DOMAINS = {
    instagram: new Set(["instagram.com", "www.instagram.com"]),
    facebook: new Set(["facebook.com", "www.facebook.com", "m.facebook.com"])
};

function normalizePhone(value) {
    const entered = String(value || "").trim();
    if (!entered) return "";
    if (!/^\+?[\d\s().-]+$/.test(entered)) return null;

    let digits = entered.replace(/\D/g, "");
    if (digits.length === 10) digits = `91${digits}`;
    if (digits.length < 11 || digits.length > 15) return null;
    return `+${digits}`;
}

function normalizeProfile(value, platform) {
    let entered = String(value || "").trim();
    if (!entered) return "";
    if (/^(?:www\.)?(?:instagram\.com|facebook\.com|m\.facebook\.com)\//i.test(entered)) {
        entered = `https://${entered}`;
    }

    if (/^https?:\/\//i.test(entered)) {
        try {
            const url = new URL(entered);
            if (url.protocol !== "https:" && url.protocol !== "http:") return null;
            if (!PROFILE_DOMAINS[platform].has(url.hostname.toLowerCase())) return null;
            if (!url.pathname || url.pathname === "/") return null;
            url.protocol = "https:";
            url.hash = "";
            return url.toString();
        } catch {
            return null;
        }
    }

    const handle = entered.replace(/^@/, "");
    if (!/^[A-Za-z0-9._-]{1,100}$/.test(handle)) return null;
    return `https://${platform}.com/${handle}`;
}

function getPublicSettings(settings) {
    return Object.fromEntries(SETTINGS_FIELDS.map(field => [field, settings?.[field] || ""]));
}

router.get("/", async (req, res) => {
    try {
        const settings = await StoreSettings.findById(SETTINGS_ID);
        res.json(getPublicSettings(settings));
    } catch (error) {
        console.error("Get Store Settings Error:", error);
        res.status(500).json({ msg: "Server error fetching store contact settings" });
    }
});

router.put("/social-contact", auth, admin, async (req, res) => {
    try {
        const body = req.body || {};
        if (SETTINGS_FIELDS.some(field => typeof body[field] !== "string")) {
            return res.status(400).json({ msg: "Provide About, Instagram, Facebook, and WhatsApp values as text" });
        }

        const about = body.about.trim();
        if (about.length > 500) {
            return res.status(400).json({ msg: "About text must be 500 characters or fewer" });
        }

        const instagram = normalizeProfile(body.instagram, "instagram");
        const facebook = normalizeProfile(body.facebook, "facebook");
        const whatsappPhone = normalizePhone(body.whatsappPhone);
        if (instagram === null) {
            return res.status(400).json({ msg: "Enter an Instagram username or instagram.com profile link" });
        }
        if (facebook === null) {
            return res.status(400).json({ msg: "Enter a Facebook ID or facebook.com profile link" });
        }
        if (whatsappPhone === null) {
            return res.status(400).json({ msg: "Enter a valid WhatsApp number with 10 to 15 digits" });
        }

        let settings = await StoreSettings.findById(SETTINGS_ID);
        if (!settings) settings = new StoreSettings({ _id: SETTINGS_ID });
        settings.about = about;
        settings.instagram = instagram;
        settings.facebook = facebook;
        settings.whatsappPhone = whatsappPhone;
        await settings.save();

        res.json({
            msg: "About and social contact details saved",
            settings: getPublicSettings(settings)
        });
    } catch (error) {
        console.error("Update Store Social Contact Error:", error);
        res.status(500).json({ msg: "Server error saving About and social contact details" });
    }
});

module.exports = router;
