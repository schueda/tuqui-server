import { EventBusService } from '../logic/event-bus.logic';
import { ConnectionDatabase } from '../data/connection.db';
import { MatchmakingDatabase } from '../data/matchmaking.db';
import { GameDatabase } from '../data/game.db';
import { ConnectionService } from '../logic/connection.logic';
import { StateLoggingService } from '../logic/state-logging.logic';
import { GameService } from '../logic/game.logic';
import { MatchmakingService } from '../logic/matchmaking.logic';
import { App } from '../app';
import { MeetingService } from '../logic/meeting.logic';
export type DI = {
    eventBusSvc?: EventBusService;
    connectionDb?: ConnectionDatabase;
    matchmakingDb?: MatchmakingDatabase;
    gameDb?: GameDatabase;
    connectionSvc?: ConnectionService;
    gameStateLoggingSvc?: StateLoggingService;
    gameSvc?: GameService;
    matchmakingStateLoggingSvc?: StateLoggingService;
    matchmakingSvc?: MatchmakingService;
    meetingSvc?: MeetingService;
    app?: App;
}