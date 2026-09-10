import { END_X } from './constants';
import { applyPlantAttacks } from './combat';
import { stepExistingProjectiles } from './projectiles';
import type { WorldState } from './types';

export function stepWorld(world: WorldState, dt: number): void {
	for (const zombie of world.zombies) {
		if (zombie.hp <= 0) continue;
		if (zombie.reachedEnd) continue;

		zombie.x += zombie.speed * dt;

		if (zombie.x >= END_X) {
			zombie.x = END_X;
			zombie.reachedEnd = true;
		}
	}

	const expiredProjectileIds = stepExistingProjectiles(world, dt);

	world.zombies = world.zombies.filter((zombie) => zombie.hp > 0);
	world.projectiles = world.projectiles.filter((projectile) => !expiredProjectileIds.has(projectile.id));

	applyPlantAttacks(world, dt);
}
