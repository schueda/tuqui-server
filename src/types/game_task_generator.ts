import { GameTask } from "./game_task";
import { defaultGameRules } from './game_rules';
import { generateUUID } from '../utils/generate_uuid';

export class GameTaskGenerator {
    private generateCleanJewelsTask(weight: number): GameTask {
        var dificulty = '';
        if (weight <= 3) {
            dificulty = 'easy';
        } else if (weight <= 6) {
            dificulty = 'medium';
        } else {
            dificulty = 'hard';
        }

        return {
            uuid: generateUUID(),
            scanId: 'TASK_0_TAG',
            name: 'Clean Jewels',
            payload: {
                dificulty
            },
            type: 'cleanJewels'
        }
    }

    private generateScanPlayerTask(weight: number): GameTask {
        return {
            uuid: generateUUID(),
            scanId: 'TASK_1_TAG',
            name: 'Scan Player',
            payload: {},
            type: 'scanPlayer'
        }
    }

    private generateTapFastTask(weight: number): GameTask {
        return {
            uuid: generateUUID(),
            scanId: 'TASK_2_TAG',
            name: 'Tap Fast',
            payload: {
                clicks: weight * 10
            },
            type: 'tapFast'
        }
    }

    private generateMazeTask(weight: number): GameTask {
        var dificulty = '';
        if (weight <= 3) {
            dificulty = 'easy';
        } else if (weight <= 6) {
            dificulty = 'medium';
        } else {
            dificulty = 'hard';
        }

        return {
            uuid: generateUUID(),
            scanId: 'TASK_3_TAG',
            name: 'Maze',
            payload: {
                dificulty
            },
            type: 'maze'
        }
    }

    // Generates an int from 1 to 10
    private generateRandomWeight(): number {
        return Math.floor(Math.random() * 10) + 1;
    }

    generateTasks(): GameTask[] {
        const tasks = [
            this.generateCleanJewelsTask(this.generateRandomWeight()),
            this.generateScanPlayerTask(this.generateRandomWeight()),
            this.generateTapFastTask(this.generateRandomWeight()),
            this.generateMazeTask(this.generateRandomWeight())
        ];

        for (let i = tasks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
        }

        return tasks.slice(0, defaultGameRules.numberOfCurrentTasks - 1);
    }
}