import type { WorldState } from './types';
import { STARTING_SUN } from './constants';

export function createInitialWorld(): WorldState {
	return {
		plants: [],
		zombies: [],
		projectiles: [],
		nextProjectileId: 1,
		nextZombieId: 1,
		nextPlantId: 1,
		gameStatus: 'preparing',
		waveIndex: 0,
		waveElapsed: 0,
		nextSpawnIndex: 0,
		sun: STARTING_SUN,
		sunIncomeElapsed: 0,
	};
}
