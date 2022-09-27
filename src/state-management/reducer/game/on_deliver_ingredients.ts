import { GameReducerReturn, GameState } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';
import { defaultGameRules } from '../../../types/game_rules';
import { ErrorMessage } from './on_scanned';

export type DeliverIngredientMessage = UserIdMessage & { payload: { ingredientId: string } }

export const onDeliverTask = (state: GameState, message: DeliverIngredientMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }

    logger.debug(`Player ${player.id} delivered task ${message.payload.ingredientId}`);

    player.currentTasks = player.currentTasks.filter(i => i.uuid !== message.payload.ingredientId);

    if (player.role === 'robot') {
        if (player.poisons < defaultGameRules.maxPoisons) {
            player.poisons = player.poisons + 1;
            const newState = <GameState>{
                ...state,
                players: state.players.map(p => {
                    if (p.id === player.id) {
                        return player;
                    }
                    return p;
                })
            }

            const gotPoisonMessage = <SendableMessage>{
                type: "gotPoison",
                payload: {
                    numberOfPoisons: player.poisons
                },
                receivers: player.id
            }

            return [newState, [gotPoisonMessage], []];
        } else {
            const maxPoisonsMessage = <ErrorMessage>{
                type: "error",
                payload: {
                    errorId: "maxPoisons"
                },
                receivers: player.id
            }
            return [state, [maxPoisonsMessage], []]
        }
    } else if (player.role === 'wizard') {
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
            type: "deliveredIngredient",
            payload: {
                tasks: player.currentTasks
            },
            receivers: player.id
        };

        const updateTasksDoneMessage = <SendableMessage>{
            type: "updateTasksDone",
            payload: {
                tasksDone: state.tasksDone
            },
            receivers: "all"
        };

        return [newState, [deliveredIngredientMessage, updateTasksDoneMessage], []];
    }
}