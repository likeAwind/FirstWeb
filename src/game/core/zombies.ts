import { END_X, ZOMBIE_CONTACT_DISTANCE } from './constants';
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

export function stepExistingZombies(world: WorldState, dt: number): void {
	for (const zombie of world.zombies) {
		if (zombie.hp <= 0) continue;
		if (zombie.reachedEnd) continue;

		zombie.attackCooldown = Math.max(0, zombie.attackCooldown - dt);

		const plant = findBlockingPlant(zombie, world.plants);
		if (plant) {
			const contactX = plant.x - ZOMBIE_CONTACT_DISTANCE;
			const nextX = zombie.x + zombie.speed * dt;

			if (zombie.x >= contactX || nextX >= contactX) {
				zombie.x = contactX;
				if (zombie.attackCooldown <= 0 && plant.hp > 0) {
					plant.hp -= zombie.attackDamage;
					zombie.attackCooldown = zombie.attackInterval;
				}
				continue;
			}
		}

		zombie.x += zombie.speed * dt;

		if (zombie.x >= END_X) {
			zombie.x = END_X;
			zombie.reachedEnd = true;
		}
	}
}
