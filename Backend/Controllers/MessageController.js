import mongoose from "mongoose";
import Conversation from "../Models/conversation.js";
import Message from "../Models/message.js";
import {io, getReceiverSocketId} from '../socket/socket.js';

// send message controller
export const sendMessage = async (req, res) => {
  try {
    
    const { message } = req.body;
    const { id: receiverid } = req.params;
    const senderid = req.user._id;
    const msg=message;
    // find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderid, receiverid] },
    });
   
    // pervious no conversation create new one
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderid, receiverid],
      });
    }
   // create new message
    const newmessage = new Message({
      senderid,
      receiverid,
      message:msg,
    });
     // insert new message in conversation
    if (newmessage) {
      conversation.message.push(newmessage._id);
    }
    // wait for conversation and new message to save
    await Promise.all([conversation.save(), newmessage.save()]);
   
     // socket instantly emit message
    const receiverSocketId = getReceiverSocketId(receiverid);
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage", newmessage);
    }

    // message sent successfully response
    res.status(200).json({
      message: "Message sent successfully",
      success: true,
      newmessage,
    });
  } catch (error) {
    //error response
    console.log("error in send message ", error);
    return res.status(500).json({
      error: "internal server error",
    });
  }
};

// get message  controller
export const getMessage = async (req, res) => {
  try {
    const { id: receiverid } = req.params;
    const senderid = req.user._id;
  
    // finding all message of respective sender and reciever
    const messages = await Message.find({
      $or: [
        { senderid, receiverid },
        { senderid: receiverid, receiverid: senderid },
      ],
    });
 // in response sending all messages
    res.status(200).json({
      messages: messages,
    });
  } catch (error) {
    // error in response for internal problems
    console.error("Error in getMessages:", error);
    res.status(500).json({
      error: "Internal server error",
    });
  }
};