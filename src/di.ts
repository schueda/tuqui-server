import { App } from './app';
import { ConnectionDatabase } from './data/connection.db';
import { ConnectionService } from './logic/connection.logic';
import { MatchmakingService } from './logic/matchmaking.logic';
import { MatchmakingDatabase } from './data/matchmaking.db';
import { GameService } from './logic/game.logic';
import { GameDatabase } from './data/game.db';
import { StateLoggingService } from './logic/state-logging.logic';
import { EventBusService } from './logic/event-bus.logic';
import { DI } from './types/di';
import { MeetingService } from './logic/meeting.logic';
import { SchedulingDatabase } from './data/scheduling.db';
import { SchedulingService } from './logic/scheduling.logic';

export const di: DI = {};

export const buildApp = (() => {

    // EventBus
    const eventBusSvc = new EventBusService();
    di.eventBusSvc = eventBusSvc;


    // DB
    const connectionDb = new ConnectionDatabase();
    di.connectionDb = connectionDb;

    const matchmakingDb = new MatchmakingDatabase();
    di.matchmakingDb = matchmakingDb;

    const gameDb = new GameDatabase();
    di.gameDb = gameDb;

    const schedulingDb = new SchedulingDatabase();
    di.schedulingDb = schedulingDb;


    // Logging
    const matchmakingStateLoggingSvc = new StateLoggingService('matchmaking', eventBusSvc);
    di.matchmakingStateLoggingSvc = matchmakingStateLoggingSvc;

    const gameStateLoggingSvc = new StateLoggingService('game', eventBusSvc);
    di.gameStateLoggingSvc = gameStateLoggingSvc;

    const meetingStateLoggingSvc = new StateLoggingService('game-meeting', eventBusSvc);
    di.meetingLoggingSvc = meetingStateLoggingSvc;

    // Logic
    const connectionSvc = new ConnectionService(connectionDb);
    di.connectionSvc = connectionSvc;

    const schedulingSvc = new SchedulingService(schedulingDb);
    di.schedulingSvc = schedulingSvc;

    const matchmakingSvc = new MatchmakingService(matchmakingDb, connectionSvc, schedulingSvc, matchmakingStateLoggingSvc);
    di.matchmakingSvc = matchmakingSvc;

    const gameSvc = new GameService(gameDb, connectionSvc, schedulingSvc, gameStateLoggingSvc);
    di.gameSvc = gameSvc;

    const meetingSvc = new MeetingService(gameDb, connectionSvc, schedulingSvc, meetingStateLoggingSvc);
    di.meetingSvc = meetingSvc;


    // App
    const app = new App(connectionSvc);
    di.app = app;

    return app
})