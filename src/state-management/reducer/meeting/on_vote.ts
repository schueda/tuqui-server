import { GameState, GameReducerReturn, Player, getAlivePlayers, getRobots, getWizards } from '../../../types/state/game.state';
import { VoteMessage } from '../../../logic/meeting.logic';
import { SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';

export const onVote = (state: GameState, message: VoteMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userId);
    if (!player) {
        logger.debug("[onVote] Player not found");
        return [state, [], []];
    }

    var messages: SendableMessage[] = [];

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

    if (message.payload.votedId === undefined) {
        newState.skipVotes.push(player.id);
    };

    logger.debug("[onVote] New state.players: " + JSON.stringify(newState.players));
    if (newState.players.filter(p => p.votedPlayer).length === getAlivePlayers(newState).length) {
        messages.push(buildVotingResultMessage(newState));
        const maxVotes = newState.players.reduce((max, p) => p.receivedVotes.length > max ? p.receivedVotes.length : max, 0);

        if (newState.skipVotes.length >= maxVotes) {
            if (newState.skipVotes.length === maxVotes) {
                messages.push(buildVotingTiedMessage(newState));
            } else {
                messages.push(buildVotingSkippedMessage(newState));
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

                messages.push(buildPlayerKickedMessage(newState, playersWithMaxVotes[0]));
                messages.push(buildYouWereKickedMessage(playersWithMaxVotes[0]));

                if (getAlivePlayers(newState).filter(p => p.role === "robot").length === 0) {
                    messages.push(buildWizardsWonMessage(newState));
                }
                if (getAlivePlayers(newState).filter(p => p.role === "wizard").length === 0) {
                    messages.push(buildRobotsWonMessage(newState));
                }
            } else {
                messages.push(buildVotingTiedMessage(newState));
            }

            newState.players = newState.players.map(p => {
                p.votedPlayer = null
                p.receivedVotes = [];
                p.attendedToMeeting = false;

                return p;
            });
            newState.mode = "gameRunning";
        }
    } else {
        messages.push(buildUpdateVotingMessage(player));
    };

    return [newState, messages, []];
}

const buildVotingResultMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "votingResult",
        payload: {
            votes: state.players.map(p => {
                return {
                    votedPlayer: p.votedPlayer
                }
            })
        },
        receivers: "all"
    }
}

const buildVotingSkippedMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "votingSkipped",
        receivers: "all"
    };
}

const buildVotingTiedMessage = (state: GameState): SendableMessage => {
    return <SendableMessage>{
        type: "votingTied",
        receivers: "all"
    }
}

const buildPlayerKickedMessage = (state: GameState, kickedPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "playerKicked",
        payload: {
            player: {
                scanId: kickedPlayer.id,
                nickname: kickedPlayer.nickname,
                alive: kickedPlayer.isAlive,
                attendedToMeeting: kickedPlayer.attendedToMeeting
            }
        },
        receivers: state.players.filter(p => p.id !== kickedPlayer.id).map(p => p.id)
    };
}

const buildYouWereKickedMessage = (kickedPlayer: Player): SendableMessage => {
    return <SendableMessage>{
        type: "youWereKicked",
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