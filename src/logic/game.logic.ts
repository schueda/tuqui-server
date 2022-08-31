import { GameDatabase } from '../data/game.db';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { UserIdMessage } from '../types/message';
import { SchedulableAction } from '../types/action';
import { StateLoggingService } from './state-logging.logic';
import { ScannedMessage, onScanned, playerDiedMessageType, PlayerDiedMessage } from '../state-management/reducer/game/on_scanned';
import { onDeliverIngredient, DeliverIngredientMessage } from '../state-management/reducer/game/on_deliver_ingredients';
import { SchedulingService } from './scheduling.logic';
import { internalGameCreateActionType, GameCreateMessage } from '../state-management/reducer/matchmaking/on_confirmed_ready';
import { onGameCreate } from '../state-management/reducer/game/on_game_create';
import { onPlayerDied } from '../state-management/reducer/game/on_player_died';

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService, private scheSvc: SchedulingService, private stateLoggingSvc: StateLoggingService) {
        this.registerCreateGame();
        this.registerScannedMessage();
        this.registerDeliverIngredient();
    }

    registerCreateGame() {
        this.connSvc.registerMessageReceiver(internalGameCreateActionType, (message: GameCreateMessage) => {
            logger.debug(`[GameService.registerCreateGame] Received create game message ${JSON.stringify(message)}`);
            this.stateLoggingSvc.clear();

            const [newState, messages, actions] = onGameCreate(this.db.getGame(), message);

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


    registerScannedMessage() {
        this.connSvc.registerMessageReceiver("scanned", (message: ScannedMessage) => {
            logger.debug(`[GameService.registerScannedMessage] Received scanned message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onScanned(this.db.getGame(), message);

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

    registerDeliverIngredient() {
        this.connSvc.registerMessageReceiver("deliverIngredient", (message: DeliverIngredientMessage) => {
            logger.debug(`[GameService.registerDeliverIngredient] Received deliver ingredient message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onDeliverIngredient(this.db.getGame(), message);

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
        this.connSvc.registerMessageReceiver(playerDiedMessageType, (message: PlayerDiedMessage) => {
            logger.debug(`[GameService.registerKillPlayer] Received kill player message ${JSON.stringify(message)}`);

            const [newState, messafes, actions] = onPlayerDied(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...newState
                }
            });

            this.db.updateGame(newState);
            messafes.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);

        });
    }

    processActions(actions: SchedulableAction[]) {
        actions.forEach(a => {
            this.scheSvc.addSchedulableAction(a);
        });
    }
}