// socketState.js
const socketState = {
    io: null,
    onlineUsers: new Map(),
    typingUsers: new Map(),
    
    setIO(ioInstance) {
      this.io = ioInstance;
    },
    
    getIO() {
      return this.io;
    },
    
    addOnlineUser(userId, socketId) {
      this.onlineUsers.set(userId, socketId);
    },
    
    removeOnlineUser(userId) {
      this.onlineUsers.delete(userId);
    },
    
    getOnlineUser(userId) {
      return this.onlineUsers.get(userId);
    },
    
    setTypingUser(userId, isTyping) {
      this.typingUsers.set(userId, isTyping);
    },
    
    removeTypingUser(userId) {
      this.typingUsers.delete(userId);
    }
  };
  
  module.exports = socketState;