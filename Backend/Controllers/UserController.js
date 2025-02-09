import mongoose from "mongoose";
import User from "../Models/User.js";
import Friendship from "../Models/friendship.js";
import Article from "../Models/article.js";
import Mood from "../Models/mood.js";
import Conversation from "../Models/conversation.js";
import Message from '../Models/message.js';
import Task from "../Models/task.js";
import Journal from "../Models/journal.js";

// Returns the list of all users except the current user
export const getUsers = async (req, res) => {
  try {
    // Extract the logged-in user's ID from request object
    const id = req.user._id;
    
    // Fetch all users except the current user and admin users
    const users = await User.find({
      _id: { $ne: id },
      userType: { $ne: "admin" },
      isVerified: true,
    }).select("-password"); // Exclude the password field from the response

    res.status(200).json({ message: "success", data: users });
  } catch (error) {
    console.error("Error getting users:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Returns all details of a specific user based on their ID
export const getUser = async (req, res) => {
  try {
    const { id } = req.params; // Extract user ID from request parameters
    
    // Fetch user details while excluding the password field
    const user = await User.findById(id).select("-password");
    if (!user) return res.status(404).json({ message: "user not found" });
    
    res.status(200).json({
      message: "success",
      data: user,
    });
  } catch (error) {
    console.log("Error getting user information", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Allows users to edit their profile information
export const editProfile = async (req, res) => {
  try {
    const userId = req.user._id; // Logged-in user ID
    const { name, DOB, username } = req.body;

    // Convert DOB from "DD-MM-YYYY" to a valid Date object
    let formattedDOB;
    if (DOB) {
      const parts = DOB.split("-");
      if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        formattedDOB = new Date(year, month - 1, day); // Month is 0-based in JavaScript Date
      }
    }

    // Validate the formatted date of birth
    if (formattedDOB && isNaN(formattedDOB.getTime())) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid date format" });
    }

    // Update the user profile with new details
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, DOB: formattedDOB, username },
      { new: true, runValidators: true }
    ).select("name DOB username");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Handles profile deletion, ensuring all related data is removed
export const deleteProfile = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const userId = req.user._id; // Logged-in user ID
    session.startTransaction();

    // Delete all friendships involving the user
    await Friendship.deleteMany({
      $or: [{ user1: userId }, { user2: userId }]
    }).session(session);

    // Remove the user from liked articles
    await Article.updateMany(
      { likes: userId },
      { $pull: { likes: userId } }
    ).session(session);

    // Delete the user's mood entries
    await Mood.deleteMany({ user: userId }).session(session);

    // Delete messages sent or received by the user
    await Message.deleteMany({
      $or: [{ senderid: userId }, { receiverid: userId }]
    }).session(session);

    // Delete conversations involving the user
    await Conversation.deleteMany({
      participants: userId
    }).session(session);

    // Delete all tasks associated with the user
    await Task.deleteMany({ user: userId }).session(session);

    // Delete all journal entries associated with the user
    await Journal.deleteMany({ user: userId }).session(session);

    // Finally, delete the user profile
    await User.findByIdAndDelete(userId).session(session);

    // Commit the transaction after successful deletions
    await session.commitTransaction();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    // Abort the transaction in case of an error
    await session.abortTransaction();
    console.error("Error deleting profile:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  } finally {
    session.endSession(); // End the database session
  }
};
