export type Tags = {
    playerTags: string[];
    campfireTag: string;
    taskTags: string[];
}

export const defaultTags: Tags = {
    playerTags: [
        "PLAYER_PURPLE_TAG",
        "PLAYER_BLUE_ROBOT_TAG",
        "PLAYER_GREEN_NATURE_TAG",
        "PLAYER_DARKNESS_TAG",
        "PLAYER_YELLOW_TAG",
        "PLAYER_LILAS_TAG",
        "PLAYER_RED_TAG",
        "PLAYER_GREEN_TAG",
        "PLAYER_BLOOD_TAG",
        "PLAYER_BLUE_TAG",
    ],
    campfireTag: "CAMPFIRE_TAG",
    taskTags: [
        "TASK_JEWELS_TAG",
        "TASK_BUGS_TAG",
        "TASK_MAZE_TAG",
        "TASK_SPELL_TAG",
    ]
}