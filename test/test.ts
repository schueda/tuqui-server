// const App = require("../src/app");
import { io as Client } from "socket.io-client";
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import { buildApp } from '../src/di';
import { logger } from '../src/logger';
import { App } from "../src/app";

// process.env.DEBUG = "*"

describe("tuqui-test", () => {
    let app: App;
    let serverSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
    let clientSocket;

    beforeAll((done) => {
        logger.info(`[TEST] beforeAll started`);

        app = buildApp();
        app.server.listen(app.PORT, () => {
            clientSocket = Client(`http://localhost:${app.PORT}`, {
                query: {
                    userId: '1'
                }
            });
            logger.debug(`[TEST] clientSocket created. ${clientSocket.connected}`);

            app.io.on("connection", (socket) => {
                logger.debug(`[TEST] io.on connection assigned serverSocket`);
                serverSocket = socket;
            });

            clientSocket.on("connect", () => {
                logger.debug(`[TEST] clientSocket.on connected ${clientSocket.id}`);
                done();
            });

            clientSocket.on("connect_error", (error) => {
                logger.debug(`[TEST] clientSocket.on connect_error ${error}`);
            });
        });

        logger.info(`[TEST] beforeAll finished`);
    });

    afterAll(() => {
        logger.info(`[TEST] afterAll started`);

        serverSocket?.disconnect();
        clientSocket?.close();
        app.io.close();

        logger.info(`[TEST] afterAll finished`);
    });

    test("hello -> hello world", (done) => {
        logger.info(`[TEST] hello -> hello world starting`);

        clientSocket.on("hello", (arg) => {
            expect(arg).toBe("world");
            done();
        });
        serverSocket.emit("hello", "world");

        logger.info(`[TEST] hello -> hello world finished`);
    });

    test("hi -> hola", (done) => {
        logger.info(`[TEST] hi -> hola starting`);

        serverSocket.on("hi", (cb) => {
            cb("hola");
        });
        clientSocket.emit("hi", (arg) => {
            expect(arg).toBe("hola");
            done();
        });

        logger.info(`[TEST] hi -> hola finished`);
    });
});