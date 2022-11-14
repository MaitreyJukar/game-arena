const CONSTANTS = require("./common/constants");
const Express = require("express")();
const Http = require("http").Server(Express);
const TableHockey = require("./modules/table-hockey/index");
const Socketio = require("socket.io")(Http, {
    cors: {
        origin: CONSTANTS.SERVER_HOST,
        methods: ["GET", "POST"]
    }
});

thSocket = Socketio.of("table-hockey");
TableHockey.create(thSocket);

Http.listen(3000, () => {
    console.log("Listening at :3000...");
});
