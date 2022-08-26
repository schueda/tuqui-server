export class StateLogEntry {
    message: Record<string, unknown> & {
        type: string;
        timestamp?: number;
    };
    newState: Record<string, unknown>;
}