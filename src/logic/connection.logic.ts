import { ConnectionDatabase } from "../data/connection.db";
import { ConnectionMessage, Message, MessageCategory, SendableMessage } from '../types/message';
import { logger } from '../logger';
import { Socket } from 'socket.io';

export class ConnectionService {

    constructor(private db: ConnectionDatabase) { }

    connect(socket: Socket) {
        logger.debug(`[ConnectionService.connect] Connecting socket ${socket.id}`);

        // TODO: Do Joi validation
        const userId = <string>socket.handshake.query.userId;

        this.db.updateConnection(userId, socket);

        // Register the socket for all receivers
        for (const receiver of this.db.getAllReceivers()) {
            socket.on(receiver.messageType, (message: Message) => {
                logger.debug(`[ConnectionService.connect] Received message ${receiver.messageType}`);
                receiver.callback(message);
            });
        }

        // Call all connection receivers
        for (const receiver of this.db.getAllConnectionReceivers()) {
            receiver(<ConnectionMessage>{
                type: 'connection',
                payload: {
                    userId: userId,
                },
            });
        }

        // Send scheduled hello message
        setTimeout(() => {
            this.emit({
                type: 'scheduled_hello',
                payload: {
                    text: 'Hello from the server!'
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

        // If message.receivers is 'all', send to all sockets
        if (message.receivers === 'all') {
            for (const socket of this.db.getAllSockets()) {
                socket.emit(message.type, message.payload);
            }
        }
        // If message.receivers is a list, send only to the ones in the list
        else if (message.receivers instanceof Array) {
            for (const receiver of message.receivers) {
                const socket = this.db.getSocket(receiver);
                if (socket) {
                    socket.emit(message.type, {
                        type: message.type,
                        payload: message.payload,
                    });
                }
            }
        }
    }

    registerMessageReceiver(messageType: string, callback: (message: Message) => void) {
        logger.debug(`[ConnectionService.registerMessageReceiver] Registering message receiver for ${messageType}`);

        // Store the callback in the db so we can call it for future sockets
        this.db.registerMessageReceiver({ messageType, callback });
    }

    registerConnectionReceiver(id: string, callback: (message: ConnectionMessage) => void) {
        logger.debug(`[ConnectionService.registerConnectionReceiver] Registering connection receiver for ${id}`);

        // Store the callback in the db so we can call it for future sockets
        this.db.registerConnectionReceiver(id, callback);
    }
}