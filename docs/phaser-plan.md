# MVP-5 Plan：动态 Wave + 两种 Zombie + 攻击植物 + 胜负

先不要执行代码。等明确回复「批准执行」后再改。

一次做完第一版关卡循环：动态 spawn、basic/fat、僵尸停下来打植物、植物真死 + death 动画、Victory / Game Over。不生成、不修改 PNG。fat 复用 basic 素材，只在 View 放大。

---

## 0. 当前真实基线（与 prompt 的差异）

已读代码。和 prompt 描述一致的部分：Projectile 下一帧才飞、扫掠命中才扣僵尸 HP、植物 idle/attack、僵尸 walk + 逻辑死后播 die。

**仍是固定开局，不是 Wave：**

- `createInitialWorld()` 仍创建 3 株植物 + **3 只僵尸**（`zombie-${lane}`）
- `GameScene.create()` **一次性**创建全部僵尸 Sprite / HP Text
- `destroyMissingZombieViews()` 只处理死亡，不创建新 id
- `stepWorld`：僵尸无脑右移 → 已有豌豆步进 → 过滤死僵尸/过期豌豆 → `applyPlantAttacks` spawn
- `PlantState.hp` 已有，但 **从未被扣**；`PLANT_HP = 3`
- `pea-shooter/die.png` 存在，**未 preload / 未 play**
- 无 `kind`、无 Wave、无 `gameStatus`

Plan 阶段不改代码；执行时按下面替换，不保留开局 3 僵尸。

素材已在 `public/game/**`（idle/attack/die、pea-fly、zombie/basic walk+die）。执行时再核对像素；不符则停。不恢复旧 `/game/zombie/walk.png`。

---

## 1. 数据与常量

**`ZombieKind = 'basic' | 'fat'`**

配置表（core，Scene 不写规则数值）：

```ts
const ZOMBIE_CONFIG = {
  basic: { hp: 6, speed: 48, attackDamage: 1, attackInterval: 1 },
  fat:   { hp: 16, speed: 30, attackDamage: 1, attackInterval: 1.5 },
};
```

删除单独的 `ZOMBIE_HP` / `ZOMBIE_SPEED`，避免两套真相。植物 DPS≈1。basic 走到接触约 `588/48≈12.3s`，6 HP 单独走不到植物前。fat 约 `19.6s`。

**Wave 3 lane1（结构不变：0s fat + 5s basic）推演：** basic 更快，约 t=13.3s 在 x≈468 追上 fat，并因更靠右吃满豌豆。追上前 fat 大约挨 13 发。

- fat HP **20**：追上后仍约 7～8 HP，basic 挡枪期间 fat 贴脸，残余足够打完植物 5 血 → **默认容易 Game Over**（否决）。
- fat HP **16**：追上时约 3 HP，随后 basic 先贴脸打掉植物 1～2 点；fat 再接手打 1～2 下后被点掉。植物常掉到 1～3，fat 仍有较高概率真正接触，**整局偏 Victory**。

执行时若 fat 经常死在接触前，只把 HP 微增到 17，不要加回 20。

**ZombieState 新增：** `kind`、`attackDamage`、`attackInterval`、`attackCooldown`。保留 `reachedEnd`。

**不要** `targetPlantId` / `isAttacking` / `state`：每帧用 `findBlockingPlant` + 接触距离即可推导。

**WorldState 新增（扁平，不另套状态机）：**

```ts
gameStatus: 'playing' | 'victory' | 'game-over'
waveIndex: number        // 0-based
waveElapsed: number
nextSpawnIndex: number
nextZombieId: number
```

已有 `nextProjectileId`。`createInitialWorld()`：`zombies = []`，`projectiles = []`，`nextZombieId = 1`，`waveIndex = 0`，`waveElapsed = 0`，`nextSpawnIndex = 0`，`gameStatus = 'playing'`。仍创建 3 株植物。

