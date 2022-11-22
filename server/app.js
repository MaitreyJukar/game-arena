const CONSTANTS = require("./common/constants");
const Express = require("express")();
const Http = require("http").Server(Express);
const TableHockey = require("./modules/table-hockey/index");
const CardPicker = require("./modules/card-picker/index");
const Socketio = require("socket.io")(Http, {
    cors: {
        origin: CONSTANTS.SERVER_HOST,
        methods: ["GET", "POST"]
    }
});

//require('./lib/googleapis');

tableHockeySocket = Socketio.of("table-hockey");
TableHockey.create(tableHockeySocket);

cardPickerSocket = Socketio.of("card-picker");
CardPicker.create(cardPickerSocket);

Http.listen(3000, () => {
    console.log("Listening at :3000...");
});
