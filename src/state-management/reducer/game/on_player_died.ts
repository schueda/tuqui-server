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

    if (getWizards(state).length === 0) {
        const message = <SendableMessage>{
            type: 'robotsWon',
            payload: {
                wizards: getWizards(state),
                robots: getRobots(state)
            },
            receivers: "all"
        }

        return [state, [message], []];
    }

    const youDiedMessage = <SendableMessage>{
        type: 'youDied',
        receivers: player.id
    }
    return [state, [youDiedMessage], []];

}