id：`zombie-${nextZombieId++}`（`zombie-1`…）。kind 在字段里，不写进 id。禁止 Date/random/DOM。

**其它常量：** `ZOMBIE_CONTACT_DISTANCE = 32`，`PLANT_HP = 5`（方便看掉血，又不会被一口秒）。植物攻击数值不变。

---

## 2. Wave 表（固定 TS，约 45s）

```ts
interface ZombieSpawnDefinition { at: number; lane: LaneId; kind: ZombieKind }
interface WaveDefinition { spawns: ZombieSpawnDefinition[] }
```

`WAVES` 长度 3 → `WAVE_COUNT`。时钟只用 core `dt`，不用 Phaser Timer。

| Wave | at(s) | lane | kind | 目的 |
|---|---|---|---|---|
| 1 | 0 / 1.5 / 3 | 0 / 1 / 2 | basic | 动态 spawn，三路都有 |
| 2 | 0, 0.3, 0.6 | 0,1,2 | basic | 同 lane 第二只 |
| 2 | 3, 3.3, 3.6 | 0,1,2 | basic | 同上 |
| 3 | 0 | 1 | fat | 压力路，争取贴脸 |
| 3 | 1 / 2 | 0 / 2 | basic | 边路 |
| 3 | 5 | 1 | basic | 同路追上 fat，帮挡豌豆 |
| 3 | 6 / 7 | 0 / 2 | basic | 边路第二只 |

默认偏 Victory：边路 basic 仍会被 1 DPS 清掉；lane 1 用 fat HP 16 限制「basic 挡枪」红利，植物应明显掉血甚至接近死亡，但较少被推倒后再破门。Game Over 仍用临时 `PLANT_HP=1` 验证，不靠默认关卡常输。

预计：Wave1 ~11s，Wave2 ~12s，Wave3 ~22s，合计约 **45s**（加 Wave 切换瞬间）。符合 30～60s。

推进：当前 Wave 计划 spawn 全部完成 **且** `zombies.length === 0` → 有下一波则 `waveIndex++`、`waveElapsed=0`、`nextSpawnIndex=0`；已是最后一波 → `gameStatus = 'victory'`。Victory **不等** death Sprite。

**终局豌豆：** Victory **与** Game Over 都 `projectiles = []`。core 停止推进后场上不应留下悬停豌豆。

---

## 3. 僵尸移动 / 接触 / 攻击

`findBlockingPlant(zombie, plants)`：同 lane、`hp > 0`、`plant.x >= zombie.x`，取 **最小 plant.x**（前方最近）。不写 `plants[lane]`。

`contactX = plant.x - 32`。本帧若 `x + speed*dt` 会越过 contactX → `x = contactX`（防穿模）。已在接触：不改 x，结算攻击。

无 blocker：照常 `x += speed*dt`；`x >= END_X` → clamp 并 `reachedEnd = true`。

攻击：`attackCooldown = max(0, cooldown - dt)`；接触且 cooldown≤0 → `plant.hp -= damage`，`cooldown = interval`。第一次接触立即打。无接触时 cooldown 可降到 0。Scene 禁止改 HP。

**同帧多僵尸：** 按 `world.zombies` 数组顺序。打到 `hp<=0` 后，**本帧杀手不继续移动**；后面的僵尸 `findBlockingPlant` 已忽略该植物，可移动、不可再打它。僵尸步进结束后立刻从数组去掉死植物，再检查破门；未 GO 的下一帧全体恢复走路。不引入锁/队列。

无僵尸互挡（basic 可以穿过 fat 成为更靠右的目标；`findTarget` 仍打 max x）。

---

## 4. `stepWorld` 最终顺序

