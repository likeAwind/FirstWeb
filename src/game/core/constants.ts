import type { PlantKind, ZombieKind } from './types';

export const LANE_COUNT = 3;

export const WORLD_WIDTH = 768;

export const PLANT_COLUMN_COUNT = 5;
export const PLANT_GRID_XS = [448, 508, 568, 628, 688] as const;
export const PLANT_X = PLANT_GRID_XS[4];

export const ZOMBIE_START_X = 68;
export const END_X = 728;

export const PEA_SPEED = 320;
export const PROJECTILE_SPAWN_OFFSET_X = 28;
export const HIT_DISTANCE = 20;
export const PROJECTILE_MIN_X = 0;

export const ZOMBIE_CONTACT_DISTANCE = 32;

export const STARTING_SUN = 300;
export const SUN_INCOME_AMOUNT = 25;
export const SUN_INCOME_INTERVAL = 3;

export const PLANT_CONFIG: Record<
	PlantKind,
	{ hp: number; attackDamage: number; attackInterval: number; cost: number }
> = {
	'pea-shooter': { hp: 5, attackDamage: 1, attackInterval: 1, cost: 100 },
};

export const ZOMBIE_CONFIG: Record<
	ZombieKind,
	{ hp: number; speed: number; attackDamage: number; attackInterval: number }
> = {
	basic: { hp: 6, speed: 48, attackDamage: 1, attackInterval: 1 },
	fat: { hp: 16, speed: 30, attackDamage: 1, attackInterval: 1.5 },
};
