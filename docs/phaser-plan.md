# MVP-1 方向修订版 Plan：植物在右，僵尸从左向右走

先不要执行代码。等明确批准后再改。

这不是只挪 Phaser 矩形，而是同步改 **core 里的游戏规则**。不增加攻击、碰撞、Game Over、新依赖。lane / y / 显示尺寸架构不变。

---

## 当前真实代码（改之前）

| 规则 | 现况 |
|---|---|
| 植物 | `PLANT_X = 80`（左侧） |
| 僵尸出生 | `ZOMBIE_START_X = 700`（右侧） |
| 移动 | `stepWorld` 里 `x -= speed * dt`（向左） |
| 终点 | `LEFT_BOUND = 40`；`x <= LEFT_BOUND` 时夹紧并 `reachedEnd = true` |

显示层已经只做 `rect.x = zombie.x`，不知道方向。`GameScene` / `view.ts` 不读 `PLANT_X` / `ZOMBIE_START_X` / `LEFT_BOUND`。

---

## 新规则

- 植物在右侧
- 僵尸从左侧出生
- 僵尸从左向右移动
- 到达右侧终点后 `reachedEnd = true`

镜像当前间距，不另发明一套距离：

| 常量 | 旧值 | 新值 | 说明 |
|---|---|---|---|
| `PLANT_X` | 80 | **688**（`WORLD_WIDTH - 80`） | 靠右，与旧左侧对称 |
| `ZOMBIE_START_X` | 700 | **68**（`WORLD_WIDTH - 700`） | 靠左出生 |
| 终点 | `LEFT_BOUND = 40` | **`END_X = 728`**（`WORLD_WIDTH - 40`） | 在植物更右侧，僵尸仍会先经过植物再到终点 |

`WORLD_WIDTH` 仍为 768。相对关系与现在相同，只是左右对调：僵尸穿过植物，再到「房子」线。

---

## `LEFT_BOUND` 是否改名为 `END_X`

**建议改名为 `END_X`，采用这个名字。**

- `LEFT_BOUND` 在新方向下是错的（终点在右边）。
- `RIGHT_BOUND` 会再绑死方向，以后若再改朝向又要改名。
- `END_X` 中性，和已有的 `reachedEnd` 对应。
- 判定改为 `zombie.x >= END_X`，然后 `zombie.x = END_X`。

不建议用 `HOUSE_X` / `GOAL_X`：本阶段没有房子或胜利语义，名字过重。

---

## Phaser Scene 要不要知道方向

**不必。** `GameScene` 继续：

```ts
const dt = Math.min(delta / 1000, 0.05);
stepWorld(this.world, dt);
rect.x = zombie.x;
```

create 时植物/僵尸的 x 已来自 core 的 `PLANT_X` / `ZOMBIE_START_X`，换常量后初始位置会自动换边。  
不要在 Scene 里写 `rect.x += speed`。

---

## 实际需要修改的文件

### 1. `src/game/core/constants.ts`

- `PLANT_X = 688`
- `ZOMBIE_START_X = 68`
- 删除 `LEFT_BOUND`，新增 `END_X = 728`
- 其余不变：`LANE_COUNT`、`WORLD_WIDTH`、`ZOMBIE_SPEED`、HP

### 2. `src/game/core/update.ts`

```ts
zombie.x += zombie.speed * dt;

if (zombie.x >= END_X) {
  zombie.x = END_X;
  zombie.reachedEnd = true;
}
```

import 改为 `END_X`。不再使用 `x -=` 或 `LEFT_BOUND`。

### 3. `src/game/core/index.ts`

导出 `END_X`，不再导出 `LEFT_BOUND`。

### 不需要改的文件

| 文件 | 原因 |
|---|---|
| `core/types.ts` | `reachedEnd` 仍是 boolean，无方向字段 |
| `core/world.ts` | 只引用 `PLANT_X` / `ZOMBIE_START_X`，改常量即可 |
| `scenes/GameScene.ts` | 只同步 `rect.x = zombie.x` |
| `scenes/view.ts` | 宽高、颜色、`laneToY`、`GAME_HEIGHT` 不变 |
| `config.ts` / `main.ts` | 启动与画布不变 |
| `GameMount.astro` / `game.astro` / `Header.astro` / 首页 | 网站壳不变 |
| `package.json` | 不装新依赖 |

---

## 每个文件修改什么（摘要）

| 文件 | 改什么 |
|---|---|
| `constants.ts` | 右侧植物、左侧出生、`END_X` |
| `update.ts` | `+=`，`x >= END_X` 时停下 |
| `index.ts` | 导出名 `END_X` |

core 仍禁止 Phaser / DOM。移动仍只允许发生在 `stepWorld()`。

---

## 修改后的 core → Phaser 数据流

```
createInitialWorld()
  plant.x = 688（右）
  zombie.x = 68（左）
        ↓
GameScene.create()  →  按 state 建 Rectangle（只一次）
        ↓ 每帧
dt = min(delta/1000, 0.05)
stepWorld: x += speed * dt；x >= END_X → 夹紧 + reachedEnd
        ↓
rect.x = zombie.x
```

显示层仍然不知道「向右」还是「向左」。

---

## 架构约束（沿用 MVP-1）

- `src/game/core/**` 纯 TypeScript，无 Phaser / DOM
- 显示宽高、颜色、lane 像素 y 只在 `view.ts` / `GameScene`
- 不实现攻击、子弹、碰撞、放置、波次、Game Over
- 不改 lane 条数、不改矩形尺寸

---

## 验证步骤

1. 打开 http://localhost:4321/game
2. 每条路：绿色植物在**右侧**，静止
3. 紫色僵尸在**左侧**出生，向**右**平滑移动，不串道
4. 僵尸经过植物后，在右边界停下，不 Game Over
5. 刷新 / HMR 后仍是 3+3，不叠实体
6. `/` 首页不变
7. `npm run build` 成功
8. core 中无 `LEFT_BOUND`、无 `x -= speed`
9. `GameScene` 仍只有 `rect.x = zombie.x`，没有方向运算

---

## 风险

| 风险 | 应对 |
|---|---|
| 只改了显示、忘了改 `stepWorld` | 必须改 `+=` 和 `END_X` |
| 漏改 `index.ts` 仍导出 `LEFT_BOUND` | 编译失败或旧名残留；一并改导出 |
| `END_X` 设在植物左侧，僵尸到不了植物右边 | 使用 728，大于 `PLANT_X` 688 |
| 在 Scene 里再写一遍方向 | 禁止 |

---

## 批准后的实施步骤

1. 改 `constants.ts` 三个位置常量并重命名终点。
2. 改 `update.ts` 移动与判定。
3. 改 `index.ts` 导出。
4. 按上面验证。不改 `phaser-plan.md`（执行阶段），不 commit。