```
if (gameStatus !== 'playing') return

1. 步进本帧开始前已有的 Zombie（挡/走/打）
2. 先清掉本阶段打到 hp<=0 的 Plant
3. 任一 reachedEnd → gameStatus='game-over'，projectiles = []，return
   （破门判定仍在豌豆步进之前，避免同帧被豌豆救回来）
4. 步进本帧已有 Projectile（MVP-4：移、扫掠、扣僵尸 HP、标记）
5. 清理：zombies hp>0、过期豌豆
6. 仍存活植物 cooldown / findTarget / spawn 新豌豆（当帧不飞）
7. waveElapsed += dt；到期则 spawn 新僵尸（当帧不走、不打）
8. 本 Wave spawn 完且 zombies.length===0：
     还有下一 Wave → 切换
     否则 → victory，projectiles = []
```

要点：

- 同帧「植物被打死 + 另一只僵尸破门」：步骤 2 已把死亡植物移出 `world.plants`，再 GO。Scene 能播 plant death，不会卡着 hp<=0 的幽灵植物。
- 新僵尸 / 新豌豆都靠「先步进旧实体，再 spawn」跳过当帧，**不加** justSpawned
- 最后一只僵尸被豌豆打死：先清僵尸再开火 → `findTarget` 为空 → **不会多打一发**；再判 Victory
- death Sprite 不参与胜负
- Victory / Game Over 都清空豌豆，避免 freeze 后豆子停在半空

---

## 5. View

**动态僵尸（必须，类似豌豆 Map）：** `create()` 不再创建僵尸。`syncZombieViews()`：新 id → Sprite（basic 64×64 / fat **80×80**，同 basic 贴图，无 tint）+ walk + HP Text；仍在 → 同步 x/HP；消失 → 移出 Map、HP destroy、播 die、complete 才 `sprite.destroy()`。不每帧重建。不写通用 ECS。

**植物 HP：** `plantHpViews`。植物仍开局创建（本阶段不动态种植物）。缺失 id：与僵尸相同残留模式——先从 Map 删、HP Text destroy，再播 `pea-shooter-die`（8 帧、48×48、10fps、repeat 0），complete 只 destroy Sprite。

**避免 death 被切回 idle：**

- 进 death 前就从 `plantViews` 删除 → 残留豌豆的 `playPlantAttack(sourcePlantId)` 找不到，不会 restart attack
- 现有稳定监听保持：`complete && key===attack → idle`。die 的 complete key 不是 attack，不会回 idle
- death 用 `once(COMPLETE_KEY + die → destroy)` + `play(die)`，只播一次
- 不为动画推迟 core 删除；已飞出的豌豆不回收

**UI：** 仅 Text。上方 `Wave ${waveIndex+1} / ${WAVE_COUNT}`；结束时居中「游戏结束」或「胜利」。只读 core。无按钮/重开/血条。

**HMR：** `anims.exists`；create 时 clear Maps。

---

## 6. 文件

**新增**

- `src/game/core/waves.ts` — 表、按 elapsed spawn、切 Wave / Victory
- `src/game/core/zombies.ts` — `findBlockingPlant` + 移动/夹紧/攻击（避免 `update.ts` 膨胀）

**修改**

- `types.ts` / `constants.ts` / `world.ts` / `combat.ts`（植物仍只打活僵尸；死植物不在数组里自然不开火）
- `projectiles.ts` — 命中逻辑保持；不必为胜负改
- `update.ts` — 编排新顺序
- `index.ts` — 导出 kind、WAVE_COUNT、gameStatus 等 Scene 需要的只读量
- `view.ts` — plant die 常量、fat 80、UI 字号位置
- `GameScene.ts` — preload die；动态僵尸；植物 HP + death；Wave/结果 Text

**不改：** `public/**`、`main.ts`、`config.ts`、Astro、`package.json`、**执行阶段不改** `docs/phaser-plan.md`。不新依赖、不 Physics。

---

## 7. 验证

默认试玩：三波、动态僵尸、fat 更大更肉、车道多尸、植物 HP 数字、豌豆仍命中才扣尸 HP、大概率 Victory。

