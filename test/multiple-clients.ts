// const App = require("../src/app");
import { io as Client } from "socket.io-client";
import { Server, Socket } from 'socket.io';
import { DefaultEventsMap } from "socket.io/dist/typed-events";

import { buildApp } from '../src/di';
import { logger } from '../src/logger';
import { App } from "../src/app";

// process.env.DEBUG = "*"

type TestClientEntry = {
    id: string;
    serverSocket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
    clientSocket;
}

describe("tuqui-test", () => {
    let app: App;

    let clients: Record<string, TestClientEntry> = {};

    beforeAll((done) => {
        logger.info(`[TEST] beforeAll started`);

        const addPlayer = (id: string) => {
            const clientSocket = Client(`http://localhost:${app.PORT}`, {
                query: {
                    userId: id
                }
            });
            clients[id] = {
                id,
                serverSocket: null,
                clientSocket
            };
            clientSocket.on("connect", () => {
                logger.debug(`[TEST] clientSocket.on connected ${clientSocket.id}`);
            });
            clientSocket.on("connect_error", (error) => {
                logger.debug(`[TEST] clientSocket.on connect_error ${error}`);
            });
            logger.debug(`[TEST] clientSocket with id ${id} created!`);
        }

        app = buildApp();

        app.server.listen(app.PORT, () => {
            app.io.on("connection", (socket) => {
                logger.debug(`[TEST] io.on connection assigned serverSocket`);
                clients[socket.id].serverSocket = socket;
            });

            // Create the players
            addPlayer("1");
            addPlayer("2");

            done();
        });

        logger.info(`[TEST] beforeAll finished`);
    });

    afterAll(() => {
        logger.info(`[TEST] afterAll started`);

        Object.values(clients).forEach(c => {
            c.serverSocket?.disconnect();
            c.clientSocket?.close();
        });

        app.io.close();

        logger.info(`[TEST] afterAll finished`);
    });


    test("hello -> hello world", (done) => {
        logger.info(`[TEST] hello -> hello world starting`);

        logger.info(`[TEST] hello -> hello world finished`);
    });


});