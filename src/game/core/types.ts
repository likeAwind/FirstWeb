export type LaneId = 0 | 1 | 2;

export type ZombieKind = 'basic' | 'fat';

export type PlantKind = 'pea-shooter' | 'sunflower' | 'wall-nut' | 'snow-pea';

export type ProjectileKind = 'pea' | 'snow-pea';

export type GameStatus = 'preparing' | 'playing' | 'victory' | 'game-over';

export type PlacementError =
	| 'invalid-status'
	| 'invalid-cell'
	| 'occupied'
	| 'insufficient-sun'
	| 'card-cooldown';

export type PlacePlantResult = 'placed' | PlacementError;

type PlantConfigBase = {
	hp: number;
	cost: number;
	cardCooldown: number;
};

export type ShooterPlantConfig = PlantConfigBase & {
	behavior: 'shooter';
	attackDamage: number;
	attackInterval: number;
	projectileKind: ProjectileKind;
};

export type ProducerPlantConfig = PlantConfigBase & {
	behavior: 'producer';
	sunAmount: number;
	sunInterval: number;
};

export type BlockerPlantConfig = PlantConfigBase & {
	behavior: 'blocker';
};

export type PlantConfig = ShooterPlantConfig | ProducerPlantConfig | BlockerPlantConfig;

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
	productionCooldown: number;
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
	slowRemaining: number;
}

export interface ProjectileState {
	id: string;
	kind: ProjectileKind;
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
	cardCooldowns: Record<PlantKind, number>;
	runElapsed: number;
}

export interface WorldStepEvents {
	projectileHitCount: number;
	sunProducedPlantIds: string[];
	plantDamagedIds: string[];
}