**Game Over（执行完立刻 restore，Diff 不留测试）：** 临时 `PLANT_HP = 1` 打一局到破门，确认 freeze 与文案，再改回 5。不留按钮/作弊键/query。

`npm.cmd run build`；core 无 Phaser；`/` 不变。

---

## 8. 风险

| 风险 | 应对 |
|---|---|
| 开局仍 3 僵尸 | `createInitialWorld` 空数组 + Scene 改 sync |
| fat 被 basic 挡枪后必杀植物 | fat HP 16，不改 Wave 结构；过弱再加到 17 |
| 破门同帧植物未从数组删除 | 先 filter 死植物，再查 reachedEnd / GO |
| 破门同帧被豌豆救 | GO 在豌豆步进之前，清空豌豆后 return |
| freeze 后豌豆悬停 | Victory 与 Game Over 都 `projectiles = []` |
| 最后一尸死后多种一发 | 先清理再植物开火 |
| attack complete 打断 death | 先出 Map；complete 只对 attack 回 idle |
| 幽灵 HP/Sprite | 与僵尸同一套 Map 删除 |
| 植物死了豌豆被清 | 不按 sourcePlantId 回收 |
| Phaser Timer 当 Wave 钟 | 禁止，只用 dt |
| 误做 Restart/菜单 | 不做 |

不做：新植物、放置、阳光、fat 正式图、僵尸攻击动画、爆炸、音效、随机波、无限、暂停、重开、存档、ECS。

---

## 9. 对 prompt 35 问的直接回答

1. 现序：移尸 → 豌豆 → 滤尸/豌豆 → 植物开火。  
2. 僵尸：`world.ts` 开局 3 只；View 在 `create()` 一次做完。  
3. 开局空数组 + Wave spawn + `syncZombieViews`。  
4. `'basic' \| 'fat'`。  
5. basic 6/48/1/1；fat **16**/30/1/1.5。  
6. 同贴图，80×80，不 tint。  
7. kind + 三套攻击字段。  
8. 不要 targetPlantId。  
9. 不要 isAttacking。  
10. 同 lane、活、在前方、最近。  
11. 将 x 夹到 contactX。  
12. 每帧减；接触且 ≤0 立刻打。  
13. 数组顺序；死后本帧后面的不再打、可走。  
14. 植物 HP=5。  
15. 僵尸攻击之后、reachedEnd / GO 之前先 filter 死植物；死僵尸仍在豌豆步进之后 filter。  
16. 出 core → 出 Map → 删 HP → 播 die → complete destroy。  
17. 出 Map + complete 仅 attack 回 idle。  
18. sync 见新 id 则创建。  
19. 沿用现有 walk/die + once complete。  
20. `{ spawns: {at,lane,kind}[] }`。  
21. 扁平挂在 WorldState。  
22. `zombie-${nextZombieId++}`。  
23. 见第 2 节表。  
24. ~45s。  
25. 边路可清；lane1 fat 16 + 5s basic，接触并掉血，较少推倒破门。  
26. 僵尸步进 → 清死植物 → 再查破门；GO 在豌豆前。  
27. spawn 之后：末波 spawn 完且尸空。  
28. Victory **和** Game Over 都清空残余豌豆。  
29. 非 playing 则 `stepWorld` 直接 return。  
30. Text 读 waveIndex / WAVE_COUNT / gameStatus。  
31. 要 waves.ts。  
32. 要 zombies.ts。  
33. public、main、config、Astro、package、Plan（执行时）。  
34. 临时 PLANT_HP=1，验完改回。  
35. 见第 8 节。

---

## 10. 批准后步骤

1. 核对 PNG 尺寸；不符则停。  
2. types / constants / world。  
3. zombies.ts + waves.ts；改 update 顺序。  
4. view + GameScene。  
5. 试玩 Victory；临时 PLANT_HP=1 验 GO 后改回。  
6. build；确认 core 无 Phaser。
