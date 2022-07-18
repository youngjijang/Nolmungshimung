global.__base = __dirname + "/";

var express = require("express");
var path = require("path");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users/users");
var projectsRouter = require("./routes/projects/projects");
var travelRouter = require("./routes/travel/travel");
var commonRouter = require("./routes/common/common");
var voiceRouter = require("./routes/voicetalk/voicetalk");
var mongodb = require("dotenv").config();
var fs = require("fs");

voiceRouter;

var app = express();
// [원영] 소켓 서버 추가

const privateKey = fs.readFileSync("nolshimung-key.pem", "utf8");
const certificate = fs.readFileSync("nolshimung.pem", "utf8");
const credentials = {
  key: privateKey,
  cert: certificate,
  passphrase: process.env.PASSPHRASE,
};
var server = require("https").createServer(credentials, app);
var io = require("socket.io")(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

server.listen(3001, function () {
  console.log("Socket IO server listening on port 3001");
});

io.on("connection", (socket) => {
  //connection
  console.log("UserConnected", socket.id);

  socket.on("connected", (cookie) => {
    socket.emit("entrance-message", `Say hello! to ${user_id.id}`);
  });
  socket.on("disconnect", () => {
    console.log("UserDisconnected");
  });
  socket.on("chat-message", (msg) => {
    console.log("message:", msg);
  });
  ////프로젝트 관련 소켓
  socket.on("projectJoin", (projectId) => {
    console.log("join", projectId);
    socket.join(projectId);
  });
  socket.on("changeRoute", ([itemsRoute, projectId]) => {
    socket.broadcast.to(projectId).emit("updateRoute", itemsRoute);
  });

  socket.on("exitSharedEditing", ([projectID, selectedIndex, name]) => {
    console.log("deleteCurser", projectID, selectedIndex, name);
    socket.broadcast.to(projectID).emit("deleteCurser", name);
  });
});

// mongoose
var mongoose = require("mongoose");
var db = mongoose.connection;
db.on("error", console.error);
db.once("open", function () {
  console.log("Connected");
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.log(`connect err : ${err}`));

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(cors({ credentials: true, origin: true })); //credential은 프론트엔드의 fetch를 통해서 cookie를 넘기기 위해서 사용함. (프론트엔드에서는 "credentials:true" 설정 필요)

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/projects", projectsRouter);
app.use("/travel", travelRouter);
app.use("/common", commonRouter);
// app.use("/voicetalk", voiceRouter);

// [수연] share-memo with collaborative cursors
// create and start server on 7899 port by default
var OkdbServer = require("okdb-server");
var options = {
  cors: {
    enabled: true,
  },
};
var okdb = new OkdbServer(options);

// sample authentication, e.g. should validate your own auth token
let nameIdx = 0;
try {
  okdb.handlers().auth(({ myNickname, selectedIndex }) => {
    if (myNickname) {
      console.log("auth attempt for ", myNickname, " success");
      const userName = myNickname; // 나중에 users.user_name으로 바꾸기
      const userId = "1" + nameIdx;
      nameIdx = (nameIdx + 1) % 10;
      return { id: 1, name: userName, selectedIndex: selectedIndex };
    }
    console.log("auth attempt for ", myNickname, " failed");
    return null;
  });
} catch (err) {
  console.log(err);
}

// Handling Ctrl-C (workaround for Windows)
if (process.platform === "win32") {
  var rl = require("readline").createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.on("SIGINT", function () {
    process.emit("SIGINT");
  });
}
//graceful shutdown on Ctrl-C (all other platforms)
process.on("SIGINT", function () {
  okdb.stop(() => {
    console.log("server stopped");
    process.exit();
  });
});

module.exports = app;
