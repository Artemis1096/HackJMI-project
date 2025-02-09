import Mood from '../Models/mood.js';

// Function to submit the user's mood for the day
export const submitMood = async (req, res) => {
    try {
        const {mood} = req.body; // Extract mood from request body
        const userId = req.user._id; // Get user ID from authenticated request
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        
        // Check if the user has already submitted mood for today
        const existingMood = await Mood.findOne({user : userId, date : today});
        if(existingMood)
            return res.status(400).json({message : "Today's mood already submitted"});
        
        // Create a new mood entry
        const newMood = new Mood({user : userId, mood, date : today});
        await newMood.save(); // Save mood entry to database
        
        res.status(200).json({message : "Today's mood submited"});
    } catch (error) {
        console.log("Error submitting mood", error.message); // Log error message
        res.status(500).json({ message: "Internal server error" }); // Send internal server error response
    }
}

// Function to get the mood history of the user
export const getMood = async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from authenticated request
        
        // Fetch all mood entries for the user and sort by date in ascending order
        const moodData = await Mood.find({user : userId}).sort({date : 1});
        
        res.status(200).json({message : "successs", moodData}); // Send mood data in response
    } catch (error) {
        console.log("Error getting mood", error.message); // Log error message
        res.status(500).json({ message: "Internal server error" }); // Send internal server error response
    }
}

// Function to check if the user has already submitted mood for today
export const check = async (req, res) => {
    try {
        const userId = req.user._id; // Get user ID from authenticated request
        const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
        
        // Check if a mood entry exists for today
        const existingMood = await Mood.findOne({
            user : userId,
            date : today
        });
        
        res.status(200).json({hasSubmitted : !!existingMood}); // Return true if mood exists, else false
    } catch (error) {
        console.log("error checking mood status", error.message); // Log error message
        res.status(500).json({ message: "Internal server error" }); // Send internal server error response
    }
}
