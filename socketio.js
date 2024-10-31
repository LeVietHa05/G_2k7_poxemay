const option = {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        transport: ["websocket", "polling"],
        credential: true,
    }
}

const { log } = require("console");
// fs sync file envir data
const fs = require("fs");

let envirData = fs.readFileSync("envirData.json", "utf-8");
envirData = JSON.parse(envirData);
//watch file envir data
fs.watch("envirData.json", (event, filename) => {
    envirData = fs.readFileSync("envirData.json");
    envirData = JSON.parse(envirData);
});

const MAX_DATA_LENGTH = 6;

const tmpData = {
    CO_AT: [],
    CO2_AT: [],
    LPG_AT: [],
    NH3_AT: [],
    HC_AT: [],
    H2_AT: [],
    CO_BF: [],
    CO2_BF: [],
    LPG_BF: [],
    NH3_BF: [],
    HC_BF: [],
    H2_BF: [],
    PM25: [],
    PM10: [],
    PM1: [],
}

let tmpAvg = {
    CO_AT: 0,
    CO2_AT: 0,
    LPG_AT: 0,
    NH3_AT: 0,
    HC_AT: 0,
    H2_AT: 0,
    CO_BF: 0,
    CO2_BF: 0,
    LPG_BF: 0,
    NH3_BF: 0,
    HC_BF: 0,
    H2_BF: 0,
    PM25: 0,
    PM10: 0,
    PM1: 0,
}

const io = require("socket.io")(option);

const socketapi = {
    io: io
}

let topicChangePhoneNumber = "changePhoneNumber";

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("message1", (data) => {
        console.log(`Received data from ESP32: ${data}`);
        for (let key in data) {
            if (tmpData[key]) {
                tmpData[key].push(data[key]);
            }
        }
        socket.broadcast.emit("/web/measure1", data)
    })

    socket.on("message2", (data) => {
        console.log(`Received data from ESP32: ${data}`);
        for (let key in data) {
            if (tmpData[key]) {
                tmpData[key].push(data[key]);
            }
        }

        tempFunction();
        socket.broadcast.emit("/web/measure2", data)
    })



    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
    socket.on("chat message", (msg) => {
        console.log("message: " + msg);
        io.emit("chat message", msg);
    });
});

function tempFunction() {
    // calculate average
    if (tmpData.PM25.length == MAX_DATA_LENGTH) {
        log("Calculating average data");
        for (let key in tmpData) {
            tmpAvg[key] = (tmpData[key].reduce((a, b) => a + b, 0) / tmpData[key].length).toFixed(2); // calculate average
            tmpData[key] = []; //reset data
        }
        let newData = {
            id: envirData.length + 1,
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toLocaleTimeString("en-US", { hourCycle: "h24" }),
            data: {
                ...tmpAvg
            },
            location: data.location ? data.location : { "latitute": null, "longitute": null }
        }
        if (envirData) {
            envirData.push(newData);
            fs.writeFileSync("envirData.json", JSON.stringify(envirData));
        }
    }
}

module.exports = { socketapi, envirData };
