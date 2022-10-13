export type GameTask = {
    uuid: string;
    scanId: string;
    payload?: Record<string, unknown>;
    type: "blocked" | "blowTheBugs" | "cleanTheGems" | "outOfLab" | "scanThem" | "spellTheSpell"
    completed: boolean;
}