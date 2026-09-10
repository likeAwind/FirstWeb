export type LaneId = 0 | 1 | 2;

export interface PlantState {
	id: string;
	lane: LaneId;
	x: number;
	hp: number;
	attackDamage: number;
	attackInterval: number;
	attackCooldown: number;
}

export interface ZombieState {
	id: string;
	lane: LaneId;
	x: number;
	hp: number;
	speed: number;
	reachedEnd: boolean;
}

export interface ProjectileState {
	id: string;
	lane: LaneId;
	x: number;
	speed: number;
	damage: number;
	sourcePlantId: string;
}

export interface WorldState {
	plants: PlantState[];
	zombies: ZombieState[];
	projectiles: ProjectileState[];
	nextProjectileId: number;
}
