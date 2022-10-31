export class StateLogEntry {
    message: Record<string, unknown> & {
        type: string;
        timestamp?: number;
    };
    newState: Record<string, unknown>;
    messages: Record<string, unknown>[];
    scheduledActions: Record<string, unknown>[];
}
