import type { PlantState, WorldState, ZombieState } from './types';

export function findTarget(plant: PlantState, zombies: ZombieState[]): ZombieState | null {
	let best: ZombieState | null = null;

	for (const zombie of zombies) {
		if (zombie.hp <= 0) continue;
		if (zombie.lane !== plant.lane) continue;
		if (zombie.x >= plant.x) continue;
		if (!best || zombie.x > best.x) best = zombie;
	}

	return best;
}

export function applyPlantAttacks(world: WorldState, dt: number): void {
	for (const plant of world.plants) {
		plant.attackCooldown = Math.max(0, plant.attackCooldown - dt);
		if (plant.attackCooldown > 0) continue;

		const target = findTarget(plant, world.zombies);
		if (!target) continue;

		target.hp -= plant.attackDamage;
		plant.attackCooldown = plant.attackInterval;
	}
}
