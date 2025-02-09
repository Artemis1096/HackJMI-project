import Task from "../Models/task.js";
import User from "../Models/User.js";
import cron from "node-cron";

// create task controller
export const createTask = async (req, res) => {
    try {
       // create new task
        const task = new Task({
            ...req.body,
            user: req.user._id
        });

        //save task
        await task.save();
        res.status(201).json(task);
    } catch (error) {
        //error response 
        res.status(400).json({ error: error.message });
    }
};

// get all tasks 
export const getTasks = async (req, res) => {
    try {
        //finds all task
        const tasks = await Task.find({ user: req.user._id });
        // send ok response with all tasks
        res.status(200).json(tasks);
    } catch (error) {
        // error response
        res.status(500).json({ error: error.message });
    }
};


// get particular task information 
export const getTaskById = async (req, res) => {
    try {
        //find task by id 
        const task = await Task.findOne({ _id: req.params.id, user: req.user._id }); 
        if (!task) return res.status(404).json({ message: "Task not found" });
        // send task in response
        res.status(200).json(task);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// update task 
export const updateTask = async (req, res) => {
    try {
            
        const existingTask = await Task.findOne({ _id: req.params.id, user: req.user._id });

        if (!existingTask) return res.status(404).json({ message: "Task not found" });

       // check if task update from pending to complete for exp increase
        const isNewlyCompleted = req.body.status === "completed" && existingTask.status !== "completed";
          
        // update task
        const updatedTask = await Task.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            req.body,
            { new: true }
        );

        let updatedUser = null;

        if (isNewlyCompleted) {
            // update exp 
            updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { exp: 10 } }, 
                { new: true }
            );
        }
      // response send updated task information and updated exp of user
        res.status(200).json({
            task: updatedTask,
            exp: updatedUser ? updatedUser.exp : undefined, 
            message: "Task updated successfully",
        });
    } catch (error) {
        //error response 
        res.status(500).json({ error: error.message,
            success:false
         });
    }
};

// delete task 
export const deleteTask = async (req, res) => {
    try {
        // delete task by taking taskid
        const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user._id }); 
        if (!task) return res.status(404).json({ message: "Task not found" });
        res.status(200).json({ message: "Task deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



export const assignDailyTask = async () => {
    try {
        const users = await User.find(); // Fetch all users
        const today = new Date().setHours(0, 0, 0, 0); // Get today's date without time
        const dailyTaskDescription = "Meditate for 5 mins"; 
        const title = "Daily Task";

        for (const user of users) {
            // Check if today's task already exists for this user
            const existingTask = await Task.findOne({ user: user._id, title, date: today });
           
            if (existingTask) {
                // If task exists, reset status to "pending"
                existingTask.status = "pending";
                await existingTask.save();
               
            } else {
                // Assign new task if it doesn't exist
                await Task.create({
                    title: "Daily Task",
                    description: "Meditate for 5 mins",
                    user: user._id,
                    status: "pending",
                    date: today, // Store only date
                });
                console.log(`Task assigned to user ${user._id}`);
            }
        }
        console.log("Daily tasks assigned (if not already present)");
    } catch (error) {    
        // error 
        console.error("Error assigning daily task:", error.message);
    }
};

// Schedule the task to run every day at midnight (00:00)
cron.schedule("0 0 * * *", assignDailyTask, {
    scheduled: true,
    timezone: "UTC"
});