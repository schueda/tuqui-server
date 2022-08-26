import { UserIdMessage, SendableMessage } from '../../../types/message';
import { GameReducerReturn, GameState } from '../../../types/state/game.state';

export const onCallMeeting = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    };

    const newState = <GameState>{
        ...state,
        meetingCalled: true,
        players: state.players.map(p => {
            if (p.id === player.id) {
                p.attendedToMeeting = true;
            }
            p.taskBeingDone = null;

            return p;
        }),
    }

    const onLobbyMessage = <SendableMessage>{
        type: 'onMeetingLobby',
        receivers: player.id
    }

    const meetingCalledMessage = <SendableMessage>{
        type: 'meetingCalled',
        payload: {
            players: newState.players,
            alivePlayers: newState.players.filter(p => p.isAlive).map(p => { p.id }),
            onMeetingPlayers: newState.players.filter(p => p.attendedToMeeting).map(p => { p.id })
        },
        receivers: "all"
    }

    return[newState, [onLobbyMessage, meetingCalledMessage], []];
}