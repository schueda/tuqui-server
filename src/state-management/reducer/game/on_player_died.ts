import { GameState, GameReducerReturn, getWizards, getRobots, ReducedPlayer } from '../../../types/state/game.state';
import { PlayerDiedMessage } from './on_scanned';
import { SendableMessage } from '../../../types/message';

export const onPlayerDied = (state: GameState, message: PlayerDiedMessage): GameReducerReturn => {
    var player = message.payload.player;
    player.alive = false;
    player.diedRecently = true;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }
            return p;
        })
    }

    if (getWizards(state).filter(p => p.alive).length === 0) {
        const message = <SendableMessage>{
            type: "robotsWon",
            payload: {
                wizards: getWizards(state).map(p => {
                    return <ReducedPlayer>{
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                }),
                robots: getRobots(state).map(p => {
                    return <ReducedPlayer>{
                        scanId: p.id,
                        nickname: p.nickname,
                        alive: p.alive,
                        attendedToMeeting: p.attendedToMeeting
                    }
                })
            },
            receivers: "all"
        }

        return [state, [message], []];
    }

    const youDiedMessage = <SendableMessage>{
        type: "youDied",
        receivers: player.id
    }
    return [state, [youDiedMessage], []];

}