import { Socket } from 'socket.io';
import { logger } from '../logger';
import { Message, UserIdMessage } from '../types/message';
import { ReceiverRole } from '../logic/connection.logic';

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
    private messageReceivers: Map<string, { receiver: MessageReceiver; roles: ReceiverRole[] }[]> = new Map<string, { receiver: MessageReceiver, roles: ReceiverRole[] }[]>();

    // Key value database for connection events
    private connectionReceivers: Map<string, ConnectionReceiver> = new Map<string, ConnectionReceiver>();

    // Key value database for disconnection events
    private disconnectionReceivers: Map<string, ConnectionReceiver> = new Map<string, ConnectionReceiver>();

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
    registerMessageReceiver(receiver: MessageReceiver, roles: ReceiverRole[]) {
        logger.debug(`[ConnectionDatabase.registerMessageReceiver] Registering message receiver for ${receiver.messageType}`);

        // If a receiver already exists for this type, add it to the list
        if (this.messageReceivers.has(receiver.messageType)) {
            this.messageReceivers.get(receiver.messageType).push({ receiver, roles });
        }
        // Otherwise, create a new list
        else {
            this.messageReceivers.set(receiver.messageType, [{ receiver, roles }]);
        }
    }

    getAllReceivers(roles: ReceiverRole[]): MessageReceiver[] {
        logger.debug(`[ConnectionDatabase.getAllReceivers] Getting all message receivers`);

        // Filter the message receivers by the roles and return the receiver only
        return Array.from(this.messageReceivers.values())
            .flat()
            .filter(entry => entry.roles.some(role => roles.includes(role)))
            .map(entry => entry.receiver);
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


    registerDisconnectionReceiver(id: string, callback: ConnectionReceiver) {
        logger.debug(`[ConnectionDatabase.registerDisconnectionReceiver] Registering disconnection receiver for ${id}`);
        this.disconnectionReceivers.set(id, callback);
    }

    getAllDisconnectionReceivers(): ConnectionReceiver[] {
        logger.debug(`[ConnectionDatabase.getAllDisconnectionReceivers] Getting all disconnection receivers`);
        return Array.from(this.disconnectionReceivers.values());
    }
}