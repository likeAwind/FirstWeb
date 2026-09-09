export type { LaneId, PlantState, ZombieState, WorldState } from './types';
export {
	LANE_COUNT,
	WORLD_WIDTH,
	PLANT_X,
	ZOMBIE_START_X,
	END_X,
	ZOMBIE_SPEED,
	PLANT_HP,
	ZOMBIE_HP,
} from './constants';
export { createInitialWorld } from './world';
export { stepWorld } from './update';
