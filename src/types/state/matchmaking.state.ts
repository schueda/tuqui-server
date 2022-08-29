import { NewSchedulableAction } from '../action';
import { SendableMessage } from '../message';

export type MatchmakingUser = {
    id: string;
    nickname?: string;
    ready: boolean;
}

export type MatchmakingState = {
    users: MatchmakingUser[];
}

export type MatchmakingReducerReturn = [MatchmakingState, SendableMessage[], NewSchedulableAction[]];