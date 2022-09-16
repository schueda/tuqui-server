import { MatchmakingState, MatchmakingReducerReturn } from '../../../types/state/matchmaking.state';
import { SendableMessage, UserIdMessage } from '../../../types/message';

export const onUserDisconnected = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const newState = {
        ...state,
        users: state.users.filter(u => u.id !== message.payload.userId)
    };

    const updateLobbyMessage = <SendableMessage>{
        type: "userDisconnected",
        payload: {
            userId: message.payload.userId
        },
        receivers: state.users.filter(u => u.nickname).map(u => u.id)
    }

    return [newState, [updateLobbyMessage], []];
}