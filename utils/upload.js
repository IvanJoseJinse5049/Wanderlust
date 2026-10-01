const path = require("path");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: path.join(__dirname, "../public/uploads"),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  cb(new Error("Only image files are allowed."));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
