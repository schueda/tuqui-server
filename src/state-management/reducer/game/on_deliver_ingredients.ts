import { GameReducerReturn, GameState } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { GameTask } from '../../../types/task';

export type DeliverIngredientMessage = UserIdMessage & { payload: { ingredient: GameTask } }

export const onDeliverIngredient = (state: GameState, message: DeliverIngredientMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.useId);
    if (!player) {
        return [state, [], []];
    }

    player.ingredients = player.ingredients.filter(i => i.uuid !== message.payload.ingredient.uuid);

    const newState = <GameState>{
        ...state,
        tasksDone: state.tasksDone + 1,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }
            return p;
        })
    }

    const deliveredIngredientMessage = <SendableMessage>{
        type: 'deliveredIngredient',
        payload: {
            ingredients: player.ingredients
        },
        receivers: player.id
    }

    return [newState, [deliveredIngredientMessage], []];
}