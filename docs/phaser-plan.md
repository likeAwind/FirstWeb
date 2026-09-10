# MVP-2 Plan：同路检测 + 单体自动攻击 + HP + 死亡

先不要执行代码。等明确回复「批准执行」后再改。

在 MVP-1 方向修订（植物在右、僵尸左→右）上加入最小战斗闭环。攻击是 **core 里的直接伤害**，不引入子弹、碰撞、物理、Game Over。

---

## 1. 对当前 MVP-1 真实架构的理解

| 层 | 现状 |
|---|---|
| core | 纯 TS。`WorldState` 含 3 植物 + 3 僵尸。`stepWorld` 只做 `x += speed * dt`，到 `END_X` 夹紧并 `reachedEnd`。已有 `hp`，但不扣血。 |
| 常量 | `PLANT_X = 688`，`ZOMBIE_START_X = 68`，`END_X = 728`，`ZOMBIE_SPEED = 48`，`PLANT_HP/ZOMBIE_HP = 3` |
| Phaser | `GameScene`：`dt = min(delta/1000, 0.05)` → `stepWorld` → `rect.x = zombie.x`。`Map<id, Rectangle>` 只在 create 建一次。 |
| 显示 | `view.ts`：矩形尺寸、颜色、`laneToY`、`GAME_HEIGHT`。core 无像素 y。 |

方向已经对：规则在 core，Scene 只同步。MVP-2 要把「只移动」扩成「移动 + 选目标 + 冷却 + 扣血 + 死亡」，**伤害不得写进 Scene**。

---

## 2. 推荐的战斗规则

### 同路检测

只攻击 `plant.lane === zombie.lane` 且仍存活（`hp > 0`）的僵尸。  
**禁止用 Phaser 的 y 判断目标。**

### 攻击方向

当前僵尸左→右、植物在右。有效目标再加：

```ts
zombie.x < plant.x
```

只打还在植物左侧、正在靠近的僵尸。已越过植物（含 `reachedEnd`，其 x=728 > 688）不会被打。  
不用 `<=`：重叠时不算「左侧」。

### 攻击范围：采用方案 A（无限同路射程）

**推荐 A：** 同路 + 在植物左侧即可攻击，不加 `ATTACK_RANGE`。

原因：

- 和典型 lane-defense（豌豆射手打整行前方）一致
- 少一个常量，更好测：同路就打、跨路不打、越过植物不打
- 仍是逻辑 `x`，不绑像素
- 以后加子弹时再加 `ATTACK_RANGE`（`plant.x - zombie.x <= range`），选目标函数多一个条件即可

本阶段不采用 B。若以后要「走进某距离才开火」，再把 `ATTACK_RANGE` 放进 **core 常量**，不放 view。

### 时间单位

core 全部用 **秒**（与现有 `dt`、`ZOMBIE_SPEED` 一致）。

### 攻击间隔

- `attackInterval`：两次攻击间隔（秒），常量例如 `1`
- `attackCooldown`：距离下次可攻击的剩余秒数
- 每帧：`attackCooldown = max(0, attackCooldown - dt)`
- `cooldown <= 0` 且有合法目标 → 扣血，然后 `attackCooldown = attackInterval`
- 没有目标时 cooldown 可降到 0 并保持 0（进入范围立刻能打），**不**无攻击也刷新间隔

### 第一次攻击

**有合法目标时立刻打第一下**（初始 `attackCooldown = 0`）。

原因：验收时一眼能看到掉血；「等一整轮」容易误以为没打。怕出生即死，用 HP / 伤害 / 间隔调，不靠推迟第一击。

建议数值（仍属规则，放 core）：

| 常量 | 值 | 效果 |
|---|---|---|
| `PLANT_ATTACK_DAMAGE` | 1 | 每次 -1 HP |
| `PLANT_ATTACK_INTERVAL` | 1 | 每秒 1 下 |
| `ZOMBIE_HP` | 3 | 约 3 秒死亡（仍在左侧，能看清掉血和消失） |

不改 `ZOMBIE_SPEED`。

### 目标选择

不要 `world.zombies[lane]`。过滤后取一个：

1. 同一 `lane`
2. `hp > 0`
3. `zombie.x < plant.x`

同 lane 多个时：**选 x 最大的**（离植物最近、最靠右的那个）。

当前每路一只僵尸，这条规则仍然成立，以后多僵尸不用改选择函数。

### HP 与死亡

扣血只在 core：`target.hp -= plant.attackDamage`。  
`hp <= 0` 即死亡。

**死亡方案：B — 从 `world.zombies` 移除**（不采用长期留尸的 `dead: boolean`）。

原因：

- 死后自然不会移动、不会被选中，少一批 `if (dead)`
- Scene 用「id 是否还在数组里」做 View 清理，和以后 spawn 新 id 一致
- 不在遍历中 `splice`：所有植物打完后 `world.zombies = world.zombies.filter(z => z.hp > 0)`

