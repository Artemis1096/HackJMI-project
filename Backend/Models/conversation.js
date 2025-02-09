import mongoose from 'mongoose'

//Conversation Schema for storing message between two participants
const conversationSchema=new mongoose.Schema({
	// store userid of sender and reciever
	participants:[{
		type:mongoose.Schema.Types.ObjectId,
		ref:'User',
		required:true,
	}],
	//  stores message between them
	message:[{
		type:mongoose.Schema.Types.ObjectId,
		ref:'Message'
	}]
},{timestamps:true})


//Conversation model
const Conversation=mongoose.model('Conversation',conversationSchema)


//export Conversation model
export default Conversation