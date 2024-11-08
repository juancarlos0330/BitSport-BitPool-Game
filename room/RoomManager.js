var roomList = require("./RoomList.js");
var Room = require("./Room.js");

module.exports.findRoom = function (roomID) {
  var roomIDList = Object.keys(roomList);

  for (var i = 0; i < roomIDList.length; i++) {
    if (roomIDList[i] == roomID) return true;
  }

  return false;
};

module.exports.isFull = function (socket, roomID) {
  if (findRoom(roomID)) {
    return roomList[roomID].isFull();
  }

  return false;
};

module.exports.createRoom = function (socket, roomInfo) {
  var newRoom = new Room(roomInfo.id);
  newRoom.arrangeBallPosList();
  roomList[roomInfo.roomID] = newRoom;

  newRoom.addClient(socket, roomInfo);

  return true;
};

module.exports.joinRoom = function (socket, roomInfo) {
  if (roomList[roomInfo.roomID].isFull()) return false;

  roomList[roomInfo.roomID].addClient(socket, roomInfo);
  return true;
};

module.exports.deleteRoom = function (roomID) {
  delete roomList[roomID];
};

module.exports.takeTurn = function (socket) {
  return roomList[socket.roomID].takeTurn();
};
