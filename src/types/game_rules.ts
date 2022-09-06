export type GameRules = {
    votationTime: number;
    timeToDie: number;

    taskDeliveryMode: "returnCenter" | "autoDelivery";
    taskCountMode: "updateRecurrently" | "updateOnDelivery" | "updateOnMeeting";

    numberOfRobots: number;
    ingredientsToGetPoison: number;
    maxPoisons: number;

    maxIngredients: number;
    numberOfCurrentTasks: number;
    tasksPerWizard: number;
};

export const defaultGameRules: GameRules = {
    votationTime: 10,
    timeToDie: 5000,
    taskDeliveryMode: "returnCenter",
    taskCountMode: "updateOnDelivery",
    numberOfRobots: 1,
    ingredientsToGetPoison: 2,
    maxPoisons: 2,
    maxIngredients: 10,
    numberOfCurrentTasks: 2,
    tasksPerWizard: 2,
};