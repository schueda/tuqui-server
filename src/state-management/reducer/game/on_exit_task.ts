import { GameState, GameReducerReturn } from '../../../types/state/game.state';
import { UserIdMessage } from '../../../types/message';

export const onExitTask = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }

    return [{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return {
                    ...p,
                    taskBeingDone: undefined
                };
            }

            return p;
        })
    }, [], []];
}