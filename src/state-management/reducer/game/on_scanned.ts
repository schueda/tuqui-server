import { SchedulableAction } from '../../../types/action';
import { GameState, GameReducerReturn, Player } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { defaultGameRules, GameRules } from '../../../types/game_rules';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { imageId: string, text: string }}

export const onScanned = (state: GameState, message: ScannedMessage): GameReducerReturn => {
    var originPlayer = state.players.find(p => p.id === message.payload.userId);
    if (!originPlayer) {
        return [state, [], []];
    }

    if (originPlayer.isAlive) {
        if (!state.meetingCalled) {
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
                                    return [
                                        changingPlayerPoisonTime(state, targetPlayer), 
                                        [buildPoisonedPlayerMessage(originPlayer, targetPlayer)],
                                        [buildPoisonedPlayerAction(originPlayer, targetPlayer, defaultGameRules)]
                                    ];
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
                            if (originPlayer.ingredients < defaultGameRules.maxIngredients) {
                                return [
                                    changingPlayerGotIngredient(state, originPlayer),
                                    [buildReceivedIngredientMessage(originPlayer)], //TA ERRADOOOOOOOOOOOOOOOOOOOOOOOO
                                    []];
                            }
                            return [state, [buildUnloadBagMessage(originPlayer)], []];
                        }
                        if (defaultGameRules.taskDeliveryMode === "autoDelivery") {
                            return [
                                changingAutoDeliveredIngredient(state, originPlayer),
                                [buildAutoDeliveredIngredientMessage(originPlayer)], //TA ERRADOOOOOOOOOOOOOOOOOOOOOOOO
                                []
                            ];
                        }
                    }
                    return [state, [/*SHOULDNT SCAN PLAYER MESSAGE*/], []];
                }
                if (targetPlayer.diedRecently) {
                    return [state, [/*SCANNED BODY MESSAGES*/], []];
                }
                return [state, [/*SCANNED GHOST MESSAGE*/], []];
            }
            if (defaultTags.taskTags.includes(message.payload.scanResult)) {
                const taskBeingDone = originPlayer.taskBeingDone;
                if (taskBeingDone) {
                    if (taskBeingDone.scanId === message.payload.scanResult) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            //TODO: FINISH TASK RETURN CENTER REDUCER
                            return [state, [/*FINISH TASK RETURN CENTER MESSAGE*/], []];
                        } 
                        //TODO: FINISH TASK AUTO DELIVERY REDUCER
                        return [state, [/*FINISH TASK AUTO DELIVERY MESSAGE*/], []];
                    }
                    return [state, [/*FINISH TASK WHERE STARTED MESSAGE*/], []];
                }
                const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                if (task) {
                    if (defaultGameRules.taskDeliveryMode === "autoDelivery" || originPlayer.ingredients < defaultGameRules.maxIngredients) {
                        //TODO: ASKED FOR TASK REDUCER
                        return [state, [/*TASK MESSAGE*/], []];
                    }
                    //TODO: TASK NOT IN LIST MESSAGE
                    return [state, [/*TASK NOT IN LIST*/], []];
                }
            }
            if (defaultTags.campfireTag == message.payload.scanResult) {
                return [state, [/*YOU ARE ON THE CAMPFIRE MESSAGE*/], []];
            }
            return [state, [/*UNKNOWN TAG*/], []];
        }
        if (defaultTags.campfireTag == message.payload.scanResult) {
            //TODO: ATTENDED TO MEETING REDUCER
            return [state, [/*ATTENDED TO MEETING MESSAGE*/], []];
        }
        return [state, [/*GO TO CAMPFIRE MESSAGE*/], []];
    }
    //TODO: YOURE DEAD MESSAGE
    return [state, [/*YOURE DEAD MESSAGE*/], []];
}

const buildFinishTaskMessage = (player: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: player.taskBeingDone.scanId,
            text: "Termine a task!"
        },
        receivers: player.id
    };
}

const changingPlayerPoisonTime = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildPoisonedPlayerMessage = (originPlayer: Player, targetPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "poisonedPlayer",
        payload: {
            nickname: targetPlayer.nickname
        },
        receivers: originPlayer.id
    };
}

const buildPoisonedPlayerAction = (originPlayer: Player, targetPlayer: Player, gameRules: GameRules): SchedulableAction => {
    return <SchedulableAction>{
        message: {
            type: "poisonedPlayer",
            payload: {
                player: targetPlayer
            }
        },
        delay: gameRules.timeToDie
    };
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

const buildOutOfPoisonMessage = (originPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "outOfPoison",
            text: "Você não tem veneno."
        },
        receivers: originPlayer.id
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

const changingPlayerGotIngredient = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildReceivedIngredientMessage = (originPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "receivedIngredient",
        payload: {
            tasks: originPlayer.currentTasks,
            ingredients: originPlayer.ingredients
        },
        receivers: originPlayer.id
    };
}

const buildUnloadBagMessage = (originPlayer: Player): ErrorMessage => {
    return <ErrorMessage>{
        type: "error",
        payload: {
            imageId: "unloadBag",
            text: "Você precisa descarregar sua mochila."
        }
    };
}

const changingAutoDeliveredIngredient = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildAutoDeliveredIngredientMessage = (originPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "autoDeliveredIngredient",
        payload: {
            tasks: originPlayer.currentTasks,
        },
        receivers: originPlayer.id
    };
}