const Messages = require("../models/messageModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => {
      return {
        fromSelf: msg.sender.toString() === from,
        message: msg.message.text,
      };
    });
    res.json(projectedMessages);
  } catch (ex) {
    next(ex);
  }
};

//sending message  

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) return res.json({ msg: "Message added successfully." });
    else return res.json({ msg: "Failed to add message to the database" });
  } catch (ex) {
    next(ex);
  }
};



module.exports.getChats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching chats for user:', userId);
    
    const chats = await Messages.aggregate([
      // Match messages where the current user is involved
      {
        $match: {
          users: mongoose.Types.ObjectId(userId)
        }
      },
      // Sort by timestamp to get the latest messages first
      {
        $sort: { createdAt: -1 }
      },
      // Group by the conversation participants
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", mongoose.Types.ObjectId(userId)] },
              { $arrayElemAt: ["$users", { $indexOfArray: ["$users", mongoose.Types.ObjectId(userId)] }] },
              "$sender"
            ]
          },
          lastMessage: { $first: "$message.text" },
          timestamp: { $first: "$createdAt" }
        }
      },
      // Lookup user details
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      // Project only the needed fields - modified projection
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          timestamp: 1,
          name: { $arrayElemAt: ["$userInfo.username", 0] },
          id: "$_id",
          unreadCount: { $literal: 0 } // Add unreadCount as a literal value
        }
      }
    ]);

    console.log('Found chats:', chats);
    res.json(chats || []);
  } catch (ex) {
    console.error('Error in getChats:', ex);
    res.status(500).json({ error: ex.message });
  }
};