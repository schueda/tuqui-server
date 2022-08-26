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
    ingredients: number;
    poisons: number;
    currentTasks: GameTask[];
    taskBeingDone?: GameTask;

    attendedToMeeting: boolean;
    votedPlayer?: string;
    receivedVotes: string[];
}

export class GameState {
    players: Player[];
    tasksDone: number;
    totalTasks: number;

    mode: "gameRunning" | "meetingCalled" | "meetingHappening" 
    skipVotes: string[];

    constructor(players: Player[]) {
        this.players = players;
        this.tasksDone = 0;
        this.totalTasks = 0;
        this.mode = "gameRunning";
    }

    getWizards(): Player[] {
        return this.players.filter(p => p.role === "wizard");
    }

    getRobots(): Player[] {
        return this.players.filter(p => p.role === "robot");
    }

    getAlivePlayers(): Player[] {
        return this.players.filter(p => p.isAlive);
    }

    getOnMeetingPlayers(): Player[] {
        return this.players.filter(p => p.attendedToMeeting);
    }

    getPlayerById(id: string): Player {
        return this.players.find(p => p.id === id);
    }
}

export type GameReducerReturn = [GameState, SendableMessage[], SchedulableAction[]];