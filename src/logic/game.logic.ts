import { MatchmakingState, MatchmakingUser } from '../types/state/matchmaking.state';
import { GameDatabase } from '../data/game.db';
import { GameState, Player } from '../types/state/game.state';
import { defaultGameRules, GameRules } from '../types/game_rules';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { defaultTags } from '../types/tags';
import { SendableMessage, UserIdMessage } from '../types/message';
import { SchedulableAction } from '../types/action';
import e = require('express');

export type ScannedMessage = UserIdMessage & { payload: { scanResult: string } };

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService) { }

    state: GameState;

    createGame(users: MatchmakingUser[]) {
        const gameRules = defaultGameRules;

        var players = <Player[]>users.map(u => <Player>{
            id: u.id,
            nickname: u.nickname,
            role: "wizard",
            isAlive: true,
            diedRecently: false,
            ingredients: 0,
            poisons: 0,

            attendedToMeeting: false,
        });

        // Generate an array from 0 to player len
        var playerIds = Array.from(Array(players.length).keys());
        playerIds.sort(() => Math.random() - 0.5);

        // For each robot in game rules
        for (var i = 0; i < gameRules.numberOfRobots; i++) {
            players[playerIds[i]].role = "robot";
        }

        this.state = <GameState>{
            players,
            tasksDone: 0,
            totalTasks: gameRules.tasksPerWizard * players.filter(p => p.role === "wizard").length,

            meetingCalled: false,
            meetingHappening: false
        }

        this.db.updateGame(this.state);
    }

    registerScannedMessage() {
        this.connSvc.registerMessageReceiver("scanned", (message: ScannedMessage) => {
            logger.debug(`[GameService.registerScannedMessage] Received scanned message ${JSON.stringify(message)}`);

            var messages: SendableMessage[];
            var actions: SchedulableAction[];

            var originPlayer = this.state.players.find(p => p.id === message.payload.userId);

            if (originPlayer.isAlive) {
                if (!this.db.getGame().meetingCalled) {
                    if (defaultTags.playerTags.includes(message.payload.scanResult)) {
                        var targetPlayer = this.state.players.find(p => p.id === message.payload.scanResult);
                        
                        if (originPlayer.taskBeingDone) {
                            // TODO: FINISH YOUR TASK FIRST MESSAGE
                        } else {
                            if (targetPlayer.isAlive) {
                                if (originPlayer.role === "robot") {
                                    if (targetPlayer.role === "wizard") {
                                        if (originPlayer.poisons > 0) {
                                            if (targetPlayer.poisonTime === undefined) {
                                                //TODO: POISON REDUCER
                                            } else {
                                                //TODO: ALREADY POISONED MESSAGE
                                            }
                                        }
                                        else {
                                            //TODO: OUT OF POISON
                                        }
                                    } else {
                                        //TODO: CANT POISON ROBOT MESSAGE
                                    }
                                } else {
                                    const task = originPlayer.currentTasks.find(t => t.scanId === message.payload.scanResult);
                                    if (task) {
                                        if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                                            if (originPlayer.ingredients < defaultGameRules.maxIngredients) {
                                                //TODO: RETURN CENTER REDUCER
                                            } else {
                                                //TODO: UNLOAD BAG MESSAGE
                                            }
                                        } else {
                                            //TODO: AUTO-DELIVER REDUCER
                                        }
                                    } else {
                                        //TODO: SHOULDNT SCAN PLAYER MESSAGE
                                    }
                                }
                            } else {
                                if (targetPlayer.diedRecently) {
                                    //TODO: SCANNED BODY REDUCER
                                } else {
                                    //TODO: SCANNED GHOST MESSAGE
                                }
                            }
                        }
                    } else if (defaultTags.taskTags.includes(message.payload.scanResult)) {
                        const task = originPlayer.taskBeingDone;
                        if (task) {
                            if (task.scanId === message.payload.scanResult) {
                                if (defaultGameRules.taskDeliveryMode === "returnCenter") {
                                    //TODO: FINISH TASK RETURN CENTER REDUCER
                                } else {
                                    //TODO: FINISH TASK AUTO DELIVERY REDUCER
                                }
                            } else {
                                //TODO: FINISH TASK WHERE STARTED MESSAGE
                            }
                        } else {
                            if ()
                        }
                    }
                } else {
                    
                }
            } else {
                //TODO: YOURE DEAD 
            }


            this.db.updateGame(this.state);

            messages.forEach(m => this.connSvc.emit(m));

            this.processActions(actions);
        })
    }

    processActions(actions: SchedulableAction[]) {
        actions.forEach(a => {
        })
    }
}