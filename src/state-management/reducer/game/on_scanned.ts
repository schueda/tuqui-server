import { NewSchedulableAction } from '../../../types/action';
import { GameState, GameReducerReturn, Player } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage, Message } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { defaultGameRules, GameRules } from '../../../types/game_rules';
import { GameTask } from '../../../types/task';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { imageId: string, text: string } }

export const internalStartMeetingActionType = 'startMeeting';

export const onScanned = (state: GameState, message: ScannedMessage): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        return [state, [], []];
    }

    if (originPlayer.isAlive) {
        if (state.mode === "gameRunning") {
            if (defaultTags.playerTags.includes(message.payload.scanResult)) {
                var targetPlayer = state.players.find(p => p.id === message.payload.scanResult);

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
                    const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                    if (task) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            if (originPlayer.ingredients.length < defaultGameRules.maxIngredients) {
                                return onPlayerGotIngredient(state, originPlayer, task);
                            }
                            return [state, [buildUnloadBagMessage(originPlayer)], []];
                        }
                        if (defaultGameRules.taskDeliveryMode === "autoDelivery") {
                            return onAutoDeliveredIngredient(state, originPlayer, task);
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
                            return onPlayerGotIngredient(state, originPlayer, taskBeingDone);
                        }
                        if (originPlayer.role === "robot") {
                            return onPlayerReceivedPoison(state, originPlayer);
                        }
                        return onAutoDeliveredIngredient(state, originPlayer, taskBeingDone);
                    }
                    return [state, [buildFinishTaskMessage(originPlayer)], []];
                }
                const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                if (task) {
                    if (defaultGameRules.taskDeliveryMode === "autoDelivery" || originPlayer.ingredients.length < defaultGameRules.maxIngredients) {
                        return onPlayerDoingTask(state, originPlayer, task);
                    }
                    return [state, [buildTaskNotInListMessage(originPlayer)], []];
                }
            }
            if (defaultTags.campfireTag == message.payload.scanResult) {
                return [state, [buildOnTheCampfireMessage(originPlayer)], []];
            }
            return [state, [buildInvalidTagMessage(originPlayer)], []];
        }
    } else {
        return [state, [buildYoureDeadMessage(originPlayer)], []];
    }
}

const buildFinishTaskMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: player.taskBeingDone.scanId,
            text: "Termine a task!"
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
            nickname: targetPlayer.nickname
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

    return [state, messages, []];
}

const buildAlreadyPoisonedMessage = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: targetPlayer.taskBeingDone.scanId,
            text: `${targetPlayer.nickname} já está envenenado.`
        },
        receivers: originPlayer.id
    };
}

const buildOutOfPoisonMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "outOfPoison",
            text: "Você não tem veneno."
        },
        receivers: player.id
    };
}

const buildCantPoisonRobot = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "cantPoisonRobot",
            text: `Você não pode envenar ${targetPlayer.nickname}, ele também é um robô.`
        }
    };
}

const onPlayerGotIngredient = (state: GameState, player: Player, task: GameTask): GameReducerReturn => {
    player.currentTasks = player.currentTasks.filter(t => t !== task);
    if (player.currentTasks.length === 0) {
        //player.currentTasks = generateTasks(state, player); TODO: Gerar tasks
    }

    player.ingredients.push(task);
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
        type: "gotIngredient",
        payload: {
            numberOfingredients: player.ingredients.length,
            tasks: player.currentTasks
        },
        receivers: player.id
    });


    return [state, messages, []];
}

const buildUnloadBagMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "unloadBag",
            text: "Você precisa descarregar sua mochila."
        },
        receivers: player.id
    };
}

const onAutoDeliveredIngredient = (state: GameState, player: Player, task: GameTask): GameReducerReturn => {
    player.currentTasks = player.currentTasks.filter(t => t !== task);
    if (player.currentTasks.length === 0) {
        //player.currentTasks = generateTasks(state, player); TODO: Gerar tasks
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
    if (state.tasksDone >= defaultGameRules.tasksPerWizard * state.getWizards().length) {
        messages.push(<SendableMessage>{
            type: "wizardsWon",
            payload: {
                wizards: state.getWizards(),
                robots: state.getRobots()
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
    }

    return [state, messages, []];
}



const buildShouldntScanPlayerMessage = (originPlayer: Player, targetPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "shouldntScanPlayer",
            text: `Você não deve escanear ${targetPlayer.nickname}.`
        }
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
            deadPlayer: targetPlayer
        },
        receivers: originPlayer.id
    })
    
    state.players.filter(p => p.id !== originPlayer.id).forEach(p => {
        messages.push(<SendableMessage>{
            type: "deadBodyWasFound",
            payload: {
                deadPlayer: targetPlayer
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
            imageId: `scannedGhost${targetPlayer.id}`,
            text: `${targetPlayer.nickname} é apenas um  fantasma.`
        },
        receivers: originPlayer.id
    };
}

const onPlayerReceivedPoison = (state: GameState, player: Player): GameReducerReturn => {
    if (player.poisons >= defaultGameRules.maxPoisons) {
        const message = <SendableMessage>{
            type: "error",
            payload: {
                imageId: "maxPoisons",
                text: "Você já tem o máximo de veneno."
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
        type: "poisonReceived",
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

const buildTaskNotInListMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "taskNotInList",
            text: "Essa tarefa não está na sua lista."
        },
        receivers: player.id
    };
}

const buildOnTheCampfireMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "onTheCampfire",
        payload: {
            ingredients: player.ingredients
        },
        receivers: player.id
    };
}

const buildInvalidTagMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "invalidTag",
            text: "Essa tag NFC não é válida."
        },
        receivers: player.id
    }
}

const buildYoureDeadMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "youreDead",
        payload: {
            nickname: player.nickname
        },
        receivers: player.id
    }
}