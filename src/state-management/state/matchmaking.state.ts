import { SendableMessage } from '../../types/message';

export type MatchmakingUser = {
    id: string;
    name: string;
    ready: boolean;
}

export type MatchmakingRules = {
    minPlayers: number;
    maxPlayers: number;
}

export type MatchmakingState = {
    rules: MatchmakingRules;
    users: MatchmakingUser[];
}

export type MatchmakingReducerReturn = [MatchmakingState, SendableMessage[]];