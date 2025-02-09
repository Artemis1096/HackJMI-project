import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Configure Cloudinary with credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define the allowed image formats for upload
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "heic"];

// Configure Cloudinary storage settings for Multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Extract file format from MIME type
    const fileFormat = file.mimetype?.split("/")[1] || "";
    
    // Check if file format is allowed
    if (!ALLOWED_FORMATS.includes(fileFormat)) {
      throw new Error("Invalid file format");
    }
    
    return {
      folder: "article-images", // Define the folder in Cloudinary
      format: fileFormat, // Keep the original format
      public_id: Date.now() + "_" + file.originalname.replace(/\s+/g, "_") // Generate a unique filename
    };
  },
});

// Initialize Multer with the configured Cloudinary storage
const upload = multer({ storage });

// Export the configured Cloudinary instance and Multer upload middleware
export { cloudinary, upload };
