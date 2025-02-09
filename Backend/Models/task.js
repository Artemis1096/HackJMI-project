import mongoose from "mongoose";
// Task Schema
const taskSchema = new mongoose.Schema({
    // task owner
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    // title of task
    title: { type: String, required: true },      
    // description of task                                
    description: { type: String },           
    // status of task                                    
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    // date of task
    date: {                                                                      
        type: Date,
        // Store only the date
        set: (val) => new Date(val).setHours(0, 0, 0, 0), 
        // Retrieve only date part
        get: (val) => new Date(val).toISOString().split("T")[0], 
      },
});

// Task model
const Task = mongoose.model("Task", taskSchema);
// export task      
export default Task;   

