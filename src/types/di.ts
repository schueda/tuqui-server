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
import { SchedulingDatabase } from '../data/scheduling.db';
import { SchedulingService } from '../logic/scheduling.logic';

export type DI = {
    eventBusSvc?: EventBusService;

    connectionDb?: ConnectionDatabase;
    schedulingDb?: SchedulingDatabase;
    matchmakingDb?: MatchmakingDatabase;
    gameDb?: GameDatabase;

    matchmakingStateLoggingSvc?: StateLoggingService;
    gameStateLoggingSvc?: StateLoggingService;

    connectionSvc?: ConnectionService;
    schedulingSvc?: SchedulingService;
    matchmakingSvc?: MatchmakingService;
    gameSvc?: GameService;
    meetingSvc?: MeetingService;

    app?: App;
}