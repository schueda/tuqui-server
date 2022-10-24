import { GameState, GameReducerReturn, Player, getAlivePlayers, getRobots, getWizards, getPlayerById, getVotes, ReducedPlayer } from '../../../types/state/game.state';
import { VoteMessage } from '../../../logic/meeting.logic';
import { SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';

type Role = "wizard" | "robot" | null;

export const onVote = (state: GameState, message: VoteMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        return [state, [], []];
    }

    var newState = <GameState>{
        ...state,
        players: state.players.map(p => {
            if (p.id === player.id) {
                return {
                    ...p,
                    votedPlayer: message.payload.votedId
                };
            };

            if (p.id === message.payload.votedId) {
                p.receivedVotes.push(message.payload.votedId);
            };

            return p;
        })
    };

    if (message.payload.votedId === "skip") {
        newState.skipVotes.push(player.id);
    };

    logger.debug("[onVote] New state.players: " + JSON.stringify(newState.players));
    if (newState.players.filter(p => p.votedPlayer).length === getAlivePlayers(newState).length) {
        const votes = getVotes(newState);

        const maxVotes = newState.players.reduce((max, p) => p.receivedVotes.length > max ? p.receivedVotes.length : max, 0);

        if (newState.skipVotes.length >= maxVotes) {
            if (newState.skipVotes.length === maxVotes) {
                const message = buildVotingTiedMessage(newState, votes);
                resetState(newState);
                return [newState, [message], []];
            } else {
                const message = buildVotingSkippedMessage(newState, votes);
                resetState(newState);
                return [newState, [message], []];
            }
        } else {
            const playersWithMaxVotes = newState.players.filter(p => p.receivedVotes.length === maxVotes);

            if (playersWithMaxVotes.length === 1) {
                newState.players = newState.players.map(p => {
                    if (p.id === playersWithMaxVotes[0].id) {
                        p.isAlive = false;
                    }
                    return p;
                });

                var winnerTeam: Role = null;
                var winners: ReducedPlayer[] = [];
                if (getAlivePlayers(newState).filter(p => p.role === "robot").length === 0) {
                    winnerTeam = "wizard";
                    winners = getWizards(newState).map(p => {
                        return <ReducedPlayer>{
                            scanId: p.id,
                            nickname: p.nickname,
                            alive: p.isAlive,
                            attendedToMeeting: p.attendedToMeeting
                        }
                    });
                }
                if (getAlivePlayers(newState).filter(p => p.role === "wizard").length === 0) {
                    winnerTeam = "robot";
                    winners = getRobots(newState).map(p => {
                        return <ReducedPlayer>{
                            scanId: p.id,
                            nickname: p.nickname,
                            alive: p.isAlive,
                            attendedToMeeting: p.attendedToMeeting
                        }
                    });
                }

                var messages: SendableMessage[] = [];

                messages.push(buildPlayerKickedMessage(newState, playersWithMaxVotes[0], votes, winnerTeam, winners));
                messages.push(buildYouWereKickedMessage(playersWithMaxVotes[0], votes, winnerTeam, winners));

                resetState(newState);

                return [newState, messages, []];
            } else {
                const message = buildVotingTiedMessage(newState, votes);
                resetState(newState);
                return [newState, [message], []];
            }
        }
    } else {
        messages.push(buildUpdateVotingMessage(player));
    };

    return [newState, messages, []];
}


const buildVotingSkippedMessage = (state: GameState, votes: ReducedPlayer[]): SendableMessage => {
    return <SendableMessage>{
        type: "votingResult",
        payload: {
            votes,
            result: "skipped"
        },
        receivers: "all"
    }
}

const buildVotingTiedMessage = (state: GameState, votes: ReducedPlayer[]): SendableMessage => {
    return <SendableMessage>{
        type: "votingResult",
        payload: {
            votes,
            result: "tied"
        },
        receivers: "all"
    }
}

const buildPlayerKickedMessage = (state: GameState, kickedPlayer: Player, votes: ReducedPlayer[], winnerTeam: Role, winners: ReducedPlayer[]): SendableMessage => {
    return <SendableMessage>{
        type: "votingResult",
        payload: {
            votes,
            result: "playerKicked",
            player: <ReducedPlayer>{
                scanId: kickedPlayer.id,
                nickname: kickedPlayer.nickname,
                alive: kickedPlayer.isAlive,
                attendedToMeeting: kickedPlayer.attendedToMeeting
            },
            winnerTeam,
            winners
        },
        receivers: state.players.filter(p => p.id !== kickedPlayer.id).map(p => p.id)
    };
}

const buildYouWereKickedMessage = (kickedPlayer: Player, votes: ReducedPlayer[], winnerTeam: Role, winners: ReducedPlayer[]): SendableMessage => {
    return <SendableMessage>{
        type: "votingResult",
        payload: {
            votes,
            result: "youWereKicked",
            winnerTeam,
            winners
        },
        receivers: kickedPlayer.id
    };

}

const buildUpdateVotingMessage = (player: Player): SendableMessage => {
    return <SendableMessage>{
        type: "updateVoting",
        payload: {
            userId: player.id
        },
        receivers: "all"
    }
}

const buildWizardsWonMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "wizardsWon",
        payload: {
            robots: getRobots(state).map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.isAlive,
                    attendedToMeeting: p.attendedToMeeting
                }
            }),
            wizards: getWizards(state).map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.isAlive,
                    attendedToMeeting: p.attendedToMeeting
                }
            })
        },
        receivers: "all"
    };
}

const buildRobotsWonMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "robotsWon",
        payload: {
            robots: getRobots(state).map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.isAlive,
                    attendedToMeeting: p.attendedToMeeting
                }
            }),
            wizards: getWizards(state).map(p => {
                return {
                    scanId: p.id,
                    nickname: p.nickname,
                    alive: p.isAlive,
                    attendedToMeeting: p.attendedToMeeting
                }
            })
        },
        receivers: "all"
    };
}

const resetState = (state: GameState) {
    state.players = state.players.map(p => {
        p.votedPlayer = null
        p.receivedVotes = [];
        p.attendedToMeeting = false;

        return p;
    });
    state.mode = "gameRunning";
    state.skipVotes = [];
}