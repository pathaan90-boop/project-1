const mongoose = require("mongoose");
const { LocalStoreSettings } = require("../dataStore");

const StoreSettingsSchema = new mongoose.Schema({
    about: { type: String, default: "" },
    instagram: { type: String, default: "" },
    facebook: { type: String, default: "" },
    whatsappPhone: { type: String, default: "" }
});

const MongooseStoreSettings = mongoose.models.StoreSettings ||
    mongoose.model("StoreSettings", StoreSettingsSchema);

function isConnected() {
    return mongoose.connection.readyState === 1;
}

const StoreSettingsProxy = new Proxy(MongooseStoreSettings, {
    construct(target, args) {
        return isConnected()
            ? new MongooseStoreSettings(...args)
            : new LocalStoreSettings(...args);
    },
    get(target, prop) {
        if (isConnected()) return MongooseStoreSettings[prop];
        return LocalStoreSettings[prop] !== undefined
            ? LocalStoreSettings[prop]
            : MongooseStoreSettings[prop];
    }
});

module.exports = StoreSettingsProxy;
