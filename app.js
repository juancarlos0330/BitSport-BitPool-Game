var roomManager = require("./room/RoomManager.js");
var roomList = require("./room/RoomList.js");

const GAME_SERVER_PORT = 9001;

const httpd = require("http").createServer(handler);
const { Server } = require("socket.io");
const io = new Server(httpd);
const fs = require("fs");
const path = require("path");

var roomidnum = 1;

httpd.listen(GAME_SERVER_PORT);

console.log("The game server started with " + GAME_SERVER_PORT + " ....");

function handler(req, res) {
  var filePath = __dirname + "/pool";

  if (req.url == "/") {
    filePath += "/index.html";
  } else {
    filePath += req.url;
  }

  var fileExtensionName = path.extname(filePath);
  var contentType = "text/javascript";

  switch (fileExtensionName) {
    case ".html":
      contentType = "text/html";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".css":
      contentType = "text/css";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".jpg":
      contentType = "image/jpg";
      break;
    case ".wav":
      contentType = "audio/wav";
      break;
  }

  var headers = {
    // "Access-Control-Allow-Origin": "*",
    // "Access-Control-Allow-Credentials": "true",
    // "Access-Control-Allow-Methods":
    //   "GET,HEAD,OPTIONS,POST,PUT, X-Requesteded-With",
    // "Access-Control-Allow-Headers":
    //   "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers",
    // "Access-Control-Max-Age": "2592000", // 30days
    "Content-Type": contentType,
  };

  fs.readFile(filePath, function (err, content) {
    if (err) {
      if (err.code == "ENOENT") {
        fs.readFile("./errpages/404.html", function (err, content) {
          res.writeHead(404, headers);
          res.end(content, "utf-8");
        });
      } else {
        fs.readFile("./errpages/500.html", function (err, content) {
          res.writeHead(500, headers);
          res.end(content, "utf-8");
        });
      }
    } else {
      res.writeHead(200, headers);
      res.end(content, "utf-8");
    }
  });
}

io.sockets.on("connection", function (socket) {
  console.log("new client connected! --> " + socket.id);

  socket.on("disconnect", function () {
    console.log(
      "client disconnected! --> " + socket.userID + "----" + socket.poolID
    );

    if (!roomManager.findRoom(socket.roomID)) {
      return;
    }

    var room = roomList[socket.roomID];

    if (socket == room.socket_1) {
      if (room.socket_2) room.socket_2.emit("Leave_Room", "");
    } else {
      if (room.socket_1) room.socket_1.emit("Leave_Room", "");
    }

    roomManager.deleteRoom(room.roomID);
    //socket.close();
  });

  socket.on("Req_ConnectRoom", function (roomInfo) {
    if (roomManager.findRoom(roomInfo.roomID)) {
      if (roomManager.joinRoom(socket, roomInfo)) {
        socket.userID = roomInfo.userID;
        socket.roomID = roomInfo.roomID;
        socket.poolID = roomInfo.poolID;
      } else {
        socket.emit("Room_Full", "");
        console.log("Unable to join room. -->" + roomInfo.roomID);
      }
    } else {
      if (roomManager.createRoom(socket, roomInfo)) {
        socket.userID = roomInfo.userID;
        socket.roomID = roomInfo.roomID;
        socket.poolID = roomInfo.poolID;
      } else {
        socket.emit("Room_Exist", "");
        console.log("Unable to create room. -->" + roomInfo.roomID);
      }
    }

    var room = roomList[roomInfo.roomID];
    var updatedRoomInfo = {};

    if (room.isFull()) {
      updatedRoomInfo.roomID = room.roomID;
      updatedRoomInfo.playerID_1 = room.playerID_1;
      updatedRoomInfo.playerID_2 = room.playerID_2;
      updatedRoomInfo.ballPosList = room.ballPosList;

      room.socket_1.emit("Res_StartGame", updatedRoomInfo);
      room.socket_2.emit("Res_StartGame", updatedRoomInfo);
    } else {
      updatedRoomInfo.roomID = room.roomID;
      updatedRoomInfo.playerID_1 = room.playerID_1;
      updatedRoomInfo.playerID_2 = room.playerID_2;

      socket.emit("Res_ConnectRoom", updatedRoomInfo);
    }
  });

  socket.on("Req_Waiting_Turn", function () {
    var turnID = roomManager.takeTurn(socket);
    var room = roomList[socket.roomID];

    if (room.req_count == 2) {
      room.req_count = 0;

      room.socket_1.emit("Res_Waiting_Turn", turnID);
      room.socket_2.emit("Res_Waiting_Turn", turnID);
    }
  });

  socket.on("Req_TurnChanged", function () {
    var turnID = roomManager.takeTurn(socket);
    var room = roomList[socket.roomID];
    console.log("Req_turn", turnID);

    if (room.req_count == 2) {
      room.req_count = 0;

      room.socket_1.emit("Res_TurnChanged", turnID);
      room.socket_2.emit("Res_TurnChanged", turnID);
    }
  });

  socket.on("Req_Shoot", function (shootInfo) {
    var room = roomList[socket.roomID];

    if (socket.userID == room.playerID_1) {
      room.socket_2.emit("Res_Shoot", shootInfo);
    } else {
      room.socket_1.emit("Res_Shoot", shootInfo);
    }

    console.log(shootInfo);
  });

  socket.on("req_clear_Timer", function () {
    var room = roomList[socket.roomID];
    room.socket_1.emit("res_clear_Timer", null);
    room.socket_2.emit("res_clear_Timer", null);
  });

  socket.on("CueBallPos", function (cueBallPos) {
    var room = roomList[socket.roomID];

    if (socket.userID == room.playerID_1) {
      room.socket_2.emit("CueBallPos", cueBallPos);
    } else {
      room.socket_1.emit("CueBallPos", cueBallPos);
    }

    console.log(cueBallPos);
  });
});
