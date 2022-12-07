export type Tags = {
    playerTags: string[];
    campfireTag: string;
    taskTags: string[];
}

export const defaultTags: Tags = {
    playerTags: [
        "PLAYER_BLACK_TAG",
        "PLAYER_BROWN_TAG",
        "PLAYER_DARK_BLUE_TAG",
        "PLAYER_GREEN_TAG",
        "PLAYER_LIGHT_BLUE_TAG",
        "PLAYER_ORANGE_TAG",
        "PLAYER_PINK_TAG",
        "PLAYER_PURPLE_TAG",
        "PLAYER_RED_TAG",
        "PLAYER_YELLOW_TAG"
    ],
    campfireTag: "CAMPFIRE_TAG",
    taskTags: [
        "TASK_JEWELS_TAG",
        "TASK_BUGS_TAG",
        "TASK_MAZE_TAG",
        "TASK_SPELL_TAG",
    ]
}