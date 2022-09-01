import { SchedulableAction } from '../action';
import { SendableMessage } from '../message';
import { GameTask } from '../task';

export type Player = {
    id: string;
    nickname: string;
    role: "wizard" | "robot";
    poisonTime?: number;
    isAlive: boolean;
    diedRecently: boolean;
    ingredients: GameTask[];
    poisons: number;
    currentTasks: GameTask[];
    taskBeingDone?: GameTask;

    attendedToMeeting: boolean;
    votedPlayer?: string;
    receivedVotes: string[];
}

export type GameState = {
    players: Player[];
    tasksDone: number;
    totalTasks: number;

    mode: "gameRunning" | "meetingCalled" | "meetingHappening";
    skipVotes: string[];x
}


export function getWizards(state: GameState): Player[] {
    return state.players.filter(p => p.role === "wizard");
}

export function getRobots(state: GameState): Player[] {
    return state.players.filter(p => p.role === "robot");
}

export function getAlivePlayers(state: GameState): Player[] {
    return state.players.filter(p => p.isAlive);
}

export function getOnMeetingPlayers(state: GameState): Player[] {
    return state.players.filter(p => p.attendedToMeeting);
}

export function getPlayerById(state: GameState, id: string): Player {
    return state.players.find(p => p.id === id);
}

export type GameReducerReturn = [GameState, SendableMessage[], SchedulableAction[]];