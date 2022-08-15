import { MatchmakingState, MatchmakingReducerReturn } from '../../state/matchmaking.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';

export const onConfirmedReady = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.id === message.payload.userId);
    if (!user) {
        return [state, []];
    }

    const newState = {
        ...state,
        users: state.users.map(u => {
            if (u.id === user.id) {
                return {
                    ...u,
                    ready: true
                };
            }

            return u;
        }),
    };

    const readyCount = newState.users.filter(u => u.ready).length;
    //TODO: Move to a envfile or gameRules
    if (readyCount === newState.users.length && newState.users.length >= 4) {
        const playersInitialInfo = []; //TODO: Generate playersInitialInfo
        const startMessage = <SendableMessage>{
            type: 'start',
            payload: {
                playersInitialInfo
            },
            receivers: 'all'
        };
        return [newState, [startMessage]];
    }

    const playerReadyMessage = <SendableMessage>{
        type: 'playerReady',
        payload: {
            users: newState.users
        },
        receivers: state.users.filter(u => u.nickname).map(u => u.id)
    };

    const youreReadyMessage = <SendableMessage>{
        type: 'youreReady',
        receivers: user.id
    };

    return [newState, [playerReadyMessage, youreReadyMessage]];
}