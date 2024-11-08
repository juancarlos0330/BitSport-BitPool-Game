module.exports = function () {
  this.roomID = 0;

  this.playerID_1 = "";
  this.socket_1 = null;

  this.playerID_2 = "";
  this.socket_2 = null;

  this.req_count = 0;
  this.nextTurnID = "";

  this.ballPosList = [];

  this.isFull = function () {
    if (this.socket_1 == null || this.socket_2 == null) return false;

    return true;
  };

  this.addClient = function (socket, roomInfo) {
    this.roomID = roomInfo.roomID;

    if (this.socket_1 == null) {
      this.socket_1 = socket;
      this.playerID_1 = roomInfo.userID;
    } else if (this.socket_2 == null) {
      this.socket_2 = socket;
      this.playerID_2 = roomInfo.userID;
    } else {
      console.log("Full --> " + this.roomID);
    }
  };

  this.takeTurn = function (socket) {
    this.req_count++;

    if (this.req_count == 1) {
      if (this.nextTurnID == this.playerID_1) {
        this.nextTurnID = this.playerID_2;
      } else {
        this.nextTurnID = this.playerID_1;
      }
    }

    return this.nextTurnID;
  };

  this.arrangeBallPosList = function () {
    var RACK_POS_List = [
      { x: 916, y: 356 },
      { x: 941, y: 370 },
      { x: 941, y: 342 },
      { x: 966, y: 384 },
      { x: 966, y: 356 }, //BALL 8
      { x: 966, y: 328 },
      { x: 991, y: 398 },
      { x: 991, y: 370 },
      { x: 991, y: 342 },
      { x: 991, y: 314 },
      { x: 1016, y: 412 },
      { x: 1016, y: 384 },
      { x: 1016, y: 356 },
      { x: 1016, y: 328 },
      { x: 1016, y: 300 },
    ];

    var _aRandPos = new Array(0, 1, 2, 3, 5, 6, 7, 8, 9, 11, 12, 13);

    //in 8ball pool the two corner balls are of different suits and the 8 ball must be in the center of the rack
    var iFirstCorner = Math.floor(Math.random() * 7) + 9;
    var iSecondCorner = Math.floor(Math.random() * 7) + 1;

    for (var i = 1; i < 16; i++) {
      if (i != 8 && i != iFirstCorner && i != iSecondCorner) {
        var iRand = Math.floor(Math.random() * _aRandPos.length);

        this.ballPosList[i] = {};
        {
          this.ballPosList[i].x = RACK_POS_List[_aRandPos[iRand]].x;
          this.ballPosList[i].y = RACK_POS_List[_aRandPos[iRand]].y;
        }

        _aRandPos.splice(iRand, 1);
      }
    }

    this.ballPosList[iFirstCorner] = {};
    {
      this.ballPosList[iFirstCorner].x = RACK_POS_List[10].x;
      this.ballPosList[iFirstCorner].y = RACK_POS_List[10].y;
    }

    this.ballPosList[iSecondCorner] = {};
    {
      this.ballPosList[iSecondCorner].x = RACK_POS_List[14].x;
      this.ballPosList[iSecondCorner].y = RACK_POS_List[14].y;
    }

    this.ballPosList[8] = {};
    {
      this.ballPosList[8].x = RACK_POS_List[4].x;
      this.ballPosList[8].y = RACK_POS_List[4].y;
    }
  };
};
