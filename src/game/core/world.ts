import type { LaneId, PlantState, WorldState, ZombieState } from './types';
import {
	LANE_COUNT,
	PLANT_X,
	ZOMBIE_START_X,
	ZOMBIE_SPEED,
	PLANT_HP,
	ZOMBIE_HP,
	PLANT_ATTACK_DAMAGE,
	PLANT_ATTACK_INTERVAL,
} from './constants';

export function createInitialWorld(): WorldState {
	const plants: PlantState[] = [];
	const zombies: ZombieState[] = [];

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
		zombies.push({
			id: `zombie-${laneId}`,
			lane: laneId,
			x: ZOMBIE_START_X,
			hp: ZOMBIE_HP,
			speed: ZOMBIE_SPEED,
			reachedEnd: false,
		});
	}

	return { plants, zombies, projectiles: [], nextProjectileId: 1 };
}
