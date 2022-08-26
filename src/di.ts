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

    // Logic

    const connectionSvc = new ConnectionService(connectionDb);
    di.connectionSvc = connectionSvc;

    const gameStateLoggingSvc = new StateLoggingService('game', eventBusSvc);
    di.gameStateLoggingSvc = gameStateLoggingSvc;

    const gameSvc = new GameService(gameDb, connectionSvc, gameStateLoggingSvc);
    di.gameSvc = gameSvc;

    const matchmakingStateLoggingSvc = new StateLoggingService('matchmaking', eventBusSvc);
    di.matchmakingStateLoggingSvc = matchmakingStateLoggingSvc;

    const matchmakingSvc = new MatchmakingService(matchmakingDb, connectionSvc, gameSvc, matchmakingStateLoggingSvc);
    di.matchmakingSvc = matchmakingSvc;

    // App
    const app = new App(connectionSvc);
    di.app = app;

    return app
})