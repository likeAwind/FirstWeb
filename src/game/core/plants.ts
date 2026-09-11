import {
	LANE_COUNT,
	PLANT_COLUMN_COUNT,
	PLANT_CONFIG,
	PLANT_GRID_XS,
	PLANT_KINDS,
	SUN_INCOME_AMOUNT,
	SUN_INCOME_INTERVAL,
} from './constants';
import type { LaneId, PlacementError, PlacePlantResult, PlantKind, WorldState } from './types';

function isLaneId(lane: number): lane is LaneId {
	return Number.isInteger(lane) && lane >= 0 && lane < LANE_COUNT;
}

function isColumnIndex(columnIndex: number): boolean {
	return Number.isInteger(columnIndex) && columnIndex >= 0 && columnIndex < PLANT_COLUMN_COUNT;
}

export function isPlantCellOccupied(world: WorldState, lane: LaneId, columnIndex: number): boolean {
	return world.plants.some(
		(plant) => plant.hp > 0 && plant.lane === lane && plant.columnIndex === columnIndex,
	);
}

export function validatePlacement(
	world: WorldState,
	kind: PlantKind,
	lane: number,
	columnIndex: number,
): PlacementError | null {
	if (world.gameStatus !== 'preparing' && world.gameStatus !== 'playing') {
		return 'invalid-status';
	}
	if (!isLaneId(lane) || !isColumnIndex(columnIndex)) {
		return 'invalid-cell';
	}
	if (isPlantCellOccupied(world, lane, columnIndex)) {
		return 'occupied';
	}
	if (world.sun < PLANT_CONFIG[kind].cost) {
		return 'insufficient-sun';
	}
	if (world.gameStatus === 'playing' && world.cardCooldowns[kind] > 0) {
		return 'card-cooldown';
	}
	return null;
}

export function canPlacePlant(
	world: WorldState,
	kind: PlantKind,
	lane: number,
	columnIndex: number,
): boolean {
	return validatePlacement(world, kind, lane, columnIndex) === null;
}

export function placePlant(
	world: WorldState,
	kind: PlantKind,
	lane: number,
	columnIndex: number,
): PlacePlantResult {
	const error = validatePlacement(world, kind, lane, columnIndex);
	if (error) return error;

	const config = PLANT_CONFIG[kind];
	const isShooter = config.behavior === 'shooter';
	const isProducer = config.behavior === 'producer';

	world.sun -= config.cost;
	world.plants.push({
		id: `plant-${world.nextPlantId++}`,
		kind,
		lane: lane as LaneId,
		columnIndex,
		x: PLANT_GRID_XS[columnIndex],
		hp: config.hp,
		attackDamage: isShooter ? config.attackDamage : 0,
		attackInterval: isShooter ? config.attackInterval : 0,
		attackCooldown: 0,
		productionCooldown: isProducer ? config.sunInterval : 0,
	});

	if (world.gameStatus === 'playing') {
		world.cardCooldowns[kind] = config.cardCooldown;
	}

	return 'placed';
}

export function startBattle(world: WorldState): boolean {
	if (world.gameStatus !== 'preparing') return false;
	if (world.plants.length < 1) return false;
	world.gameStatus = 'playing';
	return true;
}

export function stepSunIncome(world: WorldState, dt: number): void {
	if (world.gameStatus !== 'playing') return;

	world.sunIncomeElapsed += dt;
	while (world.sunIncomeElapsed >= SUN_INCOME_INTERVAL) {
		world.sun += SUN_INCOME_AMOUNT;
		world.sunIncomeElapsed -= SUN_INCOME_INTERVAL;
	}
}

export function stepPlantProduction(world: WorldState, dt: number): string[] {
	const producedIds: string[] = [];
	if (world.gameStatus !== 'playing') return producedIds;

	for (const plant of world.plants) {
		const config = PLANT_CONFIG[plant.kind];
		if (config.behavior !== 'producer') continue;
		if (plant.hp <= 0) continue;

		plant.productionCooldown -= dt;
		while (plant.productionCooldown <= 0) {
			world.sun += config.sunAmount;
			plant.productionCooldown += config.sunInterval;
			producedIds.push(plant.id);
		}
	}

	return producedIds;
}

export function stepCardCooldowns(world: WorldState, dt: number): void {
	if (world.gameStatus !== 'playing') return;

	for (const kind of PLANT_KINDS) {
		world.cardCooldowns[kind] = Math.max(0, world.cardCooldowns[kind] - dt);
	}
}
