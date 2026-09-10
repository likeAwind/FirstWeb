export type { LaneId, PlantState, ZombieState, ProjectileState, WorldState } from './types';
export {
	LANE_COUNT,
	WORLD_WIDTH,
	PLANT_X,
	ZOMBIE_START_X,
	END_X,
	ZOMBIE_SPEED,
	PLANT_HP,
	ZOMBIE_HP,
	PLANT_ATTACK_DAMAGE,
	PLANT_ATTACK_INTERVAL,
	PEA_SPEED,
	PROJECTILE_SPAWN_OFFSET_X,
	HIT_DISTANCE,
	PROJECTILE_MIN_X,
} from './constants';
export { createInitialWorld } from './world';
export { stepWorld } from './update';
