import { NewSchedulableAction } from '../../../types/action';
import { GameState, GameReducerReturn, Player, getWizards, getRobots, getAlivePlayers } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { defaultGameRules } from '../../../types/game_rules';
import { GameTask } from '../../../types/game_task';
import { logger } from '../../../logger';
import { GameTaskGenerator } from '../../../types/game_task_generator';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { errorId: string } }

export const internalStartMeetingActionType = 'startMeeting';

export const onScanned = (state: GameState, message: ScannedMessage, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        logger.debug(`[game/onScanned] player not found`);
        return [state, [], []];
    }

    if (state.mode === "gameRunning") {
        if (originPlayer.isAlive) {
            if (defaultTags.playerTags.includes(message.payload.scanResult)) {
                var targetPlayer = state.players.find(p => p.id === message.payload.scanResult);
                if (!targetPlayer) {
                    return [state, [buildNotValidPlayerMessage(originPlayer)], []];
                }

                if (targetPlayer.id === originPlayer.id) {
                    return [state, [buildScanningYourselfMessage(originPlayer)], []];
                }

                if (originPlayer.taskBeingDone) {
                    return [state, [buildFinishTaskMessage(originPlayer)], []];
                }
                if (targetPlayer.isAlive) {
                    if (originPlayer.role === "robot") {
                        if (targetPlayer.role === "wizard") {
                            if (originPlayer.poisons > 0) {
                                if (targetPlayer.poisonTime === undefined) {
                                    return onPlayerPoisoned(state, originPlayer, targetPlayer);
                                }
                                return [state, [buildAlreadyPoisonedMessage(originPlayer, targetPlayer)], []];
                            }
                            return [state, [buildOutOfPoisonMessage(originPlayer)], []];
                        }
                        return [state, [buildCantPoisonRobot(originPlayer, targetPlayer)], []];
                    }
                    const task = originPlayer.currentTasks.find(t => t.type === 'scanThem');
                    if (task) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            return [state, [buildUnloadBagMessage(originPlayer)], []];
                        }
                        if (defaultGameRules.taskDeliveryMode === "autoDelivery") {
                            return onAutoDeliveredTask(state, originPlayer, task, taskGenerator);
                        }
                    }
                    return [state, [buildShouldntScanPlayerMessage(originPlayer, targetPlayer)], []];
                }
                if (targetPlayer.diedRecently) {
                    return onBodyScanned(state, originPlayer, targetPlayer);
                }
                return [state, [buildScannedGhostMessage(originPlayer, targetPlayer)], []];
            }
            if (defaultTags.taskTags.includes(message.payload.scanResult)) {
                const taskBeingDone = originPlayer.taskBeingDone;
                if (taskBeingDone) {
                    if (taskBeingDone.scanId === message.payload.scanResult) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            return onPlayerCompletedTask(state, originPlayer, taskBeingDone, taskGenerator);
                        }
                        if (originPlayer.role === "robot") {
                            return onPlayerReceivedPoison(state, originPlayer);
                        }
                        return onAutoDeliveredTask(state, originPlayer, taskBeingDone, taskGenerator);
                    }
                    return [state, [buildFinishTaskMessage(originPlayer)], []];
                }
                const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                if (task) {
                    return onPlayerDoingTask(state, originPlayer, task);
                }
                return [state, [buildTaskNotInListMessage(originPlayer)], []];
            }
            if (defaultTags.campfireTag == message.payload.scanResult) {
                return [state, [buildOnTheCampfireMessage(originPlayer)], []];
            }
            return [state, [buildInvalidTagMessage(originPlayer)], []];
        } else {
            return [state, [buildYoureDeadMessage(originPlayer)], []];
        }
    }

    return [undefined, [], []];
}

const buildNotValidPlayerMessage = (originPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "notPlayingPlayer",
        },
        receivers: originPlayer.id
    }
}

const buildFinishTaskMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "finishTask",
        },
        receivers: player.id
    }
}

export const internalPlayerPoisonedActionType = 'playerPoisoned';

export const playerDiedMessageType = 'playerDied';
export type PlayerDiedMessage = SendableMessage & { payload: { player: Player } };

const onPlayerPoisoned = (state: GameState, originPlayer: Player, targetPlayer: Player): GameReducerReturn => {
    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === originPlayer.id) {
                return {
                    ...p,
                    poisons: p.poisons - 1
                };
            }

            if (p.id === targetPlayer.id) {
                return {
                    ...p,
                    poisonTime: Date.now()
                };
            }

            return p;
        })
    }

    var messages: SendableMessage[] = [];
    messages.push(<SendableMessage>{
        type: "poisonedPlayer",
        payload: {
            player: {
                scanId: targetPlayer.id,
                nickname: targetPlayer.nickname,
                alive: targetPlayer.isAlive,
                attendedToMeeting: targetPlayer.attendedToMeeting
            }
        },
        receivers: originPlayer.id
    });

    var actions: NewSchedulableAction[] = [];
    actions.push(<NewSchedulableAction>{
        type: internalPlayerPoisonedActionType,
        message: <PlayerDiedMessage>{
            type: playerDiedMessageType,
            payload: {
                player: targetPlayer
            },

        },
        delay: defaultGameRules.timeToDie,
    });

    return [state, messages, actions];
}