选目标时仍要跳过 `hp <= 0`（同一帧可能已被另一植物打死，本阶段每路一植物，但逻辑要正确）。

不为 `ZombieState` 加 `dead`。`reachedEnd` 保留。

---

## 3. 文件拆分：方案 B（轻度）

**采用 B：** `update.ts` 编排，`combat.ts` 负责选目标与攻击。

不采用 A（全部塞进 `update.ts`）：战斗规则值得单独成文件，但只多 **一个** `combat.ts`。

不引入 ECS、事件总线、DI、仓库、类继承树。

```
stepWorld
  → 移动（update.ts）
  → applyPlantAttacks（combat.ts）
  → 过滤 hp <= 0（update.ts）
```

---

## 4. 文件新增 / 修改 / 删除

**新增**

- `src/game/core/combat.ts` — `findTarget`、`applyPlantAttacks`

**修改**

- `src/game/core/types.ts` — `PlantState` 增加攻击字段
- `src/game/core/constants.ts` — `PLANT_ATTACK_DAMAGE`、`PLANT_ATTACK_INTERVAL`
- `src/game/core/world.ts` — 初始化攻击字段，`attackCooldown: 0`
- `src/game/core/update.ts` — 移动 → 攻击 → 移除死者
- `src/game/core/index.ts` — 导出新常量和需要的函数（至少 `stepWorld` 仍从这里出去）
- `src/game/scenes/view.ts` — HP 文字颜色、相对矩形的 y 偏移（显示层）
- `src/game/scenes/GameScene.ts` — HP Text 的 Map；同步文字；按缺失 id 销毁 View

**不改**

- `main.ts`、`config.ts`、`GameMount.astro`、`game.astro`、`Header.astro`、首页
- `package.json`、`astro.config.mjs`、`tsconfig.json`
- **执行阶段不要改** `docs/phaser-plan.md`

**不删除文件。**

---

## 5. 每个文件职责

| 文件 | 职责 |
|---|---|
| `types.ts` | 状态形状 |
| `constants.ts` | 规则数字（含攻击伤害/间隔） |
| `world.ts` | 初始 3+3 |
| `combat.ts` | 纯函数：选目标、扣血、重置 cooldown |
| `update.ts` | `stepWorld` 顺序：移动、战斗、清死者 |
| `view.ts` | 矩形、颜色、`laneToY`、HP 文字样式 |
| `GameScene.ts` | clamp dt、调 `stepWorld`、同步位置/HP 文字、销毁死亡 View |

---

## 6. core 数据模型变化

```ts
interface PlantState {
  id: string;
  lane: LaneId;
  x: number;
  hp: number;              // 本阶段仍不扣植物血
  attackDamage: number;
  attackInterval: number;  // 秒
  attackCooldown: number;  // 秒，剩余
}

interface ZombieState {
  id: string;
  lane: LaneId;
  x: number;
  hp: number;
  speed: number;
  reachedEnd: boolean;
  // 不加 dead
}
```

`WorldState` 不变。`hp` 真实变化只发生在 `combat.ts`。

---

## 7. `stepWorld` 每帧流程

```
1. 移动：hp > 0 且未 reachedEnd 的僵尸 x += speed * dt，撞 END_X 则夹紧
2. 植物攻击：每株 cooldown 减少；就绪则 findTarget；有目标则扣血并重置 cooldown
3. 死亡：world.zombies = filter(hp > 0)
```

考虑：

- **本帧刚走进「左侧」**：先移动再攻击，能立刻被打
- **已死**：本帧结束后移出数组；同帧后续植物因 `hp > 0` 选不到；下帧不移动
- **多植物打同一僵尸**：按植物数组顺序依次结算；打死即 hp<=0，后面的植物选不到
- **不在 for 里 splice**，只在最后 filter 赋回

`dt` 仍由 Scene clamp 后传入。core 不做 clamp，也不用 Phaser timer。

---

## 8. 目标选择逻辑（`findTarget`）

```ts
function findTarget(plant, zombies): ZombieState | null {
  let best = null;
  for (const z of zombies) {
    if (z.hp <= 0) continue;
    if (z.lane !== plant.lane) continue;
    if (z.x >= plant.x) continue;
    if (!best || z.x > best.x) best = z;
  }
  return best;
}
```

---

## 9. cooldown 逻辑

```ts
plant.attackCooldown = Math.max(0, plant.attackCooldown - dt);
if (plant.attackCooldown > 0) return;
const target = findTarget(plant, world.zombies);
if (!target) return;
target.hp -= plant.attackDamage;
plant.attackCooldown = plant.attackInterval;
```

初始 cooldown = 0 → 第一下立刻打。

---

