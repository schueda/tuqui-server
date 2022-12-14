export type GameRules = {
    votationTime: number;
    timeToDie: number;

    taskDeliveryMode: "returnCenter" | "autoDelivery";
    taskCountMode: "updateRecurrently" | "updateOnDelivery" | "updateOnMeeting";

    numberOfRobots: number;
    tasksToGetPoison: number;
    maxPoisons: number;

    numberOfCurrentTasks: number;
    tasksPerWizard: number;
};

export const defaultGameRules: GameRules = {
    votationTime: 10,
    timeToDie: 20000,
    taskDeliveryMode: "returnCenter",
    taskCountMode: "updateOnDelivery",
    numberOfRobots: 2,
    tasksToGetPoison: 2,
    maxPoisons: 1,
    numberOfCurrentTasks: 2,
    tasksPerWizard: 4,
};