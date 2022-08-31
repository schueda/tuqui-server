import { GameState, GameReducerReturn } from '../../../types/state/game.state';
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

    if (state.getWizards().length === 0) {
        const message = <SendableMessage>{
            type: 'robotsWon',
            payload: {
                wizards: state.getWizards(),
                robots: state.getRobots()
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