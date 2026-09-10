export type { LaneId, ZombieKind, GameStatus, PlantState, ZombieState, ProjectileState, WorldState } from './types';
export {
	LANE_COUNT,
	WORLD_WIDTH,
	PLANT_X,
	ZOMBIE_START_X,
	END_X,
	PLANT_HP,
	PLANT_ATTACK_DAMAGE,
	PLANT_ATTACK_INTERVAL,
	PEA_SPEED,
	PROJECTILE_SPAWN_OFFSET_X,
	HIT_DISTANCE,
	PROJECTILE_MIN_X,
	ZOMBIE_CONTACT_DISTANCE,
	ZOMBIE_CONFIG,
} from './constants';
export { WAVE_COUNT } from './waves';
export { createInitialWorld } from './world';
export { stepWorld } from './update';
