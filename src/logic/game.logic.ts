import { MatchmakingState, MatchmakingUser } from '../types/state/matchmaking.state';
import { GameDatabase } from '../data/game.db';
import { GameState, Player } from '../types/state/game.state';
import { defaultGameRules } from '../types/game_rules';

export class GameService {

    constructor(private db: GameDatabase) { }

    state: GameState;

    createGame(users: MatchmakingUser[]) {
        const gameRules = defaultGameRules;

        var players = <Player[]>users.map(u => <Player>{
            id: u.id,
            nickname: u.nickname,
            role: "wizard",
            isAlive: true,
            diedRecently: false,
            ingredients: 0,
            poisons: 0,

            attendedMeeting: false,
        });

        // Generate an array from 0 to player len
        var playerIds = Array.from(Array(players.length).keys());
        playerIds.sort(() => Math.random() - 0.5);

        // For each robot in game rules
        for (var i = 0; i < gameRules.numberOfRobots; i++) {
            players[playerIds[i]].role = "robot";
        }

        this.state = <GameState>{

        }
        // TODO: Create the Game based on the MMState
        // const game = new GameSta(matchmakingState);

        // TODO: Save the created game in the DB
    }
}