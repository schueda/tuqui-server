export type GameTask = {
    uuid: string;
    scanId: string;
    name: string;
    payload: Record<string, unknown>;
    type: "cleanJewels" | "tapFast" | "scanPlayer" | "maze";
    completed: boolean;
}