import { PLANT_KINDS, STARTING_SUN } from './constants';
import type { PlantKind, WorldState } from './types';

function emptyCardCooldowns(): Record<PlantKind, number> {
	const cardCooldowns = {} as Record<PlantKind, number>;
	for (const kind of PLANT_KINDS) {
		cardCooldowns[kind] = 0;
	}
	return cardCooldowns;
}

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
		cardCooldowns: emptyCardCooldowns(),
		runElapsed: 0,
	};
}
