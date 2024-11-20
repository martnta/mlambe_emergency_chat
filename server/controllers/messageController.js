const Messages = require("../models/messageModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const socketState = require("../utils/socketState");


module.exports.getMessages = async (req, res, next) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ msg: "Missing required fields: from or to" });
    }

    const messages = await Messages.find({
      users: {
        $all: [from, to],
      },
    }).sort({ createdAt: 1 });

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender.toString() === from,
      message: msg.message.text,
      createdAt: msg.createdAt,
    }));

    res.json(projectedMessages);
  } catch (ex) {
    console.error('Error in getMessages:', ex);
    res.status(500).json({ msg: "Internal server error" });
  }
};

module.exports.addMessage = async (req, res, next) => {
  try {
    const { from, to, message } = req.body;
    
    if (!from || !to || !message) {
      return res.status(400).json({ msg: "Missing required fields: from, to, or message" });
    }

    const data = await Messages.create({
      message: { text: message },
      users: [from, to],
      sender: from,
    });

    if (data) {
      const recipientSocketId = socketState.getOnlineUser(to);
      if (recipientSocketId) {
        const io = socketState.getIO();
        io.to(recipientSocketId).emit('receive-message', {
          fromSelf: false,
          message: message,
          createdAt: data.createdAt,
        });
      }

      return res.json({ msg: "Message added successfully." });
    } else {
      return res.json({ msg: "Failed to add message to the database" });
    }
  } catch (ex) {
    console.error('Error in addMessage:', ex);
    next(ex);
  }
};

module.exports.getChats = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    console.log('Fetching chats for user:', userId);
    
    const chats = await Messages.aggregate([
      {
        $match: {
          users: mongoose.Types.ObjectId(userId)
        }
      },
      {
        $sort: { createdAt: -1 }
      },
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
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userInfo"
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          timestamp: 1,
          name: { $arrayElemAt: ["$userInfo.username", 0] },
          id: "$_id",
          unreadCount: { $literal: 0 }
        }
      },
      {
        $sort: { timestamp: -1 }
      }
    ]);

    console.log('Found chats:', chats);
    res.json(chats || []);
  } catch (ex) {
    console.error('Error in getChats:', ex);
    res.status(500).json({ error: ex.message });
  }
};

module.exports.handleTyping = (io, socket) => {
  socket.on('typing', ({ from, to }) => {
    socket.to(to).emit('typing', { from });
  });

  socket.on('stop-typing', ({ from, to }) => {
    socket.to(to).emit('stop-typing', { from });
  });
};