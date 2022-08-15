import { SendableMessage } from '../message';
import { GameTask } from '../task';

export type Player = {
    id: string;
    nickname: string;
    role: "wizard" | "robot";
    poisonTime?: number;
    isAlive: boolean;
    diedRecently: boolean;
    ingredients: number;
    poisons: number;
    taskBeingDone?: GameTask;

    attendedMeeting: boolean;
    votedPlayer?: string;
}

export type GameState = {
    players: Player[];
    tasksDone: number;
    totalTasks: number;

    meetingCalled: boolean;
    meetingHappening: boolean;
}

export type MatchmakingReducerReturn = [GameState, SendableMessage[]];