import { GameState, GameReducerReturn, getWizards, getRobots } from '../../../types/state/game.state';
import { PlayerDiedMessage } from './on_scanned';
import { SendableMessage } from '../../../types/message';

export const onPlayerDied = (state: GameState, message: PlayerDiedMessage): GameReducerReturn => {
    var player = message.payload.player;
    player.isAlive = false;
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

    if (getWizards(state).filter(p => player.isAlive).length === 0) {
        const message = <SendableMessage>{
            type: "robotsWon",
            payload: {
                wizards: getWizards(state).map(p => {
                    return {
                        id: p.id,
                        nickname: p.nickname
                    }
                }),
                robots: getRobots(state).map(p => {
                    return {
                        id: p.id,
                        nickname: p.nickname
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