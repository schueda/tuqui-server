const App = require("../src/app");
const Client = require("socket.io-client");

describe("my awesome project", () => {
    let io, serverSocket, clientSocket;

    beforeAll((done) => {
        console.log("beforeAll");

        const app = new App();

        const httpServer = app.server;
        io = app.io;

        httpServer.listen(() => {
            const port = 8100;
            clientSocket = Client(`http://localhost:${port}`);
            io.on("connection", (socket) => {
                serverSocket = socket;
            });
            clientSocket.on("connect", done);
        });
        console.log("beforeAll done");
    });

    afterAll(() => {
        console.log("afterAll");
        io.close();
        clientSocket.close();
        console.log("afterAll done");
    });

    test("should work", (done) => {
        clientSocket.on("hello", (arg) => {
            expect(arg).toBe("world");
            done();
        });
        serverSocket.emit("hello", "world");
    });

    test("should work (with ack)", (done) => {
        serverSocket.on("hi", (cb) => {
            cb("hola");
        });
        clientSocket.emit("hi", (arg) => {
            expect(arg).toBe("hola");
            done();
        });
    });
});