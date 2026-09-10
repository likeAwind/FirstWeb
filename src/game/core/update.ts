import { END_X } from './constants';
import { applyPlantAttacks } from './combat';
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

	applyPlantAttacks(world, dt);

	world.zombies = world.zombies.filter((zombie) => zombie.hp > 0);
}
