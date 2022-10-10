import { UserIdMessage, SendableMessage } from '../../../types/message';
import { MatchmakingState, MatchmakingReducerReturn } from '../../../types/state/matchmaking.state';


export type SendNicknameMessage = UserIdMessage & { payload: { nickname: string } };

export const onSendNickname = (state: MatchmakingState, message: SendNicknameMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.userId === message.payload.userId);
    if (!user) {
        return [state, [], []];
    }

    const newState = {
        ...state,
        users: state.users.map(u => {
            if (u.userId === user.userId) {
                return {
                    ...u,
                    nickname: message.payload.nickname
                };
            }

            return u;
        }),
    };

    const youSentNicknameMessage = <SendableMessage>{
        type: "youSentNickname",
        receivers: user.userId
    }

    const userSentNicknameMessage = <SendableMessage>{
        type: "userSentNickname",
        payload: {
            user: {
                ...user, 
                nickname: message.payload.nickname
            }
        },
        receivers: newState.users.filter(u => u.nickname).map(u => u.userId)
    };

    return [newState, [youSentNicknameMessage, userSentNicknameMessage], []];
}