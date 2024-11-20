const { addMessage, getMessages, getChats } = require("../controllers/messageController");
const router = require("express").Router();

router.post("/addmsg/", addMessage);
router.post("/getmsg/", getMessages);

router.get("/chats/:id", getChats);

module.exports = router;
