import { GameState, GameReducerReturn, Player, getAlivePlayers, getRobots, getWizards, getPlayerById, getVotes, ReducedPlayer } from '../../../types/state/game.state';
import { VoteMessage } from '../../../logic/meeting.logic';
import { SendableMessage } from '../../../types/message';
import { logger } from '../../../logger';
import { SchedulingService } from '../../../logic/scheduling.logic';

type Role = "wizard" | "robot" | null;

export const onVote = (state: GameState, message: VoteMessage, scheSvc: SchedulingService): GameReducerReturn => {
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

    if (newState.players.filter(p => p.votedPlayer).length === getAlivePlayers(newState).length) {
        scheSvc.resumeAllActions();

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
                        p.alive = false;
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
                            alive: p.alive,
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
                            alive: p.alive,
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
    }

    return [newState, [buildUpdateVotingMessage(player)], []];
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
            playerKicked: <ReducedPlayer>{
                scanId: kickedPlayer.id,
                nickname: kickedPlayer.nickname,
                alive: kickedPlayer.alive,
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

const resetState = (state: GameState) => {
    state.players = state.players.map(p => {
        p.votedPlayer = null
        p.receivedVotes = [];
        p.attendedToMeeting = false;

        return p;
    });
    state.mode = "gameRunning";
    state.skipVotes = [];
}