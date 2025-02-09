import jwt from "jsonwebtoken";
import User from "../Models/User.js";

/**
 * Generates a JWT token for a user and sets it as a cookie in the response.
 * @param {string} userId - The ID of the user for whom the token is being generated.
 * @param {object} res - The response object used to set the cookie.
 */
export const generate = (userId, res) => {
  // Create a JWT token that expires in 3 days
  const token = jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: "3d",
  });

  // Set the token as an HTTP-only cookie for security
  res.cookie("jwt", token, {
    httpOnly: true,  // Prevents client-side JavaScript from accessing the cookie
    sameSite: "None", // Required for cross-origin requests
    secure: true, // Ensures the cookie is only sent over HTTPS
  });
};

/**
 * Middleware to verify if a user is authenticated based on the JWT token in cookies.
 * If valid, it attaches the user object to the request.
 */
export const verify = async (request, response, next) => {
  try {
    // Retrieve the JWT token from cookies
    const token = request.cookies.jwt;

    // If no token is found, deny access
    if (!token) {
      return response
        .status(400)
        .json({ message: "You are not authorized to access this resource" });
    }

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    // If decoding fails, deny access
    if (!decoded) {
      return response
        .status(400)
        .json({ message: "You are not authorized to access this resource" });
    }

    // Retrieve the user from the database (excluding the password)
    const user = await User.findById(decoded.userId).select("-password");

    // If the user does not exist, return an error
    if (!user) {
      return response.status(400).json({ message: "User not found" });
    }

    // Attach the user object to the request for further use
    request.user = user;

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    console.log("Error in protected route middleware", error.message);
    response.status(500).json("Internal server error");
  }
};

/**
 * Middleware to check if the authenticated user is an admin.
 * If not an admin, access is denied.
 */
export const isAdmin = (req, res, next) => {
  console.log(req.user); // Log user details for debugging

  // Check if the user has admin privileges
  if (req.user?.userType !== "admin") {
    return res.status(403).json({ message: "Access denied: Admins only" });
  }

  // Continue to the next middleware or route handler
  next();
};
