import mongoose from 'mongoose' // import mongoose 

// message Schema store all the message  
const messageSchema=new mongoose.Schema({
    // sender of message
	senderid:{
		 type:mongoose.Schema.Types.ObjectId,
		 ref:'User',
		 required:true
	},
	// receiver of message
	receiverid:{
		 type:mongoose.Schema.Types.ObjectId,
		 ref:'User',
		 required:true
	},
	// actual message
	message:{
		type:String,
		required:true
	}

},{timestamps:true})


// Message Model
const Message=mongoose.model('Message',messageSchema)

//export Message Model
export default Message;