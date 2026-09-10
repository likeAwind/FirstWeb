# MVP-3 修订 Plan：8 帧 Walk + Death 动画

先不要执行代码。等明确回复「批准执行」后再改。

把 walk 从 4 帧/32px 升到 **8 帧/48px**，并加上 **8 帧 death（播一次后销毁）**。僵尸显示放大到约 64×64。植物仍是绿色 Rectangle。**不改 core 战斗规则。**

素材由你提供，执行时只读、不生成、不改 PNG。若实际尺寸不是 **384×48 / 8 帧 / 每帧 48×48**，停止并汇报。

---

## 1. 当前代码在干什么

`GameScene` 已有管线：`preload` spritesheet → 注册 `zombie-walk`（**0–3 帧，32×32**）→ `Map<id, Sprite>` → `stepWorld` → `sprite.x = zombie.x` → id 缺失则 **立刻 destroy Sprite + HP Text**。

问题：core 一删 zombie，Scene 马上 `destroy()`，**death 播不出来**。

`view.ts` 仍是 32×32、`end: 3`、显示 36×36。

---

## 2. 死亡动画：core 已删人，Sprite 怎么继续播

**core 仍然立刻从 `world.zombies` 移除。不推迟死亡，不把尸体塞回数组，不给 core 加动画状态。**

Death 只是「逻辑已死之后的视觉残留」。

推荐最小方案（**不必**再做一个 `dyingSprites` Set）：

```
stepWorld 删掉 zombie
        ↓
Scene 发现 zombieViews 里有 id，但 liveIds 没有
        ↓
立刻：HP Text destroy + 两个 Map delete(id)
        ↓  （此时已离开「活着的 View」管理）
sprite.stop walk → play('zombie-die', repeat 0)
        ↓
animationcomplete → sprite.destroy()
```

下一帧 `destroyMissingZombieViews` **找不到这个 id**（已从 `zombieViews` 删掉），所以 **不会重复触发 death**。

`update` 只对 `world.zombies` 写 `sprite.x`。死亡 Sprite 不在 Map 里，也 **不再跟 core 移动**，停在死亡那一帧的位置。

Phaser 4 用一次性监听，例如：

```ts
sprite.once(
  Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + ZOMBIE_DEATH_ANIM_KEY,
  () => sprite.destroy(),
);
```

（执行时按 Phaser 4 实际事件名对接；只 destroy Sprite，**不改 HP / world**。）

整局 `destroyGame()` 会拆掉 Game，残留回调可忽略。不引入动画状态机。

---

## 3. Walk / Death 配置（全部 View 层）

| | walk | death |
|---|---|---|
| 文件 | `/game/zombie/walk.png` | `/game/zombie/die.png` |
| texture key | `zombie-walk-sheet` | `zombie-die-sheet` |
| anim key | `zombie-walk` | `zombie-die` |
| 切帧 | 48×48，frames **0–7** | 同左 |
| repeat | `-1` 循环 | **`0` 只一次** |
| frameRate | **10** | **10** |

**为何 10 fps：** 8 帧循环约 0.8 秒一步，能看清；death 约 0.8 秒播完再消失。只影响视觉，不进 `stepWorld` / `ZOMBIE_SPEED`。

显示：`ZOMBIE_VIEW_WIDTH/HEIGHT = 64`（源帧 48，放大好看）。HP 偏移可略加大（如 40），避免压在大 Sprite 上——仍只改 `view.ts`。

`preload` 两张 sheet；`create` 里 `anims.exists` 后再 `create` walk（0–7）和 die（0–7）。不要每帧注册。

---

## 4. 文件范围

**修改**

- `src/game/scenes/view.ts` — 帧 48、8 帧常量、die 的 URL/key、显示 64、walk/death frameRate
- `src/game/scenes/GameScene.ts` — preload 两张；注册两个动画；缺 id 时改播 death，而不是立刻 destroy Sprite

**使用、不改**

- `public/game/zombie/walk.png`
- `public/game/zombie/die.png`

**不改**

- `src/game/core/**`
- `config.ts`、`main.ts`、Astro、`package.json`
- **执行阶段不改** `docs/phaser-plan.md`

不必改 core：死亡时机已经正确，只缺显示层延迟销毁。

---

## 5. Sprite 生命周期

```
preload     walk.png + die.png
create      注册 zombie-walk / zombie-die（exists 则跳过）
            每个活僵尸：Sprite.play(walk) + HP Text
update      stepWorld
            缺 id：删 Map、毁 HP、play die（once complete → destroy）
            仍活着：sprite.x = zombie.x，HP 跟随
HMR/离开    现有 destroyGame()
```

植物继续 Rectangle。无 flipX（素材已朝右）。

---

## 6. 实施步骤（批准后）

1. 读 PNG IHDR，确认两张都是 384×48；不对就停。
2. 改 `view.ts` 常量（48 帧、8 帧、die、64 显示、fps 10）。
3. `GameScene`：双 preload、双 anim、`end: 7`。
4. 改 `destroyMissingZombieViews`：先 delete Map + 毁 HP，再 `play(die)` + complete 时 `destroy`。
5. 活着的同步逻辑不变。core 零 diff。

---

## 7. 验证

1. `/game` 可玩；植物仍是绿块  
2. walk 8 帧循环，体型明显大于现在  
3. 仍按 core 从左向右走；改 frameRate 不应改变走速  
4. HP 下降并跟随  
5. HP 到 0：数字马上没，Sprite 播完 8 帧 death 再消失  
6. death 只一次、播时不移动  
7. 无重复 death、无幽灵 Sprite/Text  
8. 刷新 / HMR 不叠实体、不重复注册动画  
9. core 无 Phaser；Scene 不改 HP/speed  
10. 无新依赖、无 physics  
11. `npm.cmd run build` 成功  

---

## 8. 风险

| 风险 | 应对 |
|---|---|
| PNG 不是 384×48 | 执行第一步核对，不一致则停 |
| 仍立刻 destroy | 必须先 `zombieViews.delete`，再 play die |
| 每帧再 play die | id 已不在 Map |
| complete 事件名不对 | 对照 Phaser 4 `Animations.Events` |
| 回调里改 core | 禁止，只 `sprite.destroy()` |
| 显示 64 后 HP 重叠 | 加大 `HP_LABEL_OFFSET_Y` |

不做 attack/hurt/植物动画、子弹、物理、新战斗、波次、音效、状态机。