## 10. HP / 死亡发生在哪里

| 行为 | 哪里 |
|---|---|
| `hp -= damage` | `combat.ts` / `applyPlantAttacks` |
| `hp <= 0` 含义 | 随后 filter 掉 |
| 从数组移除 | `update.ts` 末尾 |
| Scene 扣血 | **禁止** |
| `this.time.addEvent` 控攻击 | **禁止** |

---

## 11. core → Phaser View 同步

```
create:
  为每个 zombie 建 Rectangle + Text（各一次）
  zombieViews: Map<id, Rectangle>
  zombieHpViews: Map<id, Text>

每帧:
  dt = min(delta/1000, 0.05)
  stepWorld(world, dt)

  对 zombieViews 里每个 id：
    若 world.zombies 没有该 id
      → rect.destroy()、text.destroy()
      → 两个 Map delete(id)

  对仍存活的 zombie：
    rect.x = zombie.x
    text 内容 = String(zombie.hp)
    text.x = zombie.x
    text.y = laneToY(lane) - HP_LABEL_OFFSET_Y
```

- 死亡以 **core 数组里没有这个 id** 为准，不用「矩形看起来没血了」
- 不每帧重建 Rectangle / Text
- Scene **不**写 `zombie.hp -= ...`

植物仍无 View Map 更新（位置不变）。本阶段植物不掉血，不必给植物做 HP UI。

---

## 12. HP 显示方式

**推荐：僵尸矩形上方的数字文字**（如 `3` → `2` → `1`），不用血条。

原因：HP 是很小的整数；`add.text` 即可；不新框架、不新资源。血条要多两个矩形，对本阶段过重。

真实数值来自 `zombie.hp`。偏移和颜色在 **view.ts**。

需要 **额外 Map 存 HP Text**（`zombieHpViews`），与矩形 Map 分开，死亡时一起 destroy。

---

## 13. 以后 3 种植物 / 2 种僵尸

`PlantState` 已有 `attackDamage` / `attackInterval`。以后加 `kind`，`createInitialWorld` 按 kind 填不同数字；`findTarget` 可继续用。显示层按 kind 换色。不要为每种植物建 Phaser Sprite 子类当规则。本阶段不加 `kind`。

---

## 14. 实施步骤（批准后再做）

1. 扩展 `PlantState`；加攻击常量。
2. `world.ts` 填入 `attackDamage` / `attackInterval` / `attackCooldown: 0`。
3. 新增 `combat.ts`（`findTarget`、`applyPlantAttacks`）。
4. `stepWorld`：移动 → 攻击 → filter 死者。
5. 更新 `core/index.ts` 导出。
6. `view.ts` 加 HP 文字颜色和 y 偏移。
7. `GameScene`：HP Text Map、同步、按缺失 id 销毁。
8. 抽查 core 无 Phaser/DOM；Scene 无扣血、无 `time.addEvent` 控攻击。
9. 按验收验证。不装依赖，不改 plan 文件。

---

## 15. 验证步骤

1. http://localhost:4321/game 能打开
2. 3 条 lane，每路一绿植物（右）、一紫僵尸（左→右）
3. 能看到 HP 数字下降
4. 约数秒后僵尸消失（View 销毁），不留残影
5. 死亡后不再移动、不再挨打
6. 跨 lane 植物不应打死另一路僵尸（三路独立掉血/死亡）
7. 刷新 / HMR 不叠实体
8. `/` 不变
9. `npm.cmd run build` 成功
10. `src/game/core/**` 无 Phaser / DOM
11. Scene 无 `hp -=`，无用 Phaser timer 当真实攻击时钟
12. 无 physics、无新 npm 依赖

---

## 16. 风险

| 风险 | 应对 |
|---|---|
| Scene 里扣血或 `time.addEvent` 控节奏 | 禁止；时钟只在 core cooldown |
| 遍历时 splice 跳过元素 | 结束后 filter |
| 每帧新建 Text | 只在 create / 与僵尸同生；之后 `setText` |
| 只 destroy 矩形、漏文字 | 两个 Map 一起删 |
| 用 `y` 或像素距离选目标 | 只用 lane 和逻辑 `x` |
| 无限射程导致出生即死看不清移动 | 3HP / 1秒 / 1伤，大约走 3 秒再消失 |
| `hp <= 0` 仍留在数组被打/被画 | filter；选目标跳过 hp<=0 |
| Scene 用 `hp<=0` 自行决定销毁 | 以「id 不在 world.zombies」为准 |
| core 引用 view/config | 禁止 |

---

## 17. 本阶段明确不做

子弹、碰撞、物理、僵尸打植物、植物掉血、Game Over、波次、阳光、放置、AOE/DOT、多种单位、正式美术/音效、后端、React、新 npm 依赖、ECS/事件总线。

无偏离 MVP-2 范围的必要。
