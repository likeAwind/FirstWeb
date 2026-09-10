import type { LaneId, PlantState, WorldState } from './types';
import { LANE_COUNT, PLANT_X, PLANT_HP, PLANT_ATTACK_DAMAGE, PLANT_ATTACK_INTERVAL } from './constants';

export function createInitialWorld(): WorldState {
	const plants: PlantState[] = [];

	for (let lane = 0; lane < LANE_COUNT; lane++) {
		const laneId = lane as LaneId;
		plants.push({
			id: `plant-${laneId}`,
			lane: laneId,
			x: PLANT_X,
			hp: PLANT_HP,
			attackDamage: PLANT_ATTACK_DAMAGE,
			attackInterval: PLANT_ATTACK_INTERVAL,
			attackCooldown: 0,
		});
	}

	return {
		plants,
		zombies: [],
		projectiles: [],
		nextProjectileId: 1,
		nextZombieId: 1,
		gameStatus: 'playing',
		waveIndex: 0,
		waveElapsed: 0,
		nextSpawnIndex: 0,
	};
}
