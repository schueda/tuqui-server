import { App } from './app';
import { ConnectionDatabase } from './data/connection.db';
import { ConnectionService } from './logic/connection.logic';
import { MatchmakingService } from './logic/matchmaking.logic';
import { MatchmakingDatabase } from './data/matchmaking.db';

const di: Record<string, unknown> = {};

export const buildApp = (() => {
    // DB
    const connectionDb = new ConnectionDatabase();
    di.connectionDb = connectionDb;

    const matchmakingDb = new MatchmakingDatabase();
    di.matchmakingDb = matchmakingDb;

    // Logic
    const connectionSvc = new ConnectionService(connectionDb);
    di.connectionSvc = connectionSvc;

    const matchmakingSvc = new MatchmakingService(matchmakingDb, connectionSvc);
    di.matchmakingSvc = matchmakingSvc;

    // App
    const app = new App(connectionSvc);
    di.app = app;

    return app
})