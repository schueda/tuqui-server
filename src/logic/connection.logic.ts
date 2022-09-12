import { ConnectionDatabase } from "../data/connection.db";
import { UserIdMessage, Message, SendableMessage } from '../types/message';
import { logger } from '../logger';
import { Socket } from 'socket.io';

export type ReceiverRole = "user" | "service";

export class ConnectionService {

    constructor(private db: ConnectionDatabase) { }

    connect(socket: Socket) {
        logger.debug(`[ConnectionService.connect] Connecting socket ${socket.id}`);

        // TODO: Do Joi validation
        const userId = <string>socket.handshake.query.userId;
        const serviceId = <string>socket.handshake.query.serviceId;


        if (userId) {
            this.db.updateConnection(userId, socket);

            // Handle a user
            socket.on('disconnect', () => {
                logger.debug(`[app.listen] User disconnected`)

                this.disconnect(socket);
            });

            // Register the socket for all receivers
            for (const receiver of this.db.getAllReceivers(['user'])) {
                logger.debug(`[ConnectionService.connect] Registering message receiver for ${receiver.messageType}`);
                socket.on(receiver.messageType, (message: Message) => {
                    logger.debug(`[ConnectionService.connect] Received message ${receiver.messageType}`);
                    receiver.callback(message);
                });
            }

            // Call all connection receivers
            for (const receiver of this.db.getAllConnectionReceivers()) {
                receiver(<UserIdMessage>{
                    type: 'connection',
                    payload: {
                        userId: userId,
                    },
                });
            }
        } else if (serviceId) {
            logger.debug(`[ConnectionService.connect] Connecting service ${serviceId}`);
            this.db.updateConnection(serviceId, socket);

            // Handle as a service
            socket.on('disconnect', () => {
                logger.debug(`[app.listen] Service disconnected`)

                this.disconnect(socket);

                // Fatal error
                process.exit(10);
            });

            // Register the socket for all receivers
            for (const receiver of this.db.getAllReceivers(['service'])) {
                logger.debug(`[ConnectionService.connect] Registering message receiver for ${receiver.messageType}`);
                socket.on(receiver.messageType, (message: Message) => {
                    logger.debug(`[ConnectionService.connect] Received message ${receiver.messageType}`);
                    receiver.callback(message);
                });
            }
        }
    }

    disconnect(socket: Socket) {
        logger.debug(`[ConnectionService.disconnect] Disconnecting socket ${socket.id}`);

        for (const receiver of this.db.getAllDisconnectionReceivers()) {
            receiver(<UserIdMessage>{
                type: 'disconnection',
                payload: {
                    userId: socket.handshake.query.userId,
                },
            });
        }
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
                logger.debug(`[ConnectionService.emit] Emitting message to ${receiver}`);
                const socket = this.db.getSocket(receiver);
                if (socket) {
                    socket.emit(message.type, {
                        type: message.type,
                        payload: message.payload,
                    });
                }
            }
        }
        // If a string, send to that user
        else if (typeof message.receivers === 'string') {
            const socket = this.db.getSocket(message.receivers);
            if (socket) {
                socket.emit(message.type, {
                    type: message.type,
                    payload: message.payload,
                });
            }
        }
    }

    registerMessageReceiver(messageType: string, roles: ReceiverRole[], callback: (message: Message) => void) {
        // logger.debug(`[ConnectionService.registerMessageReceiver] Registering message receiver for ${messageType}`);

        // Store the callback in the db so we can call it for future sockets
        this.db.registerMessageReceiver({ messageType, callback }, roles);
    }

    registerConnectionReceiver(id: string, callback: (message: UserIdMessage) => void) {
        // logger.debug(`[ConnectionService.registerConnectionReceiver] Registering connection receiver for ${id}`);

        // Store the callback in the db so we can call it for future sockets
        this.db.registerConnectionReceiver(id, callback);
    }

    registerDisconnectionReceiver(id: string, callback: (message: UserIdMessage) => void) {
        // logger.debug(`[ConnectionService.registerDisconnectionReceiver] Registering disconnection receiver for ${id}`);

        // Store the callback in the db so we can call it for future sockets
        this.db.registerDisconnectionReceiver(id, callback);
    }
}