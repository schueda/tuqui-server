import { Socket } from 'socket.io';
import { logger } from '../logger';
import { Message, UserIdMessage } from '../types/message';

export type UserConnectionEntry = {
    socket: Socket;
}

export type MessageReceiver = {
    messageType: string;
    callback: (message: Message) => void;
}

export type ConnectionReceiver = (message: UserIdMessage) => void;

export class ConnectionDatabase {

    // Key value database for storing a user's connection
    private connections: Map<string, UserConnectionEntry> = new Map<string, UserConnectionEntry>();

    // Key value database for message types and callbacks
    private messageReceivers: Map<string, MessageReceiver> = new Map<string, MessageReceiver>();

    // Key value database for connection events
    private connectionReceivers: Map<string, ConnectionReceiver> = new Map<string, ConnectionReceiver>();

    updateConnection(userId: string, socket: Socket) {
        logger.debug(`[ConnectionDatabase.updateConnection] Updating connection for ${userId}`);
        this.connections.set(userId, { socket: socket });
    }

    getSocket(userId: string): Socket | undefined {
        logger.debug(`[ConnectionDatabase.getSocket] Getting socket for ${userId}`);
        return this.connections.get(userId).socket;
    }

    getSocketByID(socketId: string): Socket | undefined {
        logger.debug(`[ConnectionDatabase.getSocketByID] Getting socket for ${socketId}`);
        for (const entry of this.connections.values()) {
            if (entry.socket.id === socketId) {
                return entry.socket;
            }
        }
        return undefined;
    }

    getAllSockets(): Socket[] {
        logger.debug(`[ConnectionDatabase.getAllSockets] Getting all sockets`);
        return Array.from(this.connections.values()).map(entry => entry.socket);
    }

    // Message receiver
    registerMessageReceiver(receiver: MessageReceiver) {
        logger.debug(`[ConnectionDatabase.registerMessageReceiver] Registering message receiver for ${receiver.messageType}`);
        this.messageReceivers.set(receiver.messageType, receiver);
    }

    getAllReceivers(): MessageReceiver[] {
        logger.debug(`[ConnectionDatabase.getAllReceivers] Getting all message receivers`);
        return Array.from(this.messageReceivers.values());
    }

    // Connection receiver
    registerConnectionReceiver(id: string, callback: ConnectionReceiver) {
        logger.debug(`[ConnectionDatabase.registerConnectionReceiver] Registering connection receiver for ${id}`);
        this.connectionReceivers.set(id, callback);
    }

    getAllConnectionReceivers(): ConnectionReceiver[] {
        logger.debug(`[ConnectionDatabase.getAllConnectionReceivers] Getting all connection receivers`);
        return Array.from(this.connectionReceivers.values());
    }
}