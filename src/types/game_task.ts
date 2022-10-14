export type GameTask = {
    uuid: string;
    scanId: string;
    payload?: GameTaskPayload;
    type: "blocked" | "blowTheBugs" | "cleanTheGems" | "outOfLab" | "scanThem" | "spellTheSpell"
    completed: boolean;
}

export type GameTaskPayload = {
    type: "difficulty" | "clicks";
    data: Record<string, unknown>;
}