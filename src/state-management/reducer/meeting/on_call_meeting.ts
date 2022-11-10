import { UserIdMessage, SendableMessage } from '../../../types/message';
import { GameReducerReturn, GameState, ReducedPlayer, getAlivePlayers } from '../../../types/state/game.state';

export const onCallMeeting = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    };

    //TODO: PAUSAR OS ENVENAMENTOS

    const newState = <GameState>{
        ...state,
        mode: "meetingCalled",
        players: state.players.map(p => {
            if (p.id === player.id) {
                p.attendedToMeeting = true;
            }
            p.taskBeingDone = null;
            p.diedRecently = false;

            return p;
        }),
    }

    var messages: SendableMessage[] = []
    newState.players.forEach(p => messages.push(<SendableMessage>{
        type: "meetingCalled",
        payload: {
            players: newState.players.map(p => {
                return <ReducedPlayer>{
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.alive,
                    attendedToMeeting: p.attendedToMeeting
                }
            }),
            onMeeting: p.id === player.id || !p.alive,
            deadCount: state.players.length - getAlivePlayers(state).length
        },
        receivers: p.id
    }))


    return [newState, messages, []];
}