import { GameState, Player } from '../types/state/game.state';

export class GameDatabase {

    state: GameState;

    updateGame(gameState: GameState) {
        this.state = gameState;
    }

    getGame(): GameState {
        return this.state;
    }
}