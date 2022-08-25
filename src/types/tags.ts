export type Tags = {
    playerTags: string[];
    campfireTag: string;
    taskTags: string[];
}

export const defaultTags: Tags = {
    playerTags: [
        "PLAYER_0_TAG",
        "PLAYER_1_TAG",
        "PLAYER_2_TAG",
        "PLAYER_3_TAG",
        "PLAYER_4_TAG",
        "PLAYER_5_TAG",
        "PLAYER_6_TAG",
        "PLAYER_7_TAG"
    ],
    campfireTag: "CAMPFIRE_TAG",
    taskTags: [
        "TASK_0_TAG",
        "TASK_1_TAG",
        "TASK_2_TAG",
        "TASK_3_TAG",
        "TASK_4_TAG",
    ]
}