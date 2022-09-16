import { UserIdMessage, SendableMessage } from '../../../types/message';
import { MatchmakingState, MatchmakingReducerReturn } from '../../../types/state/matchmaking.state';


export type SendNicknameMessage = UserIdMessage & { payload: { nickname: string } };

export const onSendNickname = (state: MatchmakingState, message: SendNicknameMessage): MatchmakingReducerReturn => {
    const user = state.users.find(u => u.id === message.payload.userId);
    if (!user) {
        return [state, [], []];
    }

    const newState = {
        ...state,
        users: state.users.map(u => {
            if (u.id === user.id) {
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
        receivers: user.id
    }

    const userSentNicknameMessage = <SendableMessage>{
        type: "userSentNickname",
        payload: {
            userId: user.id,
            nickname: message.payload.nickname
        },
        receivers: newState.users.filter(u => u.nickname).map(u => u.id)
    };

    return [newState, [youSentNicknameMessage, userSentNicknameMessage], []];
}