import * as express from "express";
import { createServer, Server } from 'http';
import { logger } from "./logger";
import * as socketIo from "socket.io";
import { ConnectionService } from './logic/connection.logic';

export class App {
    public app: express.Application;
    public server: Server;
    public io: socketIo.Server;
    public PORT: number = 8100;

    constructor(
        private connectionSvc: ConnectionService
    ) {
        this.routes();
        this.sockets();
        this.listen();
    }

    private routes() {
        this.app = express();

        this.app.route("/").get((req, res) => {
            // res.sendFile(__dirname + '/index.html');
        });
    }

    private sockets(): void {
        this.server = createServer(this.app);
        this.io = new socketIo.Server(this.server, {});
    }

    private listen(): void {
        this.io.on('connection', (socket: socketIo.Socket) => {
            logger.info(`[app.listen] New connection!`)

            this.connectionSvc.connect(socket);
        });
    }

}
