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

        const youreConnectedMessage = <SendableMessage>{
            type: "youreConnected",
            receivers: message.payload.userId
        };

        return [state, [youreConnectedMessage, userConnectedMessage], []];
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

    const playerConnectedMessage = <SendableMessage>{
        type: "userConnected",
        payload: {
            user: newUser
        },
        receivers: newState.users.filter(u => u.nickname).map(u => u.userId),
    }

    const youreConnectedMessage = <SendableMessage>{
        type: "youreConnected",
        receivers: message.payload.userId
    };

    return [newState, [youreConnectedMessage, playerConnectedMessage], []];
}

