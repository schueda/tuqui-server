
import { SendableMessage } from '../message';
import { GameTask } from '../game_task';
import { NewSchedulableAction } from '../../types/action';

export type Player = {
    id: string;
    nickname: string;
    role: "wizard" | "robot";
    poisonTime?: number;
    alive: boolean;
    diedRecently: boolean;
    poisons: number;
    currentTasks: GameTask[];
    taskBeingDone?: GameTask;

    attendedToMeeting: boolean;
    votedPlayer?: string;
    receivedVotes: string[];
}

export type ReducedPlayer = {
    scanId: string;
    nickname: string;
    attendedToMeeting: boolean;
    alive: boolean;
}

export type GameState = {
    players: Player[];
    tasksDone: number;
    totalTasks: number;

    mode: "gameRunning" | "meetingCalled" | "meetingHappening";
    skipVotes: string[];
}


export function getWizards(state: GameState): Player[] {
    return state.players.filter(p => p.role === "wizard");
}

export function getRobots(state: GameState): Player[] {
    return state.players.filter(p => p.role === "robot");
}

export function getAlivePlayers(state: GameState): Player[] {
    return state.players.filter(p => p.alive);
}

export function getOnMeetingPlayers(state: GameState): Player[] {
    return state.players.filter(p => p.attendedToMeeting);
}

export function getPlayerById(state: GameState, id: string): Player {
    return state.players.find(p => p.id === id);
}

export function getVotes(state: GameState): ReducedPlayer[] {
    const votes = state.players.map(p => {
        const votedPlayer = getPlayerById(state, p.votedPlayer)
        if (votedPlayer) {
            return <ReducedPlayer>{
                scanId: votedPlayer.id,
                nickname: votedPlayer.nickname,
                alive: votedPlayer.alive,
                attendedToMeeting: votedPlayer.attendedToMeeting
            }
        }
        return <ReducedPlayer>{
            scanId: "skip",
            nickname: "skip",
            alive: false,
            attendedToMeeting: false
        }
    })

    // Randomize the order of the votes
    for (let i = votes.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [votes[i], votes[j]] = [votes[j], votes[i]];
    }
    return votes;
}

export type GameReducerReturn = [GameState, SendableMessage[], NewSchedulableAction[]];