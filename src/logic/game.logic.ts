import { MatchmakingState, MatchmakingUser } from '../types/state/matchmaking.state';
import { GameDatabase } from '../data/game.db';
import { GameState, Player } from '../types/state/game.state';
import { defaultGameRules, GameRules } from '../types/game_rules';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { defaultTags } from '../types/tags';
import { SendableMessage, UserIdMessage } from '../types/message';
import { SchedulableAction } from '../types/action';
import { ScannedMessage, onScanned } from '../state-management/reducer/game/on_scanned';
import { StateLoggingService } from './state-logging.logic';

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService, private stateLoggingSvc: StateLoggingService) {
        this.registerScannedMessage();
        this.registerDeliverIngredient();
    }

    state: GameState;

    createGame(users: MatchmakingUser[]) {
        this.stateLoggingSvc.clear();

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

        this.stateLoggingSvc.log({
            message: {
                type: "gameCreated"
            },
            newState: {
                ...this.state
            }
        })

        this.db.updateGame(this.state);
    }

    registerScannedMessage() {
        this.connSvc.registerMessageReceiver("scanned", (message: ScannedMessage) => {
            logger.debug(`[GameService.registerScannedMessage] Received scanned message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onScanned(this.state, message);

            this.stateLoggingSvc.log({
                message: {
                    ...message
                },
                newState: {
                    ...this.state
                }
            })

            this.db.updateGame(newState);

            messages.forEach(m => this.connSvc.emit(m));

            this.processActions(actions);
        });
    }

    registerDeliverIngredient() {
        this.connSvc.registerMessageReceiver("deliverIngredient", (message: UserIdMessage) => {
            logger.debug(`[GameService.registerDeliverIngredient] Received deliver ingredient message ${JSON.stringify(message)}`);
            // const [newState, messages, actions] 
        });
    }

    processActions(actions: SchedulableAction[]) {
        actions.forEach(a => {
        });
    }
}