import { UserIdMessage, SendableMessage } from '../../../types/message';
import { GameReducerReturn, GameState, getAlivePlayers, getOnMeetingPlayers } from '../../../types/state/game.state';

export const onCallMeeting = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    };

    const newState = <GameState>{
        ...state,
        mode: "meetingCalled",
        players: state.players.map(p => {
            if (p.id === player.id) {
                p.attendedToMeeting = true;
            }
            p.taskBeingDone = null;

            return p;
        }),
    }

    const onLobbyMessage = <SendableMessage>{
        type: "onMeetingLobby",
        receivers: player.id
    }

    const meetingCalledMessage = <SendableMessage>{
        type: "meetingCalled",
        payload: {
            players: newState.players.map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname
                }
            }),
            alivePlayersIds: getAlivePlayers(newState).map(p => p.id),
            onMeetingPlayersIds: getOnMeetingPlayers(newState).map(p =>  p.id)
        },
        receivers: "all"
    }

    return[newState, [onLobbyMessage, meetingCalledMessage], []];
}