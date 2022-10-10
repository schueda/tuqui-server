import { GameState, GameReducerReturn, Player, getRobots, getWizards } from '../../../types/state/game.state';
import { GameCreateMessage } from '../matchmaking/on_confirmed_ready';
import { defaultGameRules } from '../../../types/game_rules';
import { SendableMessage } from '../../../types/message';
import { GameTaskGenerator } from '../../../types/game_task_generator';


export const onGameCreate = (state: GameState, message: GameCreateMessage, taskGenerator: GameTaskGenerator): GameReducerReturn => {
    const gameRules = defaultGameRules;

    var players = <Player[]>message.payload.users.map(u => <Player>{
        id: u.userId,
        nickname: u.nickname,
        role: "wizard",
        isAlive: true,
        diedRecently: false,
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

    var messages = players.map(p => <SendableMessage>{
        type: "gameStarted",
        payload: {
            role: p.role,
            tasks: p.currentTasks,
            robots: getRobots(state).filter(r => r.id !== p.id).map(r => {
                return {
                    scanId: r.id,
                    nickname: r.nickname,
                    alive: r.isAlive,
                    attendedToMeeting: r.attendedToMeeting
                }
            }),
            totalWizards: getWizards(state).length,
            totalTasks: state.totalTasks
        },
        receivers: p.id,
    })

    return [state, messages, []];
}