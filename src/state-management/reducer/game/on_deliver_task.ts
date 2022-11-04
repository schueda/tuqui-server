import { GameReducerReturn, GameState, getWizards, getRobots, ReducedPlayer } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';
import { defaultGameRules } from '../../../types/game_rules';
import { ErrorMessage } from './on_scanned';
import { GameTaskGenerator } from '../../../types/game_task_generator';

export type DeliverTaskMessage = UserIdMessage & { payload: { taskId: string } }

export const onDeliverTask = (state: GameState, message: DeliverTaskMessage, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }

    player.currentTasks = player.currentTasks.filter(i => i.uuid !== message.payload.taskId);
    if (player.currentTasks.length === 0) {
        player.currentTasks = taskGenerator.generateTasks(player.role, false);
    }

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
                    numberOfPoisons: player.poisons,
                    tasks: player.currentTasks

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

        if (newState.tasksDone >= defaultGameRules.tasksPerWizard * getWizards(newState).length) {
            const wizardsWon = <SendableMessage>{
                type: "wizardsWon",
                payload: {
                    wizards: getWizards(newState).map(w => {
                        return <ReducedPlayer>{
                            scanId: w.id,
                            nickname: w.nickname,
                            alive: w.alive,
                            attendedToMeeting: w.attendedToMeeting
                        }
                    }),
                    robots: getRobots(newState).map(w => {
                        return <ReducedPlayer>{
                            scanId: w.id,
                            nickname: w.nickname,
                            alive: w.alive,
                            attendedToMeeting: w.attendedToMeeting
                        }
                    })
                },
                receivers: "all"
            }
            return [newState, [wizardsWon], []];
        }

        const deliveredTaskMessage = <SendableMessage>{
            type: "deliveredTask",
            payload: {
                tasks: player.currentTasks
            },
            receivers: player.id
        };

        const updateTasksDoneMessage = <SendableMessage>{
            type: "updateTasksDone",
            payload: {
                tasksDone: newState.tasksDone
            },
            receivers: "all"
        };

        return [newState, [deliveredTaskMessage, updateTasksDoneMessage], []];
    }
}