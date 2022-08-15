import { SendableMessage } from '../../types/message';

export type MatchmakingUser = {
    id: string;
    nickname?: string;
    ready: boolean;
}

export type MatchmakingState = {
    users: MatchmakingUser[];
}

export type MatchmakingReducerReturn = [MatchmakingState, SendableMessage[]];