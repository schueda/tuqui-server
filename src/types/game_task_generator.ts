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
            payload: {
                dificulty
            },
            type: 'cleanTheGems',
            completed: false
        }
    }

    private generateScanPlayerTask(weight: number): GameTask {
        return {
            uuid: generateUUID(),
            scanId: 'none',
            payload: {},
            type: 'scanThem',
            completed: false
        }
    }

    private generateBlowTheBugsTask(weight: number): GameTask {
        return {
            uuid: generateUUID(),
            scanId: 'TASK_1_TAG',
            payload: {
                clicks: weight * 10
            },
            type: 'blowTheBugs',
            completed: false
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
            scanId: 'TASK_2_TAG',
            payload: {
                dificulty
            },
            type: 'outOfLab',
            completed: false
        }
    }

    private generateSpellTheSpellTask(weight: number): GameTask {
        return {
            uuid: generateUUID(),
            scanId: 'TASK_3_TAG',
            payload: {},
            type: 'spellTheSpell',
            completed: false
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
            // this.generateTapFastTask(this.generateRandomWeight()), NÃO SERÁ CHAMADO AINDA PORQUE NÃO TEMOS A TASK
            this.generateMazeTask(this.generateRandomWeight())
        ];

        for (let i = tasks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
        }

        return tasks.slice(0, defaultGameRules.numberOfCurrentTasks - 1);
    }
}