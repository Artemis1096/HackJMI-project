import { Server } from "socket.io";
import http from 'http';
import express from 'express';

const app = express();

// Creating an HTTP server using Express
const server = http.createServer(app);

// Initializing Socket.IO with CORS configuration
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173"], // Allow requests from frontend running on localhost:5173
        methods: ["GET", "POST"] // Allow only GET and POST requests
    }
});

// Object to store the mapping between user IDs and their socket IDs
const userSocketMap = {};

// Function to get the socket ID of a receiver by their user ID
export const getReceiverSocketId = (receiver) => {
    return userSocketMap[receiver];
};

// Handling new client connections
io.on('connection', (socket) => {
    // Extract user ID from the handshake query
    const userId = socket.handshake.query.userId;
    
    // If userId is valid, store the mapping of user ID to socket ID
    if (userId != "undefined") {
        userSocketMap[userId] = socket.id;
    }

    // Handling user disconnection
    socket.on('disconnect', () => {
        // Remove the user's socket ID from the map when they disconnect
        delete userSocketMap[userId];
    });
});

// Exporting app, io, and server for use in other modules
export { app, io, server };
