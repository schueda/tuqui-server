import { MatchmakingState, MatchmakingReducerReturn, MatchmakingUser } from '../../../types/state/matchmaking.state';
import { UserIdMessage, SendableMessage, Message } from '../../../types/message';
import { NewSchedulableAction } from '../../../types/action';

export const internalGameCreateActionType = 'internalGameCreate';
export type GameCreateMessage = Message & { payload: { users: MatchmakingUser[] } }

export const onConfirmedReady = (state: MatchmakingState, message: UserIdMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.userId === message.payload.userId);
    if (!user || !user.nickname) {
        return [state, [], []];
    }

    const newState = {
        ...state,
        users: state.users.map(u => {
            if (u.userId === user.userId) {
                return {
                    ...u,
                    isReady: true
                };
            }

            return u;
        }),
    };

    const readyCount = newState.users.filter(u => u.isReady).length;
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

        newState.users = newState.users.map(u => {
            return {
                ...u,
                isReady: false
            };
        });

        return [newState, [], [internalGameCreateAction]];
    }

    const playerReadyMessage = <SendableMessage>{
        type: "userReady",
        payload: {
            userId: message.payload.userId
        },
        receivers: state.users.filter(u => u.nickname).map(u => u.userId)
    };

    const youreReadyMessage = <SendableMessage>{
        type: "youreReady",
        receivers: user.userId
    };

    return [newState, [playerReadyMessage, youreReadyMessage], []];
}