import { MatchmakingUser } from '../types/state/matchmaking.state';
import { GameDatabase } from '../data/game.db';
import { GameState, Player } from '../types/state/game.state';
import { defaultGameRules } from '../types/game_rules';
import { ConnectionService } from './connection.logic';
import { logger } from '../logger';
import { UserIdMessage } from '../types/message';
import { SchedulableAction } from '../types/action';
import { StateLoggingService } from './state-logging.logic';
import { ScannedMessage, onScanned, internalStartMeetingActionType } from '../state-management/reducer/game/on_scanned';
import { onDeliverIngredients } from '../state-management/reducer/game/on_deliver_ingredients';
import { onCallMeeting } from '../state-management/reducer/game/on_call_meeting';
import { MeetingService } from './meeting.logic';

export class GameService {

    constructor(private db: GameDatabase, private connSvc: ConnectionService, private meetingSvc: MeetingService, private stateLoggingSvc: StateLoggingService) {
        this.registerScannedMessage();
        this.registerDeliverIngredients();
        this.registerCallMeeting();
    }

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

        const state = <GameState>{
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
                ...state
            }
        })

        this.db.updateGame(state);
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

    registerCallMeeting() {
        this.connSvc.registerMessageReceiver("callMeeting", (message: UserIdMessage) => {
            logger.debug(`[GameService.registerCallMeeting] Received call meeting message ${JSON.stringify(message)}`);

            const [newState, messages, actions] = onCallMeeting(this.db.getGame(), message);

            this.db.updateGame(newState);
            messages.forEach(m => this.connSvc.emit(m));
            this.processActions(actions);
        });
    }

    processActions(actions: SchedulableAction[]) {
        actions.forEach(a => {
            if (a.message.type === internalStartMeetingActionType) {
                this.meetingSvc.startMeeting();
            }
        });
    }
}