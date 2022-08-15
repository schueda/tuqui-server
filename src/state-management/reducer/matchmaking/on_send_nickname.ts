import { UserIdMessage, SendableMessage } from '../../../types/message';
import { MatchmakingState, MatchmakingReducerReturn } from '../../state/matchmaking.state';


export type SendNicknameMessage = UserIdMessage & { payload: { nickname: string } };

export const onSendNickname = (state: MatchmakingState, message: SendNicknameMessage): MatchmakingReducerReturn => {
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
                    nickname: message.payload.nickname
                };
            }

            return u;
        }),
    };

    const PlayerEnteredLobbyMessage = <SendableMessage>{
        type: 'playerEnteredLobby',
        payload: {
            users: newState.users
        },
        receivers: newState.users.filter(u => u.nickname).map(u => u.id)
    };
    
    return [newState, [PlayerEnteredLobbyMessage]];
}