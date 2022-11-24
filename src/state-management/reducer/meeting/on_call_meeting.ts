import { SchedulingService } from '../../../logic/scheduling.logic';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { GameReducerReturn, GameState, ReducedPlayer, getAlivePlayers, getWizards } from '../../../types/state/game.state';

export const onCallMeeting = (state: GameState, message: UserIdMessage, scheSvc: SchedulingService): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    };

    scheSvc.pauseAllActions();

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
            deadCount: getWizards(state).length - getWizards(state).filter(p => !p.alive).length
        },
        receivers: p.id
    }))


    return [newState, messages, []];
}