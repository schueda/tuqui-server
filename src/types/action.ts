import { Message } from "./message";

export type SchedulableAction = {
    message: Message;
    delay: number;
};