const express = require("express")
const morgan = require("morgan")
const path = require("path")
const { createServer } = require("http")
const socketIo = require("socket.io")

const app = express()

// const setResHeaders = (req, res, next) => {
//     res.header("Access-Control-Allow-Origin", "*")
//     res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS")
//     res.header(
//         "Access-Control-Allow-Headers",
//         "Origin, X-Requested-With, Content-Type, Authorization, Accept, Access-Control-Al"
//         + "low-Methods",
//     )
//     res.header("X-Frame-Options", "deny")
//     res.header("X-Content-Type-Options", "nosniff")
//     next()
// }

app.use(express.urlencoded({ limit: "2mb", extended: true }))
app.use(express.json({ limit: "2mb" }))
app.use(morgan("combined"))
// app.use("/socket.io/", setResHeaders)

const publicPath = path.join(__dirname, "public")
const indexFile = path.join(__dirname, "public", "test.html")
console.log("publicPath : ", publicPath)

app.use(express.static(publicPath))
app.get("/*", (req, res) => {
  res.sendFile(indexFile)
})

const PORT = process.env.PORT || 4001

const users = {

}

const server = createServer(app)
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

const getAllSocketIds = async () => {
    const sockets = await io.fetchSockets()
    return sockets.map(socket => socket.id)
}

const sendusersInfo = () => {
    if(id) {
        users[id] = name
        io.emit("users", users)
    }
}


io.on("connection", (socket) => {
  console.log("a user connected : ", socket.id)
  socket.emit("hello", "world");
  users[socket.id] = ""
  io.emit("users", users)
  
  socket.on("disconnect", () => {
    console.log("user disconnected : ", socket.id)
    delete users[socket.id]
    io.emit("users", users)
  })
  socket.on("hi", (...args) => {
    console.log("hi from : ", args)
    users[args[0]] = args[1]
    io.emit("users", users)
  })
  socket.on("rtc-vchat-conn-offer", (...args) => {
    const senderId = args[0]
    const peerId = args[1]
    const offer = args[2]
    console.log("rtc-vchat-conn-offer by , for : ", senderId, peerId)
    io.to(peerId).emit("rtc-vchat-offer", senderId, offer)
  })
  socket.on("rtc-vchat-conn-answer", (...args) => {
    const receiverId = args[0]
    const peerId = args[1]
    const answer = args[2]
    console.log("rtc-vchat-conn-answer by, for : ",receiverId,  peerId)
    io.to(peerId).emit("rtc-vchat-answer", receiverId, answer)
  })
  socket.on("rtc-add-icecandidate", (...args) => {
      const peerId = args[0]
      const candidate = args[1]
      io.to(peerId).emit("rtc-ice-candidate", candidate)
  })
  socket.on("send-file-size", (...args) => {
      const peerId = args[0]
      const sentFileSize = args[1]
      const sentFileName = args[2]
      io.to(peerId).emit("rtc-sending-file", sentFileSize, sentFileName)
  })
})

server.listen(PORT, () => {
    console.log(`server listening at port ${PORT}`)
})

