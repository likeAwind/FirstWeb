import { END_X, SLOW_MULTIPLIER, ZOMBIE_CONTACT_DISTANCE } from './constants';
import type { PlantState, WorldState, ZombieState } from './types';

export function findBlockingPlant(zombie: ZombieState, plants: PlantState[]): PlantState | null {
	let best: PlantState | null = null;

	for (const plant of plants) {
		if (plant.hp <= 0) continue;
		if (plant.lane !== zombie.lane) continue;
		if (plant.x < zombie.x) continue;
		if (!best || plant.x < best.x) best = plant;
	}

	return best;
}

export function stepExistingZombies(world: WorldState, dt: number): string[] {
	const damagedIds = new Set<string>();

	for (const zombie of world.zombies) {
		if (zombie.hp <= 0) continue;
		if (zombie.reachedEnd) continue;

		zombie.slowRemaining = Math.max(0, zombie.slowRemaining - dt);
		const effectiveSpeed = zombie.slowRemaining > 0 ? zombie.speed * SLOW_MULTIPLIER : zombie.speed;

		zombie.attackCooldown = Math.max(0, zombie.attackCooldown - dt);

		const plant = findBlockingPlant(zombie, world.plants);
		if (plant) {
			const contactX = plant.x - ZOMBIE_CONTACT_DISTANCE;
			const nextX = zombie.x + effectiveSpeed * dt;
			const alreadyInsideContact = zombie.x >= contactX;

			if (alreadyInsideContact || nextX >= contactX) {
				if (!alreadyInsideContact) {
					zombie.x = contactX;
				}

				if (zombie.attackCooldown <= 0 && plant.hp > 0) {
					plant.hp -= zombie.attackDamage;
					zombie.attackCooldown = zombie.attackInterval;
					damagedIds.add(plant.id);
				}
				continue;
			}
		}

		zombie.x += effectiveSpeed * dt;

		if (zombie.x >= END_X) {
			zombie.x = END_X;
			zombie.reachedEnd = true;
		}
	}

	return [...damagedIds];
}
