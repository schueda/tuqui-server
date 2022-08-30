import { MatchmakingUser } from '../types/state/matchmaking.state';
import { GameDatabase } from '../data/game.db';
import { GameState, Player } from '../types/state/game.state';
import { defaultGameRules } from '../types/game_rules';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { UserIdMessage, SendableMessage } from '../types/message';
import { SchedulableAction } from '../types/action';
import { StateLoggingService } from './state-logging.logic';
import { ScannedMessage, onScanned, playerDiedMessageType, playerDiedMessage } from '../state-management/reducer/game/on_scanned';
import { onDeliverIngredients } from '../state-management/reducer/game/on_deliver_ingredients';
import { SchedulingService } from './scheduling.logic';
import { internalGameCreateActionType, GameCreateMessage } from '../state-management/reducer/matchmaking/on_confirmed_ready';
import { onGameCreate } from '../state-management/reducer/game/on_game_create';
import { onPlayerDied } from '../state-management/reducer/game/on_player_died';

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService, private scheSvc: SchedulingService, private stateLoggingSvc: StateLoggingService) {
        this.registerCreateGame();
        this.registerScannedMessage();
        this.registerDeliverIngredients();
    }

    registerCreateGame() {
        this.connSvc.registerMessageReceiver(internalGameCreateActionType, (message: GameCreateMessage) => {
            logger.debug(`[GameService.registerCreateGame] Received create game message ${JSON.stringify(message)}`);
            this.stateLoggingSvc.clear();

            const [newState, messages, actions] = onGameCreate(this.db.getGame(), message);

            this.stateLoggingSvc.log({
                message: {
                    type: "gameCreated"
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
            })

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerDeliverIngredients() {
        this.connSvc.registerMessageReceiver("deliverIngredients", (message: UserIdMessage) => {
            logger.debug(`[GameService.registerDeliverIngredients] Received deliver ingredients message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onDeliverIngredients(this.db.getGame(), message);

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    registerKillPlayer() {
        this.connSvc.registerMessageReceiver(playerDiedMessageType, (message: playerDiedMessage) => {
            logger.debug(`[GameService.registerKillPlayer] Received kill player message ${JSON.stringify(message)}`);

            const [newState, messafes, actions] = onPlayerDied(this.db.getGame(), message);

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