const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const catchAsync = require("../utils/catchAsync");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 7000000 },
}).array("myImages", 5);

const uploadFileMiddleware = catchAsync(async (req, res, next) => {
  upload(req, res, async (err) => {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.files);

    if (err instanceof multer.MulterError) {
      let errorMessage;
      if (err.code === "LIMIT_FILE_SIZE") {
        errorMessage = "Error: File size exceeds the limit.";
      } else {
        console.log(err);
        errorMessage = `Error: ${err.message}`;
      }
      return res.status(400).json({ error: errorMessage });
    } else if (err) {
      return res.status(400).json({ error: `Error: ${err}` });
    }

    const uploadedFiles = req.files || []; // Ensure it defaults to an empty array if no files are uploaded
    const processedFileNames = [];

    for (const file of uploadedFiles) {
      if (!file.buffer) {
        console.warn(`Skipping file ${file.originalname}: buffer not available.`);
        continue;
      }

      const originalExt = path.extname(file.originalname);
      const filename = `image-${Date.now()}-${path.basename(file.originalname, originalExt)}.webp`;
      const outputPath = path.join(__dirname, '..', 'uploads', filename);

      try {
        await sharp(file.buffer)
          .resize(600)
          .webp({ quality: 80 })
          .toFile(outputPath);

        console.log(`Processed and saved: ${filename}`);
        processedFileNames.push(filename);

      } catch (sharpError) {
        console.error(`Error processing file ${file.originalname}:`, sharpError);
      }
    }

    // If no files were processed, simply call next() without an error
    req.processedFiles = processedFileNames; // Pass processed file names to the request object
    next(); // Call the next middleware or controller
  });
});

module.exports = {
  uploadFileMiddleware,
};