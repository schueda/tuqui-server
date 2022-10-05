import { GameDatabase } from '../data/game.db';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { StateLoggingService } from './state-logging.logic';
import { ScannedMessage, onScanned, playerDiedMessageType, PlayerDiedMessage } from '../state-management/reducer/game/on_scanned';
import { onDeliverTask, DeliverTaskMessage as DeliverTaskMessage } from '../state-management/reducer/game/on_deliver_task';
import { SchedulingService } from './scheduling.logic';
import { internalGameCreateActionType, GameCreateMessage } from '../state-management/reducer/matchmaking/on_confirmed_ready';
import { onGameCreate } from '../state-management/reducer/game/on_game_create';
import { onPlayerDied } from '../state-management/reducer/game/on_player_died';
import { GameTaskGenerator } from '../types/game_task_generator';
import { NewSchedulableAction } from '../types/action';
import { UserIdMessage, SendableMessage } from '../types/message';
import { getRobots } from '../types/state/game.state';
import { onExitTask } from '../state-management/reducer/game/on_exit_task';

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService, private scheSvc: SchedulingService, private stateLoggingSvc: StateLoggingService) {
        this.registerCreateGame();
        this.registerAskForRole();
        this.registerScannedMessage();
        this.registerExitTask();
        this.registerDeliverTask();
        this.registerKillPlayer();
    }

    taskGenerator = new GameTaskGenerator();

    registerCreateGame() {
        this.connSvc.registerMessageReceiver(internalGameCreateActionType, ["service"], (message: GameCreateMessage) => {
            logger.debug(`[GameService.registerCreateGame] Received create game message ${JSON.stringify(message)}`);
            this.stateLoggingSvc.clear();

            const [newState, messages, actions] = onGameCreate(this.db.getGame(), message, this.taskGenerator);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerAskForRole() {
        this.connSvc.registerMessageReceiver("askForRole", ["user"], (message: UserIdMessage) => {
            logger.debug(`[GameService.registerAskForRole] Received ask for role message ${JSON.stringify(message)}`);
            const state = this.db.getGame();
            const player = state.players.find(p => p.id === message.payload.userId);
            if (!player) {
                return;
            }

            this.connSvc.emit(<SendableMessage>{
                type: "role",
                payload: {
                    role: player.role,
                    robots: getRobots(state).filter(p => p.id != player.id).map(p => {
                        return {
                            id: p.id,
                            name: p.nickname
                        }
                    })
                },
                receivers: message.payload.userId
            });

        });
    }

    registerScannedMessage() {
        this.connSvc.registerMessageReceiver("scanned", ["user"], (message: ScannedMessage) => {
            logger.debug(`[GameService.registerScannedMessage] Received scanned message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onScanned(this.db.getGame(), message, this.taskGenerator);

            if (newState === undefined) {
                return;
            }

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerExitTask() {
        this.connSvc.registerMessageReceiver("exitTask", ["user"], (message: UserIdMessage) => {
            logger.debug(`[GameService.regisrerExitTask] Received exit task message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onExitTask(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);

        });
    }

    registerDeliverTask() {
        this.connSvc.registerMessageReceiver("deliverTask", ["user"], (message: DeliverTaskMessage) => {
            logger.debug(`[GameService.registerDeliverTask] Received deliver task message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onDeliverTask(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerKillPlayer() {
        this.connSvc.registerMessageReceiver(playerDiedMessageType, ["service"], (message: PlayerDiedMessage) => {
            logger.debug(`[GameService.registerKillPlayer] Received kill player message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onPlayerDied(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);

        });
    }

    processActions(actions: NewSchedulableAction[]) {
        logger.debug(`[GameService.processActions] Processing actions ${JSON.stringify(actions)}`);
        actions.forEach(a => {
            this.scheSvc.addSchedulableAction(a);
        });
    }
}