const buildAlreadyPoisonedMessage = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "alreadyPoisoned",
        },
        receivers: originPlayer.id
    };
}

const buildOutOfPoisonMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "outOfPoison",
        },
        receivers: player.id
    };
}

const buildCantPoisonRobot = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "cantPoisonRobot"
        },
        receivers: originPlayer.id
    };
}

const onPlayerCompletedTask = (state: GameState, player: Player, task: GameTask, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    player.currentTasks = player.currentTasks.map(t => {
        if (t.uuid === task.uuid) {
            t.completed = true;
            return t;
        }
        return t;
    });

    player.taskBeingDone = null;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }

            return p;
        })
    }

    var messages: SendableMessage[] = [];
    messages.push(<SendableMessage>{
        type: "completedTask",
        payload: {
            tasks: player.currentTasks
        },
        receivers: player.id
    });


    return [state, messages, []];
}

const buildScanningYourselfMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "scanSelf"
        },
        receivers: player.id
    };
}

const buildUnloadBagMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "unloadBag",
        },
        receivers: player.id
    };
}

const onAutoDeliveredTask = (state: GameState, player: Player, task: GameTask, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    player.currentTasks = player.currentTasks.filter(t => t !== task);
    if (player.currentTasks.length === 0) {
        player.currentTasks = taskGenerator.generateTasks();
    }

    player.taskBeingDone = null;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }

            return p;
        }),
        tasksDone: state.tasksDone + 1
    }

    var messages: SendableMessage[] = [];
    if (state.tasksDone >= defaultGameRules.tasksPerWizard * getWizards(state).length) {
        messages.push(<SendableMessage>{
            type: "wizardsWon",
            payload: {
                wizards: getWizards(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname
                    };
                }),
                robots: getRobots(state).map(p => {
                    return {
                        scanId: p.id,
                        nickname: p.nickname
                    };
                }),
            },
            receivers: "all"
        });
    } else {
        messages.push(<SendableMessage>{
            type: "autoCompletedTask",
            payload: {
                tasks: player.currentTasks,
            },
            receivers: player.id
        });

        messages.push(<SendableMessage>{
            type: "updateTasksDone",
            payload: {
                tasksDone: state.tasksDone
            },
            receivers: "all"
        })
    }

    return [state, messages, []];
}



const buildShouldntScanPlayerMessage = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "shouldntScanPlayer",
        },
        receivers: originPlayer.id
    };
}

const onBodyScanned = (state: GameState, originPlayer: Player, targetPlayer: Player): GameReducerReturn => {
    targetPlayer.diedRecently = false;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === targetPlayer.id) {
                return targetPlayer;
            }
            return p;
        })
    };

    var messages: SendableMessage[] = [];
    messages.push(<SendableMessage>{
        type: "youFoundADeadBody",
        payload: {
            player: {
                scanId: targetPlayer.id,
                nickname: targetPlayer.nickname,
                alive: targetPlayer.isAlive,
                attendedToMeeting: targetPlayer.attendedToMeeting
            }
        },
        receivers: originPlayer.id
    })

    state.players.filter(p => p.id !== originPlayer.id).forEach(p => {
        messages.push(<SendableMessage>{
            type: "deadBodyWasFound",
            payload: {
                player: {
                    scanId: targetPlayer.id,
                    nickname: targetPlayer.nickname,
                    alive: targetPlayer.isAlive,
                    attendedToMeeting: targetPlayer.attendedToMeeting
                },
                deadCount: state.players.length - getAlivePlayers(state).length
            },
            receivers: p.id
        })
    })

    return [state, messages, []];
}

const buildScannedGhostMessage = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: `scannedGhost`
        },
        receivers: originPlayer.id
    };
}

const onPlayerReceivedPoison = (state: GameState, player: Player): GameReducerReturn => {
    if (player.poisons >= defaultGameRules.maxPoisons) {
        const message = <ErrorMessage>{
            type: "error",
            payload: {
                errorId: "maxPoisons",
            },
            receivers: player.id
        }
        return [state, [message], []];
    }

    player.poisons++;
    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }

            return p;
        })
    };
    const message = <SendableMessage>{
        type: "receivedPoison",
        payload: {
            numberOfPoisons: player.poisons
        },
        receivers: player.id
    }

    return [state, [message], []];
}

const onPlayerDoingTask = (state: GameState, player: Player, task: GameTask): GameReducerReturn => {
    player.taskBeingDone = task;

    state = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return player;
            }
            return p;
        })
    }

    const message = <SendableMessage>{
        type: "task",
        payload: {
            task
        },
        receivers: player.id
    }

    return [state, [message], []];
}

const buildTaskMessage = (player: Player, task: GameTask): SendableMessage => {
    return <SendableMessage>{
        type: "task",
        payload: {
            task
        },
        receivers: player.id
    };
}

const buildTaskNotInListMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "taskNotInList",
        },
        receivers: player.id
    };
}

const buildOnTheCampfireMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "onTheCampfire",
        receivers: player.id
    };
}

const buildInvalidTagMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "invalidTag",
        },
        receivers: player.id
    }
}

export const buildYoureDeadMessage = (player: Player): SendableMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            errorId: "youreDead",
        },
        receivers: player.id
    }
}