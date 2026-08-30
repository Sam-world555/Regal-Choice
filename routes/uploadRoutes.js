const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");

router.post(
  "/",
  upload.array("images", 5),
  (req, res) => {
    try {
      const images = req.files
        ? req.files.map((file) => file.path)
        : [];

      res.status(200).json(images);
    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

module.exports = router;