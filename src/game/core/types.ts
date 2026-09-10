export type LaneId = 0 | 1 | 2;

export type ZombieKind = 'basic' | 'fat';

export type PlantKind = 'pea-shooter';

export type GameStatus = 'preparing' | 'playing' | 'victory' | 'game-over';

export type PlacementError = 'invalid-status' | 'invalid-cell' | 'occupied' | 'insufficient-sun';

export type PlacePlantResult = 'placed' | PlacementError;

export interface PlantState {
	id: string;
	kind: PlantKind;
	lane: LaneId;
	columnIndex: number;
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
	nextPlantId: number;
	gameStatus: GameStatus;
	waveIndex: number;
	waveElapsed: number;
	nextSpawnIndex: number;
	sun: number;
	sunIncomeElapsed: number;
}
