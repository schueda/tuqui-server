import { MatchmakingState, MatchmakingReducerReturn, MatchmakingUser } from '../../../types/state/matchmaking.state';
import { UserIdMessage, SendableMessage, Message } from '../../../types/message';
import { NewSchedulableAction } from '../../../types/action';

export const internalGameCreateActionType = 'internalGameCreate';
export type GameCreateMessage = Message & { payload: { users: MatchmakingUser[] } }

export const onConfirmedReady = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.id === message.payload.userId);
    if (!user || !user.nickname) {
        return [state, [], []];
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
    if (readyCount === newState.users.length && newState.users.length >= 1) {
        const internalGameCreateAction = <NewSchedulableAction>{
            message: <GameCreateMessage>{
                type: internalGameCreateActionType,
                payload: {
                    users: newState.users
                },
            },
            delay: 0
        };

        return [newState, [], [internalGameCreateAction]];
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

    return [newState, [playerReadyMessage, youreReadyMessage], []];
}