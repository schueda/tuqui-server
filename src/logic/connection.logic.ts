import { ConnectionDatabase } from "../data/connection.db";
import { Message } from "../types/message";
import { logger } from '../logger';
import { Socket } from 'socket.io';

export type Sendable = {
    receivers: [string];
}

export type SendableMessage = Sendable & Message;

export class ConnectionService {

    constructor(private db: ConnectionDatabase) { }

    connect(socket: Socket) {
        logger.debug(`[ConnectionService.connect] Connecting socket ${socket.id}`);

        // TODO: Do Joi validation
        const userId = <string>socket.handshake.query.userId;

        this.db.updateConnection(userId, socket);

        // Send scheduled hello message
        setTimeout(() => {
            this.emit({
                type: 'scheduled_hello',
                category: 'connection',
                content: {
                    message: 'Hello from the server!'
                },
                receivers: [userId]
            });
        }, 3000);
    }

    disconnect(socket: Socket) {
        logger.debug(`[ConnectionService.disconnect] Disconnecting socket ${socket.id}`);

        // this.db.updateConnection(socket.id, undefined);
    }

    emit(message: SendableMessage) {
        logger.debug(`[ConnectionService.emit] Emitting message ${JSON.stringify(message)}`);

        for (const receiver of message.receivers) {
            const socket = this.db.getSocket(receiver);
            if (socket) {
                socket.emit(message.type, message.content);
            }
        }
    }

}