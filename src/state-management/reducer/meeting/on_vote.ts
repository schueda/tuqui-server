import { GameState, GameReducerReturn } from '../../../types/state/game.state';
import { VoteMessage } from '../../../logic/meeting.logic';
import { SendableMessage } from '../../../types/message';

export const onVote = (state: GameState, message: VoteMessage): GameReducerReturn => {
    const player = state.players.find(p => p.id === message.payload.userid);
    if (!player) {
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
                return {
                    ...p,
                    votes: p.votes.push(player.id)
                };
            };
        })
    };

    if (message.payload.votedId === undefined) {
        newState.skipVotes.push(player.id);
    };

    if (newState.players.filter(p => p.votedPlayer).length === newState.getAlivePlayers().length) {
        messages.push(<SendableMessage>{
            type: 'meetingFinished',
            payload: {
            },
            receivers: "all"
        });

        newState.meetingHappening = false;
        newState.players = newState.players.map(p => {return p.votedPlayer = null});
    } else {
        messages.push(<SendableMessage>{
            type: 'updateMeeting',
            payload: {
                alreadyVotedPlayers: newState.players.filter(p => p.votedPlayer).map(p => p.id),
            },
            receivers: "all"
        });
    };

    return [newState, [], []];
}