import { MatchmakingState, MatchmakingReducerReturn } from '../../state/matchmaking.state';
import { ConnectionMessage } from '../../../types/message';

export const onUserConnected = (state: MatchmakingState, message: ConnectionMessage): MatchmakingReducerReturn => {
    if (state.users.find(u => u.id === message.payload.userId)) {
        return [state, []];
    }

    return [{
        ...state,
        users: [
            ...state.users,
            {
                id: message.payload.userId,
                name: '',
                ready: false
            }
        ]
    }, []];
}