import { GameReducerReturn, GameState } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';

export const onDeliverIngredients = (state: GameState, message: UserIdMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.useId);
    if (!player) {
        return [state, [], []];
    }

    const newState = <GameState>{
        ...state,
        tasksDone: state.tasksDone + player.ingredients,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return {
                    ...p,
                    ingredients: 0
                };
            }
            return p;
        })
    }

    const deliveredIngredientsMessage = <SendableMessage>{
        type: 'deliveredIngredients',
        receivers: player.id
    }

    return [newState, [deliveredIngredientsMessage], []];
}