import { GameState, GameReducerReturn, Player } from '../../../types/state/game.state';
import { GameCreateMessage } from '../matchmaking/on_confirmed_ready';
import { defaultGameRules } from '../../../types/game_rules';
import { SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';
import { GameTaskGenerator } from '../../../types/game_task_generator';


export const onGameCreate = (state: GameState, message: GameCreateMessage, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    const gameRules = defaultGameRules;

    var players = <Player[]>message.payload.users.map(u => <Player>{
        id: u.id,
        nickname: u.nickname,
        role: "wizard",
        isAlive: true,
        diedRecently: false,
        ingredients: [],
        poisons: 0,
        currentTasks: taskGenerator.generateTasks(),
        attendedToMeeting: false,
        receivedVotes: []
    });

    // Generate an array from 0 to player len
    var playerIds = Array.from(Array(players.length).keys());
    playerIds.sort(() => Math.random() - 0.5);

    // For each robot in game rules
    for (var i = 0; i < gameRules.numberOfRobots; i++) {
        players[playerIds[i]].role = "robot";
    };

    state = <GameState>{
        players,
        tasksDone: 0,
        totalTasks: gameRules.tasksPerWizard * players.filter(p => p.role === "wizard").length,

        skipVotes: [],

        mode: "gameRunning"
    };

    const messages: SendableMessage[] = [];
    state.players.forEach(player => {
        messages.push({
            type: "gameStarted",
            payload: {
                role: player.role,
                tasks: player.currentTasks,
                robots: state.players.filter(p => p.role === "robot" && p.id !== player.id && player.role === "robot")
            },
            receivers: player.id
        });
    });

    return [state, messages, []];
}