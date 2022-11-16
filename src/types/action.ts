import { Message } from "./message";

export type SchedulableActionCategory = "kill";

export type SchedulableAction = {
    id: string;
    message: Message;
    creationTime: number;
    delay: number;
    category?: SchedulableActionCategory;
    cancellable?: NodeJS.Timeout;
};


export type NewSchedulableAction = Pick<SchedulableAction, "message" | "delay" | "category">