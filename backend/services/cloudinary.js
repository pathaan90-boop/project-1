const { v2: cloudinary } = require("cloudinary");
const { Readable } = require("stream");

function configureCloudinary() {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
    }

    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
        secure: true
    });
}

function uploadImage(file, folder) {
    configureCloudinary();
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                if (!result) return reject(new Error("Cloudinary returned no upload result"));

                resolve({
                    publicId: result.public_id,
                    url: cloudinary.url(result.public_id, {
                        secure: true,
                        version: result.version,
                        quality: "auto",
                        fetch_format: "auto"
                    })
                });
            }
        );
        Readable.from(file.buffer).pipe(uploadStream);
    });
}

function uploadProductImage(file) {
    return uploadImage(file, "pathaan/products");
}

function uploadProfileImage(file) {
    return uploadImage(file, "pathaan/profiles").then(asset => asset.url);
}

async function uploadProductImages(files) {
    const results = await Promise.allSettled(files.map(uploadProductImage));
    const uploaded = results.filter(result => result.status === "fulfilled").map(result => result.value);
    const failed = results.find(result => result.status === "rejected");

    if (failed) {
        await deleteCloudinaryAssets(uploaded.map(asset => asset.publicId));
        throw failed.reason;
    }

    return uploaded;
}

async function deleteCloudinaryAssets(publicIds) {
    const uniqueIds = [...new Set(publicIds.filter(Boolean))];
    if (!uniqueIds.length) return;

    try {
        configureCloudinary();
    } catch (error) {
        console.error("Could not clean up Cloudinary images:", error.message);
        return;
    }

    const results = await Promise.allSettled(uniqueIds.map(publicId =>
        Promise.resolve().then(() => cloudinary.uploader.destroy(publicId, { resource_type: "image" }))
    ));

    results.forEach((result, index) => {
        if (result.status === "rejected") {
            console.error(`Could not delete Cloudinary image ${uniqueIds[index]}:`, result.reason);
        }
    });
}

function getCloudinaryPublicId(imageUrl) {
    try {
        const url = new URL(imageUrl);
        if (url.hostname !== "res.cloudinary.com") return null;

        const parts = url.pathname.split("/upload/")[1]?.split("/") || [];
        const versionIndex = parts.findIndex(part => /^v\d+$/.test(part));
        if (versionIndex === -1 || versionIndex === parts.length - 1) return null;

        return parts.slice(versionIndex + 1).join("/").replace(/\.[^.]+$/, "");
    } catch {
        return null;
    }
}

async function deleteCloudinaryImages(imageUrls) {
    await deleteCloudinaryAssets(imageUrls.map(getCloudinaryPublicId));
}

module.exports = {
    uploadProductImages,
    uploadProfileImage,
    deleteCloudinaryAssets,
    deleteCloudinaryImages
};
