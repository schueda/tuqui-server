import { MatchmakingState, MatchmakingReducerReturn, MatchmakingUser } from '../../../types/state/matchmaking.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';

export const onUserConnected = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.userId === message.payload.userId);
    if (user) {
        const userConnectedMessage = <SendableMessage>{
            type: "userConnected",
            payload: {
                user
            },
            receivers: state.users.filter(u => u.nickname).map(u => u.userId),
        }

        return [state, [userConnectedMessage], []];
    }

    const newUser = <MatchmakingUser>{
        userId: message.payload.userId,
        ready: false
    }

    const newState = {
        ...state,
        users: [
            ...state.users,
            newUser
        ]
    };

    const youreConnectedMessage = <SendableMessage>{
        type: "youreConnected",
        receivers: message.payload.userId
    };

    const playerConnectedMessage = <SendableMessage>{
        type: "userConnected",
        payload: {
            user: newUser
        },
        receivers: state.users.filter(u => u.nickname).map(u => u.userId),
    }

    return [newState, [youreConnectedMessage, playerConnectedMessage], []];
}

