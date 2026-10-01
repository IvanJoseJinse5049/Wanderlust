require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
  timeout: 120000,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "wanderlust",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

module.exports = multer({ storage });
module.exports.cloudinary = cloudinary;