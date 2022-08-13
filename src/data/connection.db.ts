import { Socket } from 'socket.io';
import { logger } from '../logger';

export type UserConnectionEntry = {
    socket: Socket;
}

export class ConnectionDatabase {

    // Key value database for storing a user's connection
    private connections: Map<string, UserConnectionEntry> = new Map<string, UserConnectionEntry>();

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
}