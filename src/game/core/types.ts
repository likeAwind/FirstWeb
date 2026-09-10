export type LaneId = 0 | 1 | 2;

export type ZombieKind = 'basic' | 'fat';

export type GameStatus = 'playing' | 'victory' | 'game-over';

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
	kind: ZombieKind;
	lane: LaneId;
	x: number;
	hp: number;
	speed: number;
	attackDamage: number;
	attackInterval: number;
	attackCooldown: number;
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
	nextZombieId: number;
	gameStatus: GameStatus;
	waveIndex: number;
	waveElapsed: number;
	nextSpawnIndex: number;
}
