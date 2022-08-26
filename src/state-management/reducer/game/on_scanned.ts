import { SchedulableAction } from '../../../types/action';
import { GameState, GameReducerReturn, Player } from '../../../types/state/game.state';
import { UserIdMessage, SendableMessage } from '../../../types/message';
import { defaultTags } from '../../../types/tags';
import { defaultGameRules, GameRules } from '../../../types/game_rules';
import { GameTask } from '../../../types/task';

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };
export type ErrorMessage = SendableMessage & { payload: { imageId: string, text: string }}

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
                };
                if (targetPlayer.isAlive) {
                    if (originPlayer.role === "robot") {
                        if (targetPlayer.role === "wizard") {
                            if (originPlayer.poisons > 0) {
                                if (targetPlayer.poisonTime === undefined) {
                                    return [
                                        changingPlayerPoisonTime(state, targetPlayer), 
/*------------------------------------*/[buildPoisonedPlayerMessage(originPlayer, targetPlayer)], //TA ERRADO---------------------------------------
                                        [buildPoisonedPlayerAction(originPlayer, targetPlayer, defaultGameRules)]
                                    ];
                                };
                                return [state, [buildAlreadyPoisonedMessage(originPlayer, targetPlayer)], []];
                            };
                            return [state, [buildOutOfPoisonMessage(originPlayer)], []];
                        };
                        return [state, [buildCantPoisonRobot(originPlayer, targetPlayer)], []];
                    };
                    const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                    if (task) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            if (originPlayer.ingredients < defaultGameRules.maxIngredients) {
                                return [
                                    changingPlayerGotIngredient(state, originPlayer),
/*--------------------------------*/[buildReceivedIngredientMessage(originPlayer)], //TA ERRADO-----------------------------------------------------
                                    []];
                            };
                            return [state, [buildUnloadBagMessage(originPlayer)], []];
                        };
                        if (defaultGameRules.taskDeliveryMode === "autoDelivery") {
                            return [
                                changingAutoDeliveredIngredient(state, originPlayer),
/*--------------------------------*/[buildAutoDeliveredIngredientMessage(originPlayer)], //TA ERRADO------------------------------------------------
                                []
                            ];
                        };
                    };
                    return [state, [buildShouldntScanPlayerMessage(originPlayer, targetPlayer)], []];
                };
                if (targetPlayer.diedRecently) {
                    return [changingBodyScanned(state, targetPlayer),
/*------------------------*/[buildYouFoundBodyMessage(originPlayer, targetPlayer)].concat(buildBodyWasFoundMessage(state, originPlayer, targetPlayer)), 
                            []];
                };
                return [state, [buildScannedGhostMessage(originPlayer, targetPlayer)], []];
            };
            if (defaultTags.taskTags.includes(message.payload.scanResult)) {
                const taskBeingDone = originPlayer.taskBeingDone;
                if (taskBeingDone) {
                    if (taskBeingDone.scanId === message.payload.scanResult) {
                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                            return [changingPlayerGotIngredient(state, originPlayer),
/*--------------------------------*/[buildReceivedIngredientMessage(originPlayer)],  //TA ERRADO------------------------------------------------------
                                    []];
                        };
                        if (originPlayer.role === "robot") {
                            return [changingPlayerReceivedPoison(state, originPlayer),
/*--------------------------------*/[buildReceivedPoisonMessage(originPlayer)],  //TA ERRADO----------------------------------------------------------
                                    []
                            ];
                        };
                        return [changingAutoDeliveredIngredient(state, originPlayer),
/*----------------------------*/[buildAutoDeliveredIngredientMessage(originPlayer)], //TA ERRADO------------------------------------------------------
                                []];
                    };
                    return [state, [buildFinishTaskMessage(originPlayer)], []];
                };
                const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                if (task) {
                    if (defaultGameRules.taskDeliveryMode === "autoDelivery" || originPlayer.ingredients < defaultGameRules.maxIngredients) {
                        return [changingPlayerDoingTask(state, originPlayer),
/*----------------------------*/[buildTaskMessage(originPlayer, task)], //TA ERRADO-------------------------------------------------------------------
                                []];
                    };
                    return [state, [buildTaskNotInListMessage(originPlayer)], []];
                };
            };
            if (defaultTags.campfireTag == message.payload.scanResult) {
                return [state, [buildOnTheCampfireMessage(originPlayer)], []];
            };
            return [state, [buildInvalidTagMessage(originPlayer)], []];
        };
    } else {
        return [state, [buildYoureDeadMessage(originPlayer)], []];
    };
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

const changingPlayerGotIngredient = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildReceivedIngredientMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "receivedIngredient",
        payload: {
            tasks: player.currentTasks,
            ingredients: player.ingredients
        },
        receivers: player.id
    };
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

const changingAutoDeliveredIngredient = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildAutoDeliveredIngredientMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "autoDeliveredIngredient",
        payload: {
            tasks: player.currentTasks,
        },
        receivers: player.id
    };
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

const changingBodyScanned = (state: GameState, targetPlayer: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildYouFoundBodyMessage = (originPlayer: Player, targetPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "youFoundBody",
        receivers: originPlayer.id
    };
}

const buildBodyWasFoundMessage = (state: GameState, originPlayer: Player, targetPlayer: Player): SendableMessage[] => {
    return [<SendableMessage>{
        type: "bodyWasFound",
        payload: {
            nickname: targetPlayer.nickname,
            tasks: [originPlayer.currentTasks] //TODO: MANDAR A LISTA DE TASKS PRA CADA PESSOA
        },
        receivers: "all" //TODO: VER COMO MANDAR PARA TODOS
    }];
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

const changingPlayerReceivedPoison = (state: GameState, player: Player): GameState => {
    //TODO: ATUALIZAR O ESTADO
    return <GameState>{
        ...state,
    };
}

const buildReceivedPoisonMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "receivedPoison",
        payload: {
            tasks: player.currentTasks,
            ingredients: player.ingredients
        },
        receivers: player.id
    };
}

const changingPlayerDoingTask = (state: GameState, player: Player): GameState => {
    return <GameState>{
        ...state,
    };
}

const buildTaskMessage = (player: Player, task: GameTask): SendableMessage => {
    return <SendableMessage>{
        type: "task",
        payload: {
            task: task
        },
        receivers: player.id
    }
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