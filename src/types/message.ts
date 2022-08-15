export type MessageCategory = 'connection' | 'matchmaking' | 'game' | 'meeting';

export type Message = {
    type: string;
    payload?: Record<string, unknown>;
}

export type SimpleMessage = Message & {
    payload: {
        text: string;
    };
}

export type UserIdMessage = Message & {
    payload: {
        userId: string;
    };
}

export type SendableMessage = Message & {
    receivers: string[] | string;
};