const express = require("express");
const http = require("http");
var jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const cors = require("cors");
const Document = require("./Schemas/Document");
const socketIO = require("socket.io");
const { ObjectId } = require("mongoose").Types;
const authRouter = require("./Routes/auth");
const DocumentRouter = require("./Routes/document");
const  connectDB  = require("./config/conn.js");
const dotenv = require("dotenv");

dotenv.config();

connectDB();




// Express Setup
const app = express();
app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "https://sheets-theta.vercel.app"],
    methods: ["GET", "POST"],
  })
);

// Express Route
app.use("/api/auth", authRouter);
app.use("/api/document", DocumentRouter);

const server = app.listen(3001, () => {
  console.log("Server is running on port 3001");
});

// Socket Setup
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://sheets-theta.vercel.app"], 
    methods: ["GET", "POST"],
  },
});
const defaultValue = "";

// Socket Connection

io.use((socket, next) => {
  const token = socket.handshake.auth.token;

  const JWT_SECRET = process.env.JTW_TOKEN;
  if (!token) {
    return next(new Error("Authentication error"));
  }
  try {
    const data = jwt.verify(token, JWT_SECRET);
    socket.user = data.user;
    next();
  } catch (error) {
    return next(new Error("Authentication error"));
  }
});


io.on("connection", (socket) => {
  const userId = socket.user ? socket.user.id : "";

  socket.on("get-document", async ({ documentId, title }) => {
    const document = await findOrCreateDocument(documentId, userId, title);
    if (document.error) {
      socket.emit("unauthorized-access", { error: document.error });
      return;
    }
    socket.join(documentId);
    socket.emit("load-document", { data: document.document.data, title: document.document.title, isEdit: document.edit });
    socket.on("send-change", (delta) => {
      if (!document.edit){
        return;
      }
      socket.broadcast.to(documentId).emit("receive-change", delta);
    });

    socket.on("save-document", async (data) => {
      if (!document.edit){
        return;
      }
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id, userID, title) {
  try {
    if (id == null) return;
    var edit = true;
    const stringId = String(id);
    const document = await Document.findById(stringId);
    if (document) {
      if ((document.UserID.equals(new ObjectId(userID))) || document.EditPermission.includes(new ObjectId(userID))){
        edit = true;
      }
      else if ((document.PrivacyMode === "edit")) {
        edit = true;
      }
      else if (document.ViewPermission.includes(new ObjectId(userID))){
        edit = false;
      }
      else if ((document.PrivacyMode === "private")) {
        edit = false;
        return { error: "Unauthorized access to the document" };
      }
      else if ((document.PrivacyMode === "view")){
        edit = false;
      }
      else{
        edit = false;
      }
      return { document, edit };
    }

    console.log(stringId);
    return { document: await Document.create({ _id: stringId, data: defaultValue, UserID: userID, title: title || "Untitled Document" }), edit };
  } catch (error) {
    console.log(error);
    return { error: "ERROR UNHANDLED" };
  }
}