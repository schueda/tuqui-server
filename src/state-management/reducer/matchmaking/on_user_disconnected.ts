import { MatchmakingState, MatchmakingReducerReturn } from '../../../types/state/matchmaking.state';
import { SendableMessage, UserIdMessage } from '../../../types/message';

export const onUserDisconnected = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const updateLobbyMessage = <SendableMessage>{
        type: "userDisconnected",
        payload: {
            userId: message.payload.userId
        },
        receivers: state.users.filter(u => u.nickname).map(u => u.userId)
    }

    return [state, [updateLobbyMessage], []];
}