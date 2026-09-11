import { PEA_SPEED, PLANT_CONFIG, PROJECTILE_SPAWN_OFFSET_X } from './constants';
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
		const config = PLANT_CONFIG[plant.kind];
		if (config.behavior !== 'shooter') continue;

		plant.attackCooldown = Math.max(0, plant.attackCooldown - dt);
		if (plant.attackCooldown > 0) continue;

		const target = findTarget(plant, world.zombies);
		if (!target) continue;

		world.projectiles.push({
			id: `pea-${world.nextProjectileId++}`,
			kind: config.projectileKind,
			lane: plant.lane,
			x: plant.x - PROJECTILE_SPAWN_OFFSET_X,
			speed: PEA_SPEED,
			damage: plant.attackDamage,
			sourcePlantId: plant.id,
		});
		plant.attackCooldown = plant.attackInterval;
	}
}
