import { MatchmakingState, MatchmakingReducerReturn } from '../../state/matchmaking.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';

export const onUserConnected = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    if (state.users.find(u => u.id === message.payload.userId)) {
        return [state, []];
    }

    const newState = {
        ...state,
        users: [
            ...state.users,
            {
                id: message.payload.userId,
                ready: false
            }
        ]
    };

    const youreConnectedMessage = <SendableMessage>{
        type: 'youreConnected',
        receivers: message.payload.userId
    };

    return [newState, [youreConnectedMessage]];
}

