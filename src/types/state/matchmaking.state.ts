import { NewSchedulableAction } from '../action';
import { SendableMessage } from '../message';

export type MatchmakingUser = {
    userId: string;
    nickname?: string;
    ready: boolean;
}

export type MatchmakingState = {
    users: MatchmakingUser[];
}

export type MatchmakingReducerReturn = [MatchmakingState, SendableMessage[], NewSchedulableAction[]];