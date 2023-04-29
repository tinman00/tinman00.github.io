<script setup>
import { computed } from '@vue/reactivity';
import sha512 from 'js-sha512'
import { getTransitionRawChildren, onMounted, onUnmounted, ref, watch } from 'vue';
const props = defineProps({
  playerString: String,
  identity: Number
})
const Stat = {
  HP: 0,
  atk: 1,
  def: 2,
  mag: 3,
  res: 4,
  spd: 5,
  dex: 6,
  health: 7,
  maxHealth: 8
}
const DamageType = {
  Physical: 0,
  Magic: 1,
  True: 2
}
const SourceType = {
  Melee: 0,
  Ranged: 1
}
const CounterType = {
  Player: 0,
  Counter: 1
}
const GameMode = {
  Normal: 0,
  Test: 1
}
const SpecialName = {
  Test: '!test!'
}
const BuffType = {
  Enchantment: 0,
  OnBeforeDamage: 1,
  OnBeforeDefend: 2,
  OnDealDamage: 3,
  OnDefend: 4,
  OnTime: 5
}
var buffTypeCount = 6
const BuffId = {
  //#region Enchantment
  //#endregion
  //#region OnBeforeDamage
  //#endregion
  //#region OnBeforeDefend
  //#endregion
  //#region OnDealDamage
  //#endregion
  //#region OnDefend
  //#endregion
  //#region OnTime
  Rapid: 0,
  Stun: 1,
  KnockUp: 2,
  Frozen: 3,
  //#endregion
}
var buffCount = 20
const playerString = ref("")
const identity = ref(null)
const sidepanel = ref('hsidepanel')
const mainpanel = ref('hmainpanel')
const gameMode = ref(GameMode.Normal)
var teams = new Array()
var rawPlayers = new Array()
var players = new Array()
var groups = new Array()
var aliveGroups = new Array()
var roundcnt = 0
var gameEnd = false
var mainPage = null
var autoScroll = false
//#region message receiver
onMounted(() => {
  mainPage = document.getElementById('mainPanel')
  window.addEventListener("message", (e) => {
    if (e.data.type == "rungame") {
      // console.log(e.data)
      playerString.value = e.data.msg
      identity.value = e.data.id
      gameMode.value = e.data.mode
    }
    if (e.data.type == "speedup") {
      // console.log(e.data)
      Renderer.FastMode()
    }
  })
  watch(identity, (msg) => {
    Run()
  })
})
//#endregion
//#region random
var SHA = {
  Get: function Get(raw) {
    let ret = sha512(raw)
    let seq = new Array()
    for (let i = 0; i < 128; i += 8) {
      seq.push(parseInt(ret.slice(i, i + 8), 16))
    }
    return seq
  },
  GetNext: function GetNext(num, t) {
    let ret = num
    for (let i = 1; i <= t; i++) {
      ret = (1664525 * ret + 1013904223) % (0x100000000)
    }
    return ret
  },
  GetRandom: function GetRandom(seq, x) {
    return this.GetNext(seq[x % 16], Math.floor(x / 16) + 1)
  },
  GetRandomSeq: function GetRandomSeq(seq, len = 256) {
    let ret = new Array()
    for (let i = 1; i <= len; i++) {
      ret.push(this.GetRandom(seq, i))
    }
    return ret
  }
}
//#endregion
//#region buff
function GetBuffList(o) {
  let list = new Array()
  let l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new EnchantmentBuff(0, o, true, j))
  }
  list.push(l)
  l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new OnBeforeDamageBuff(0, o, true, j))
  }
  list.push(l)
  l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new OnBeforeDefendBuff(0, o, true, j))
  }
  list.push(l)
  l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new OnDealDamageBuff(0, o, true, j))
  }
  list.push(l)
  l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new OnDefendBuff(0, o, true, j))
  }
  list.push(l)
  l = new Array()
  for (let j = 0; j < buffCount; j++) {
    l.push(new OnTimeBuff(0, o, true, j))
  }
  list.push(l)
  return list
}
// While creating new Buff, enum BuffId should be updated too
class Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    this.lastTime = _lastTime
    this.owner = _owner
    this.isPermanent = _isPermanent
    this.buffId = _buffid
  }
  Register() {}
  RegisterContent() {}
  Destroy() {}
  DestroyContent() {}
  Update(deltaTime) {
    if (!this.isPermanent) {
      if (this.lastTime > deltaTime) {
        this.lastTime -= deltaTime
      } else {
        this.lastTime = 0
        this.Destroy()
        this.DestroyContent()
      }
    }
  }
  Impact() {}
}
class EnchantmentBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.Enchantment
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new EnchantmentBuff(0, null, true)
  }
}
class OnBeforeDamageBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnBeforeDamage
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnBeforeDamageBuff(0, null, true)
  }
  Impact(dmg, target = null) { return dmg }
}
class OnBeforeDefendBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnBeforeDefend
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnBeforeDefendBuff(0, null, true)
  }
  Impact(dmg, Attacker = null) { return dmg }
}
class OnDealDamageBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnDealDamage
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnDealDamageBuff(0, null, true)
  }
  Impact(dmg, target = null) {}
}
class OnDefendBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnDefend
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnDefendBuff(0, null, true)
  }
  Impact(dmg, Attacker = null) {}
}
class OnTimeBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnTime
    this.impactFreq = _impactFreq
    this.currentTime = 0
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnTimeBuff(0, this.owner, true)
  }
  Impact(deltaTime) { return deltaTime }
}
class Rapid extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Rapid, _impactFreq)
    this.rate = _rate
    this.name = '敏捷'
  }
  RegisterContent() {
    Renderer.Print(Transfer('[0] 获得[敏捷]效果，速度提升了', this.owner), 300, true)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从[敏捷]中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return deltaTime * this.rate }
}
class Stun extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Stun, _impactFreq)
    this.name = '眩晕'
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] [眩晕]了', null, this.owner), 300, true)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从[眩晕]中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
class KnockUp extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.KnockUp, _impactFreq)
    this.name = '击飞'
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 被[击飞]了', null, this.owner), 300, true)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从[击飞]中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
class Frozen extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Frozen, _impactFreq)
    this.name = '冻结'
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 被[冻结]了', null, this.owner), 300, true)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从[冻结]中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
//#endregion
//#region skill
class Skill {
  constructor() {
    this.level = 1.0
    this.name = ''
  }
  Init(plr) {
    this.owner = plr
    this.level = 1.0 + plr.GetRand(100) / 100.0
  }
  SelectOneTarget() {
    return this.owner.SelectOneEnermy()
  }
  ValidTarget(target) {
    return true
  }
  SelectTargets() {
    let num = 1
    let targets = new Array()
    let count = 0, turns = 0
    while (count <= num && turns <= num * 2) {
      let newTarget = this.SelectOneTarget()
      if (targets.indexOf(newTarget) == -1) {
        if (this.ValidTarget(newTarget)) {
          targets.push(newTarget)
          count++;
        }
        turns++;
        continue;
      } else {
        turns++;
        continue;
      }
    }
    return targets
  }
  Intro() {
    Renderer.Print(T(`技能名：${this.name}`))
    Renderer.EndLine()
    Renderer.Print(T(`类型：${this.type}`))
    Renderer.EndLine()
    Renderer.Print(T(`等级： ${this.level}`))
    Renderer.EndLine()
  }
  Introduction() {}
}
class ActionSkill extends Skill {
  constructor() {
    super()
    this.isReady = false
    this.name = ''
    this.type = '主动技能'
  }
  Init(plr, _CD) {
    this.owner = plr
    this.level = plr.GetRand(100) + 1
    this.lvl = 0.75 + this.level / 400
    this.CD = this.lockCD ? this.CD : this.CD / this.lvl
    this.currentCD = (this.lvl / 1.25 - 0.6) * this.CD
  }
  InitActionSkl(_CD, _lockCD = false) {
    this.CD = _CD
    this.lockCD = _lockCD
  }
  Act(targets) {}
  CoolDownCondition() {
    return !this.isReady
  }
  CoolDown(time) {
    if (this.CoolDownCondition) {
      this.currentCD = this.currentCD + time < this.CD ? this.currentCD + time : this.CD
      this.isReady = this.currentCD >= this.CD
    }
  }
  Use(targets) {
    this.currentCD -= this.CD
    this.isReady = this.currentCD >= this.CD
    this.Act(targets)
  }
  Intro() {
    Renderer.Print(T(`技能名：${this.name}`))
    Renderer.EndLine()
    Renderer.Print(T(`类型：${this.type}`))
    Renderer.EndLine()
    Renderer.Print(T(`等级：${this.level}`))
    Renderer.EndLine()
    Renderer.Print(T(`冷却时间： ${Math.floor(this.CD / 10) / 100} 回合`))
    Renderer.EndLine()
  }
  Introduction() {}
}
class ComboSkill extends ActionSkill {
  constructor() {
    super()
    this.type = '组合技能'
    this.stage = 0
    this.targets = []
  }
  Use(targets) {
    if (this.stage == 0) {
      this.currentCD -= this.CD
      this.isReady = this.currentCD >= this.CD
    }
    this.Act(targets)
  }
  InterruptContent() {}
  Interrupt() {
    this.InterruptContent()
    this.owner.combo = null
    this.stage = 0
  }
}
class BasicAttack extends ActionSkill {
  constructor() {
    super()
    this.name = '普通攻击'
    this.type = '基础技能'
  }
  InitActionSkl(_CD, _lockCD = true) {
    this.CD = _CD
    this.lockCD = _lockCD
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 发动普通攻击，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('100%攻')]))
    Renderer.EndLine()
  }
}
class BasicSlash extends BasicAttack {
  constructor() {
    super()
    this.InitActionSkl(1000)
    this.name = '挥剑劈砍'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 挥剑劈砍，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('100%攻')]))
    Renderer.EndLine()
  }
}
class BasicMissle extends BasicAttack {
  constructor() {
    super()
    this.InitActionSkl(1000)
    this.name = '魔导飞弹'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.mag], target = targets[0]
    let dmg = target.CalcDamage([new MagicDamage(atp)])
    Renderer.Print(Transfer(`[0] 发射魔导飞弹，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Ranged)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new MagicDamage('100%魔')]))
    Renderer.EndLine()
  }
}
class MagicLaser extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(3000)
    this.name = '魔法激光'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.mag], target = targets[0]
    Renderer.Print(Transfer(`[0] 发射[魔法激光]，`, o), 500)
    let dmg = target.CalcDamage([new MagicDamage(atp * 0.6 + 100)])
    target.DealDamage(o, dmg, SourceType.Ranged)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new MagicDamage('60%魔+100')]))
    Renderer.EndLine()
  }
}
class Freeze extends ComboSkill {
  constructor() {
    super()
    this.InitActionSkl(3000)
    this.name = '冰封'
  }
  Act(targets) {
    if (this.stage == 0) {
      let o = this.owner
      this.targets = targets
      Renderer.Print(Transfer(`[0] 开始吟唱[冰封]术！`, o), 500)
      Renderer.EndLine()
      this.owner.combo = this
      this.stage++
    } else if (this.stage == 1) {
      let o = this.owner, stat = o.GetStat()
      let atp = stat[Stat.mag], target = this.targets[0]
      Renderer.Print(Transfer(`[0] 发动[冰封]术！`, o), 500)
      let dmg = target.CalcDamage([new MagicDamage(atp * 0.4)])
      target.DealDamage(o, dmg, SourceType.Ranged)
      target.UpdateBuff(new Frozen(2500, target))
      this.owner.combo = null
      this.stage = 0
    }
  }
  InterruptContent() {
    Renderer.Print(Transfer(`[0] 的吟唱被打断了！`, this.owner), 500)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并使对手[冻结]2.5回合", null, null, [new MagicDamage('40%魔')]))
    Renderer.EndLine()
  }
}
class RapidChant extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000, true)
    this.name = '快速吟唱'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    Renderer.Print(Transfer(`[0] 吟唱咒语[快速吟唱]，`, o), 500)
    Renderer.EndLine()
    let rate = 2.5 + (this.level - 1) / 200
    o.UpdateBuff(new Rapid(2000, o, rate))
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`效果：接下来一回合内行动速度变为 [${Math.ceil((2.5 + (this.level - 1) / 200) * 100)}%]`))
    Renderer.EndLine()
  }
}
class StormSlash extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(7000)
    this.name = '暴风斩'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk] * (1.2 * this.lvl), target = targets[0]
    Renderer.Print(Transfer(`[0] 发动[暴风斩]，`, o), 500)
    for (let i = 0; i < 5; i++) {
      if (!target.alive) break
      let dmg = target.CalcDamage([new PhysicalDamage(atp)])
      Renderer.Print(T(``))
      target.DealDamage(o, dmg, SourceType.Melee)
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：连续造成五次 [2] 点的物理伤害", null, null, [new PhysicalDamage(`${Math.floor((1.2 * this.lvl) * 100)}%攻`)]))
    Renderer.EndLine()
  }
}
class Knock extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000)
    this.name = '敲击'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    let dmg = 0.8 * target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 挥剑[敲击]，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee)
    target.UpdateBuff(new Stun(500, target))
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并使对手[眩晕]0.5回合", null, null, [new PhysicalDamage('80%攻')]))
    Renderer.EndLine()
  }
}
class SlashUp extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000)
    this.name = '上挑'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = 0.8 * stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 挥剑[上挑]，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee)
    target.UpdateBuff(new KnockUp(500, target))
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并使对手被[击飞]0.5回合", null, null, [new PhysicalDamage('80%攻')]))
    Renderer.EndLine()
  }
}
//#endregion
//#region damage
class Damage {
  constructor(_atp) {
    this.atp = _atp
  }
}
class PhysicalDamage extends Damage {
  constructor(_atp) {
    super(_atp)
    this.type = DamageType.Physical
    this.atp = _atp
  }
}
class MagicDamage extends Damage {
  constructor(_atp) {
    super(_atp)
    this.type = DamageType.Magic
    this.atp = _atp
  }
}
class TrueDamage extends Damage {
  constructor(_atp) {
    super(_atp)
    this.type = DamageType.True
    this.atp = _atp
  }
}
//#endregion
//#region profession
class Profession {
  constructor() {
    this.basicStats = [0, 0, 0, 0, 0, 0, 0]
    this.statsBoost = [[], [], [], [], [], [], []]
  }
  GetSkillList(owner) {}
  Intro() {
    Renderer.Print(T(`职业：${this.name}`))
    Renderer.EndLine()
    let str = ''
    str += `血量：[${this.basicStats[Stat.HP]}`
    for (let boost of this.statsBoost[Stat.HP]) {
      str += `+RD${boost}`
    }
    str += ']'
    str = T(str)
    Renderer.Print(str)
    Renderer.EndLine()
    str = ''
    str += ` 攻：[${this.basicStats[Stat.atk]}`
    for (let boost of this.statsBoost[Stat.atk]) {
      str += `+RD${boost}`
    }
    str += ']'
    str += ` 防：[${this.basicStats[Stat.def]}`
    for (let boost of this.statsBoost[Stat.def]) {
      str += `+RD${boost}`
    }
    str += ']'
    str += ` 魔：[${this.basicStats[Stat.mag]}`
    for (let boost of this.statsBoost[Stat.mag]) {
      str += `+RD${boost}`
    }
    str += ']'
    str = T(str)
    Renderer.Print(str)
    Renderer.EndLine()
    str = ''
    str += ` 抗：[${this.basicStats[Stat.res]}`
    for (let boost of this.statsBoost[Stat.res]) {
      str += `+RD${boost}`
    }
    str += ']'
    str += ` 速：[${this.basicStats[Stat.spd]}`
    for (let boost of this.statsBoost[Stat.spd]) {
      str += `+RD${boost}`
    }
    str += ']'
    str += ` 敏：[${this.basicStats[Stat.dex]}`
    for (let boost of this.statsBoost[Stat.dex]) {
      str += `+RD${boost}`
    }
    str += ']'
    str = T(str)
    Renderer.Print(str)
    Renderer.EndLine()
  }
  Introduction() {}
}
class BasicProfession extends Profession {
  constructor() {
    super()
    this.basicStats = [211, 40, 10, 32, 0, 64, 32]
    this.statsBoost = [[64, 64, 64], [30, 30], [20], [64], [20], [32], [64]]
    this.name = '白板'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicAttack())
    list = [tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：平平无奇的白板`))
    Renderer.EndLine()
  }
}
class Kight extends Profession {
  constructor() {
    super()
    this.basicStats = [380, 40, 10, 20, 0, 60, 30]
    this.statsBoost = [[60, 60], [30, 30], [5, 5], [10], [10], [30], [10]]
    this.name = '骑士'
    this.icon = 'kight'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicSlash())
    tier2.push(new Knock())
    tier2.push(new SlashUp())
    tier3.push(new StormSlash())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：忠诚的战士`))
    Renderer.EndLine()
  }
}
class Wizard extends Profession {
  constructor() {
    super()
    this.basicStats = [260, 10, 10, 60, 10, 40, 20]
    this.statsBoost = [[60], [20], [5], [30], [20], [20], [20]]
    this.name = '巫师'
    this.icon = 'wizard'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicMissle())
    tier1.push(new RapidChant())
    tier1.push(new MagicLaser())
    tier2.push(new Freeze())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：神秘的巫师`))
    Renderer.EndLine()
  }
}
function GetProfessionList() {
  var list = new Array()
  // list.push(new BasicProfession())
  list.push(new Kight())
  list.push(new Wizard())
  return list
}
//#endregion
//#region group
class Group {
  constructor(_id, _team) {
    this.id = _id
    this.team = _team
    this.members = new Array()
    this.membersDead = new Array()
    this.die = true
    this.clanName = ''
    this.clanIcon = ''
  }
  Update() {
    if (this.members.length != 0) {
      if (this.die == true) {
        if (aliveGroups.indexOf(this) == -1) {
          aliveGroups.push(this)
        }
        this.die = false
      }
    } else {
      if (this.die == false) {
        let pos = aliveGroups.indexOf(this)
        if (pos != -1) {
          aliveGroups.splice(pos, 1)
        }
        this.die = true
      }
    }
  }
  Add(plr) {
    // console.log(`adding ${plr.name}`)
    if (plr.type == CounterType.Counter) {
      this.counter = plr
      players.push(plr)
    } else {
      if (this.clanName == '') {
        this.clanName = plr.name
        this.clanIcon = IconCanvas.GetIcon(this.clanName)
      }
      let pos = players.indexOf(this.counter) + this.members.length + 1
      players.splice(pos, 0, plr)
      this.members.push(plr)
      rawPlayers.push(plr)
    }
    this.Update()
  }
  Die(plr) {
    let pos = this.members.indexOf(plr)
    this.members.splice(pos, 1)
    pos = players.indexOf(plr)
    players.splice(pos, 1)
    this.membersDead.push(plr)
    this.Update()
  }
}
//#endregion
//#region player
class Plr {
  constructor(_name, _team, _group, _type) {
    // console.log(`create Plr(${_name}, ${_team}, ${_group}, ${_type})`)
    this.name = _name;
    this.team = _team;
    this.attr = SHA.Get(_name);
    this.currentRand = 0;
    this.stat = [0, 0, 0, 0, 0, 0, 0];
    // D refers to Direct, F refers to Final
    this.statDPlus = [0, 0, 0, 0, 0, 0, 0];
    this.statDMult = [0, 0, 0, 0, 0, 0, 0];
    this.statFPlus = [0, 0, 0, 0, 0, 0, 0];
    this.statFMult = [0, 0, 0, 0, 0, 0, 0];
    this.health = 0;
    this.maxHealth = 0;
    this.renderHealth = 0;
    this.alive = _type == CounterType.Player ? true : false;
    this.renderAlive = _type == CounterType.Player ? true : false;
    this.passiveSkillList = new Array();
    this.actionSkillList = new Array();
    this.buffList = GetBuffList(this);
    this.SP = 0;
    this.group = _group;
    this.type = _type;
    this.damageDealt = [0, 0, 0];
    this.icon = '';
    this.combo = null;
  }
  GetRandom() {
    return SHA.GetRandom(this.attr, this.currentRand++);
  }
  GetRand(num) {
    return this.GetRandom() % num;
  }
  InitProfession() {
    let professionList = GetProfessionList();
    this.profession = professionList[this.GetRand(professionList.length)];
    this.icon = this.profession.icon
  }
  InitStat() {
    let p = this.profession;
    this.stat = new Array().concat(p.basicStats);
    for (let i in this.stat) {
      for (let j in p.statsBoost[i]) {
        this.stat[i] += this.GetRand(p.statsBoost[i][j] + 1);
      }
    }
    this.health = this.stat[Stat.HP];
    this.maxHealth = this.stat[Stat.HP];
    this.renderHealth = this.health;
  }
  InitSkills() {
    let p = this.profession;
    let list = p.GetSkillList();
    let last = new Array()
    // need improve
    for (let tier in list) {
      if (tier == 0) {
        for (let skl of list[tier]) {
          skl.Init(this);
          if (skl instanceof ActionSkill) {
            this.actionSkillList.push(skl);
          } else {
            this.passiveSkillList.push(skl);
          }
        }
      }
      else {
        let l = last.concat(list[tier])
        if (l.length > 0) {
          let skl = l[this.GetRand(l.length)]
          l.splice(l.indexOf(skl), 1)
          last = l
          skl.Init(this);
          if (skl instanceof ActionSkill) {
            this.actionSkillList.push(skl);
          } else {
            this.passiveSkillList.push(skl);
          }
        }
      }
    }
  }
  GetStat() {
    let ret = new Array();
    for (let i = 0; i < this.stat.length; i++) {
      ret.push(Math.floor(((this.stat[i] + this.statDPlus[i]) * (1 + this.statDMult[i]) + this.statFPlus[i]) * (1 + this.statFMult[i])));
    }
    ret.push(this.health);
    ret.push(this.maxHealth);
    return ret;
  }
  Die() {
    this.alive = false;
    this.group.Die(this);
  }
  SelectOneEnermy() {
    let g = this.group;
    let pos = this.GetRand(aliveGroups.length - 1);
    if (pos >= aliveGroups.indexOf(g)) {
      pos++;
    }
    let targetGroup = aliveGroups[pos];
    pos = this.GetRand(targetGroup.members.length);
    return targetGroup.members[pos];
  }
  CalcDamage(damage) {
    for (let i in damage) {
      if (damage[i].type == DamageType.Physical) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp - this.stat[Stat.def]), 1)
      }
      if (damage[i].type == DamageType.Magic) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp - this.stat[Stat.res]), 1)
      }
      if (damage[i].type == DamageType.True) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp), 1)
      }
    }
    return damage
  }
  DealDamage(source, damage, srcType) {
    if (!this.alive)
      return;
    let dex = this.GetStat()[Stat.dex];
    let str = this.GetStat()[Stat.atk];
    let dmg = new Array().concat(damage)
    for (let buff of source.buffList[BuffType.OnBeforeDamage]) {
      dmg = buff.Impact(dmg, this)
    }
    for (let buff of this.buffList[BuffType.OnBeforeDefend]) {
      dmg = buff.Impact(dmg, source)
    }
    for (let buff of source.buffList[BuffType.OnDealDamage]) {
      buff.Impact(dmg, this)
    }
    for (let buff of this.buffList[BuffType.OnDefend]) {
      buff.Impact(dmg, source)
    }
    let atp = 0
    for (let d of dmg) {
      atp += d.atp
    }
    if (atp > 0) {
      if (this.combo) {
        this.combo.Interrupt()
      }
      if (srcType == SourceType.Ranged && dex * dex > this.GetRand(36000)) {
        Renderer.Print(Transfer(`[1] [闪避]了此攻击`, null, this, [], this.health, this.health), 300, false, []);
      } else if (srcType == SourceType.Melee && dex * dex > this.GetRand(3000) && str * str > this.GetRand(20000)) {
        Renderer.Print(Transfer(`[1] [招架]了此攻击`, null, this, [], this.health, this.health), 300, false, []);
      } else {
        let oldhp = this.health;
        this.health = this.health - atp > 0 ? this.health - atp : 0;
        let hp = this.health;
        Renderer.Print(Transfer(`[1] 受到[2]点伤害`, null, this, dmg, oldhp, this.health), 300, false, [new RenderRequest(this, hp)]);
        if (this.health == 0) {
          Renderer.EndLine();
          Renderer.Print(T(''))
          Renderer.Print(Transfer(`[0]死亡`, this), 500);
          this.Die();
        }
        for (let d of dmg) {
          source.damageDealt[d.type] += d.atp
        }
      }
      Renderer.EndLine()
    }
  }
  Act() {
    let s = this.GetStat();
    let deltaTime = 100 + s[Stat.spd];
    let dTime = deltaTime
    let skls = new Array();
    for (let buff of this.buffList[BuffType.OnTime]) {
      deltaTime = buff.Impact(deltaTime)
    }
    for (let list of this.buffList) {
      for (let buff of list) {
        buff.Update(dTime)
      }
    }
    this.SP += deltaTime;
    for (let skl of this.actionSkillList) {
      skl.CoolDown(deltaTime);
    }
    // console.log(deltaTime)
    if (this.SP >= 1000) {
      if (this.combo != null) {
        let skl = this.combo;
        let targets = skl.SelectTargets();
        skl.Use(targets);
      } else {
        for (let skl of this.actionSkillList) {
          if (skl.isReady) {
            skls.push(skl);
          }
        }
        // console.log(this, skls)
        if (skls.length > 0) {
          let skl = skls[this.GetRand(skls.length)];
          // console.log(skls, skl)
          let targets = skl.SelectTargets();
          skl.Use(targets);
          // skl.Act(targets)
        }
      }
      this.SP -= 1000;
    }
  }
  AddBuff(buff) {
    this.buffList[buff.type][buff.buffId].Destroy()
    this.buffList[buff.type][buff.buffId] = buff
    buff.Register()
    buff.RegisterContent()
  }
  UpdateBuff(buff) {
    if (this.buffList[buff.type][buff.buffId].name != buff.name) {
      this.AddBuff(buff)
    } else {
      this.buffList[buff.type][buff.buffId].Destroy()
      this.buffList[buff.type][buff.buffId] = buff
      buff.Register()
    }
  }
  UpdateRenderHealth(hp) {
    this.renderHealth = hp;
    this.renderAlive = hp > 0;
  }
}
//#endregion
//#region fight
//#region init
function Reset() {
  Renderer.Reset()
  gameEnd = false
  teams = new Array()
  rawPlayers = new Array()
  players = new Array()
  groups = new Array()
  aliveGroups = new Array()
  roundcnt = 0
  autoScroll = false
}
function InitPlayers() {
  GetTeams()
  InitProfessions()
}
function GetTeams() {
  let plrs = playerString.value.split('\n')
  let curTeam = new Array()
  let teamId = 1
  let teamCount = 0
  let teamEmpty = true
  for (let i = 0; i < plrs.length; i++) {
    plrs[i] = plrs[i].replaceAll(' ', '')
    if (plrs[i] != '' && plrs.indexOf(plrs[i]) != i) {
      plrs.splice(i, 1)
      i--
    }
  }
  if (plrs[0] == SpecialName.Test) {
    plrs.splice(0, 1)
    gameMode.value = GameMode.Test
  }
  for (let i in plrs) {
    if (plrs[i] != '') {
      teamCount = teamId
      teamEmpty = false
    } else {
      if (!teamEmpty) {
        teamId++
      }
    }
  }
  if (teamCount == 1) {
    teamId = 1
    for (let i in plrs) {
      if (plrs[i] != '') {
        let newGroup = new Group(teamId, curTeam)
        groups.push(newGroup)
        newGroup.Add(new Plr(`Team ${teamId}`, curTeam, newGroup, CounterType.Counter))
        let newPlr = new Plr(plrs[i], curTeam, newGroup, CounterType.Player)
        curTeam.push(newPlr)
        teams.push(curTeam)
        teamId++
        newGroup.Add(newPlr)
        curTeam = new Array()
      }
    }
  }
  else {
    teamId = 1
    let newGroup = new Group(teamId, curTeam)
    groups.push(newGroup)
    newGroup.Add(new Plr(`Team ${teamId}`, curTeam, newGroup, CounterType.Counter))
    for (let i in plrs) {
      if (plrs[i] != '') {
        let newPlr = new Plr(plrs[i], curTeam, newGroup, CounterType.Player)
        curTeam.push(newPlr)
        newGroup.Add(newPlr)
      } else {
        if (curTeam.length != 0) {
          teams.push(curTeam)
          teamId++
          groups.push(newGroup)
          newGroup.Add(new Plr(`Team ${teamId}`, curTeam, newGroup, CounterType.Counter))
        }
        curTeam = new Array()
        newGroup = new Group(teamId, curTeam)
      }
    }
    if (curTeam.length != 0) {
      teams.push(curTeam)
    }
  }
  // console.log(rawPlayers)
  if (rawPlayers.length <= 1) {
    gameMode.value = GameMode.Test
  }
}
function InitProfessions() {
  for (let team of teams) {
    for (let plr of team) {
      plr.InitProfession()
      plr.InitStat()
      plr.InitSkills()
    }
  }
}
function ShowBasicStats() {
  let str = ""
  Renderer.Print(Render.Title1(`Namerena False魔改版`))
  Renderer.Print(Render.Title2(`(魔改自“名字竞技场”，原地址namerena.github.io)`), 0, true)
  // console.log(teams)
  for (let team of teams) {
    for (let plr of team) {
      str = `${Render.Player(plr)}  血量${plr.stat[Stat.HP]}  攻${plr.stat[Stat.atk]}  防${plr.stat[Stat.def]}  魔${plr.stat[Stat.mag]}  抗${plr.stat[Stat.res]}  速${plr.stat[Stat.spd]}  敏${plr.stat[Stat.dex]}`
      Renderer.Print(T(` `))
      Renderer.Print(str)
      Renderer.EndLine()
      // console.log(plr.name, plr.GetStat())
    }
  }
  Renderer.EmptyLine()
}
//#endregion
function NextRound() {
  roundcnt++
  // console.log(`Round ${roundcnt}`)
  // if (roundcnt >= 10) gameEnd = true
  // Renderer.Print(`<p>Round ${roundcnt} </p>`, 800)
  // if (!gameEnd && roundcnt <= 100) {
  //   NextRound();
  // }
  // console.log(players)
  // for (let plr of players) {
  //   console.log(plr.name, plr.alive)
  // }
  for (let plr of players) {
    if (plr.alive && !gameEnd) {
      plr.Act()
      RoundEnd()
    }
  }
  // if (roundcnt > 15) gameEnd = true
}
function RoundEnd() {
  if (aliveGroups.length <= 1) {
    console.log(`Game End!`)
    console.log(`The team left is`, aliveGroups)
    // console.log(groups)
    gameEnd = true;
  }
}
function Win(_team) {
  Renderer.EmptyLine()
  Renderer.Print(T('战斗结束'), 800, true, [])
  Renderer.EmptyLine()
  let str = '', final = ''
  str += Render.td(`胜者`, 'resultth')
  str += Render.td(`造成物理伤害`, 'resultth')
  str += Render.td(`造成魔法伤害`, 'resultth')
  str += Render.td(`造成真实伤害`, 'resultth')
  final += Render.tr(str, 'resulttr')
  str = ''
  for (let plr of _team) {
    str += Render.td(Render.PlayerForRender(plr, plr.health, plr.health), 'resulttd resultname')
    str += Render.td(Transfer(` [2] `, null, null, [new PhysicalDamage(plr.damageDealt[DamageType.Physical])]), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, [new MagicDamage(plr.damageDealt[DamageType.Magic])]), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, [new TrueDamage(plr.damageDealt[DamageType.True])]), 'resulttd')
    final += Render.tr(str, 'resulttr')
    str = ''
  }
  str += Render.td(`败者`, 'resultth')
  str += Render.td(`造成物理伤害`, 'resultth')
  str += Render.td(`造成魔法伤害`, 'resultth')
  str += Render.td(`造成真实伤害`, 'resultth')
  final += Render.tr(str, 'resulttr')
  str = ''
  for (let team of teams) {
    if (team == _team) continue
    for (let plr of team) {
      str += Render.td(Render.PlayerForRender(plr, plr.health, plr.health), 'resulttd resultname')
      str += Render.td(Transfer(` [2] `, null, null, [new PhysicalDamage(plr.damageDealt[DamageType.Physical])]), 'resulttd')
      str += Render.td(Transfer(` [2] `, null, null, [new MagicDamage(plr.damageDealt[DamageType.Magic])]), 'resulttd')
      str += Render.td(Transfer(` [2] `, null, null, [new TrueDamage(plr.damageDealt[DamageType.True])]), 'resulttd')
      final += Render.tr(str, 'resulttr')
      str = ''
    }
  }
  final = Render.table(final, 'resultchart', 0)
  Renderer.Print(final, 0, false, [])
  Renderer.EndLine()
}
function Test() {
  for (let plr of rawPlayers) {
    Renderer.Print(Render.Player(plr), 400, true)
    plr.profession.Introduction()
    Renderer.EmptyLine()
    for (let skl of plr.passiveSkillList) {
      skl.Introduction()
      Renderer.EmptyLine()
    }
    for (let skl of plr.actionSkillList) {
      skl.Introduction()
      Renderer.EmptyLine()
    }
    Renderer.EmptyLine()
  }
}
function Run() {
  Reset()
  InitPlayers()
  ShowBasicStats()
  Renderer.Run(identity.value)
  if (gameMode.value == GameMode.Normal) {
    while (!gameEnd) {
      NextRound()
    }
    Win(aliveGroups[0].team)
    Renderer.Close()
  } else if (gameMode.value == GameMode.Test) {
    Test()
    Renderer.Close()
  }
}
//#endregion
//#region output stream
const output = ref([""])
var Renderer = {
  historyLines: "",
  latestLine: "",
  outputStream: new Array(),
  wait: 1,
  delay: 100,
  renderHealthStream: new Array(),
  Reset: function() {
    this.historyLines = ""
    this.latestLine = ""
    this.outputStream = new Array()
    this.renderHealthStream = new Array()
    this.wait = 1
    this.delay = 100
    this.close = false
  },
  UpdateContent: function(id, content) {
    if (id != identity.value) return
    if (content.cmd == 'close') {
      this.close = true
      return
    }
    this.latestLine += content.str
    output.value = this.historyLines + Render.Row(this.latestLine)
  },
  Run: async function(id) {
    if (id != identity.value || this.close) return
    let scrollPos = mainPage.scrollTop + mainPage.clientHeight
    if (mainPage.scrollHeight - scrollPos < 100) {
      mainPage.scrollTop = mainPage.scrollHeight
    }
    let next = this.outputStream.shift()
    let healthChange = this.renderHealthStream.shift()
    // this.UpdateRenderHealth(healthChange)
    if (next == undefined) {
      setTimeout(() => {
        this.Run(id)
      }, this.delay)
    }
    else {
      if (next.delay != 0 || this.wait == 0) {
        setTimeout(() => {
          this.UpdateContent(id, next)
          this.End(next.end)
          this.Run(id)
          this.UpdateRenderHealth(healthChange)
        }, next.delay * this.wait)
      } else {
        this.UpdateContent(id, next)
        this.End(next.end)
        this.Run(id)
        this.UpdateRenderHealth(healthChange)
      }
    }
  },
  Print: function(_content, _delayTime = 0, end = false, healthUpdates = []) {
    this.outputStream.push({str: _content, delay: _delayTime, end:end, cmd:'print'})
    this.renderHealthStream.push(healthUpdates)
  },
  EndLine: function() {
    this.Print('', 0, true)
  },
  EmptyLine: function() {
    this.Print(`<br>`, 0, true)
  },
  End: function(end) {
    if (end) {
      this.historyLines += Render.Row(this.latestLine)
      this.latestLine = ''
    }
  },
  FastMode: function() {
    this.wait = 0
  },
  UpdateRenderHealth: function(healthChange) {
    if (healthChange instanceof Array) {
      for (let req of healthChange) {
        req.plr.UpdateRenderHealth(req.hp)
      }
    }
  },
  Close: function() {
    this.outputStream.push({str: '', delay: 0, end:false, cmd:'close'})
  }
}
class RenderRequest {
  constructor(_plr, _hp) {
    this.plr = _plr
    this.hp = _hp
  }
}
//#endregion
//#region HTML style transfer
var Render = {
  HPToWidth: function(hp) {
    return `${Math.ceil(hp/4)}px`
  },
  HealthBar: function(plr, oldhp, newhp) {
    let str = ''
    if (newhp > oldhp) {
      // recover
      str += `<span class="maxhp" style="width:${this.HPToWidth(plr.maxHealth)};">`
      str += `<span class="healhp" style="width:${this.HPToWidth(newhp)};"></span>`
      str += `<span class="hp" style="width:${this.HPToWidth(oldhp)};"></span>`
      str += `</span>`
    } else if (newhp == oldhp) {
      // pure bar
    } else if (newhp < oldhp) {
      // hurt
      str += `<span class="maxhp" style="width:${this.HPToWidth(plr.maxHealth)};">`
      str += `<span class="oldhp" style="width:${this.HPToWidth(oldhp)};"></span>`
      str += `<span class="hp" style="width:${this.HPToWidth(newhp)};"></span>`
      str += `</span>`
    }
    return str
  },
  HealthBarUnhidden: function(plr, oldhp, newhp) {
    let str = ''
    if (newhp > oldhp) {
      // recover
      str += `<span class="maxhp" style="width:${this.HPToWidth(plr.maxHealth)};">`
      str += `<span class="healhp" style="width:${this.HPToWidth(newhp)};"></span>`
      str += `<span class="hp" style="width:${this.HPToWidth(oldhp)};"></span>`
      str += `</span>`
    } else if (newhp == oldhp) {
      str += `<span class="maxhp" style="width:${this.HPToWidth(plr.maxHealth)};">`
      str += `<span class="hp" style="width:${this.HPToWidth(newhp)};"></span>`
      str += `</span>`
      // pure bar
    } else if (newhp < oldhp) {
      // hurt
      str += `<span class="maxhp" style="width:${this.HPToWidth(plr.maxHealth)};">`
      str += `<span class="oldhp" style="width:${this.HPToWidth(oldhp)};"></span>`
      str += `<span class="hp" style="width:${this.HPToWidth(newhp)};"></span>`
      str += `</span>`
    }
    return str
  },
  Name: function(name) {
    let str = ''
    str += `<span class="name">${name}</span>`
    return str
  },
  Icon: function(_class = '') {
    let str = ''
    str += `<span class="icon ${_class}"></span>`
    return str
  },
  Player: function(plr, oldhp = 0, newhp = 0) {
    let str = ''
    str += this.Icon(plr.group.clanIcon)
    str += this.Icon(plr.icon)
    str += this.HealthBar(plr, oldhp, newhp)
    str += this.Name(plr.name)
    return this.Span(str)
  },
  PlayerForRender: function(plr, oldhp = 0, newhp = 0) {
    let str = ''
    str += this.Icon(plr.group.clanIcon)
    str += this.Icon(plr.icon)
    str += this.HealthBarUnhidden(plr, oldhp, newhp)
    str += this.Name(plr.name)
    if (newhp == 0) {
      return this.Span(str, 'dead')
    }
    else {
      return this.Span(str)
    }
  },
  Damage: function(type, dmg) {
    let str = ''
    if (type == DamageType.Physical) {
      str += `<span class="physicaldamage">${dmg}</span>`
    } else if (type == DamageType.Magic) {
      str += `<span class="magicdamage">${dmg}</span>`
    } else if (type == DamageType.True) {
      str += `<span class="truedamage">${dmg}</span>`
    }
    return str
  },
  Row: function(str, _class = '') {
    // return `${str}`
    return `<p class="row">${str}</p>`
  },
  Span: function(str, _class = '') {
    return `<span class="u ${_class}">${str}</span>`
  },
  SText: function(str, _class = '') {
    return `<span class="stext">${str}</span>`
  },
  SSText: function(str, _class = '') {
    return `<span class="sstext">${str}</span>`
  },
  td: function(str, _class = '', _colspan = 1) {
    return `<td class="${_class}" colspan="${_colspan}">${str}</td>`
  },
  tr: function(str, _class = '') {
    return `<tr class="${_class}">${str}</tr>`
  },
  table: function(str, _class = '', _border = 1) {
    return `<table class="${_class}" border="${_border}px solid black">${str}</table>`
  },
  Title1: function(str, _class = '') {
    return `<span class="u title1 ${_class}">${str}</span>`
  },
  Title2: function(str, _class = '') {
    return `<span class="u title2 ${_class}">${str}</span>`
  }
}
function Transfer(_str, caster = null, target = null, dmg = [], oldhp = 0, newhp = 0) {
  let s = '', str = _str
  let reg = str.match(/\[.*?\]/g)
  for (let i in reg) {
    if (reg[i] == '[0]') {
      str = str.replace(reg[i], Render.Player(caster, oldhp, newhp))
    } else if (reg[i] == '[1]') {
      str = str.replace(reg[i], Render.Player(target, oldhp, newhp))
    } else if (reg[i] == '[2]') {
      let s = ''
      for (let i in dmg) {
        if (i != 0) {
          s += '+'
        }
        s += Render.Damage(dmg[i].type, dmg[i].atp)
      }
      str = str.replace(reg[i], s)
    } else {
      str = str.replace(reg[i], Render.SText(reg[i].slice(1, reg[i].length - 1)))
    }
  }
  s += `<span class="sentence">${str}</span>`
  return s
}
function T(str) {
  return Transfer(str)
}
window.onresize = () => {
  if (document.documentElement.clientWidth >= 500) {
    sidepanel.value = 'hsidepanel'
    mainpanel.value = 'hmainpanel'
  } else {
    sidepanel.value = 'vsidepanel'
    mainpanel.value = 'vmainpanel'
  }
}
//#endregion
//#region icon canvas
var IconCanvas = {
  Init: function() {
    this.cCount = this.sig_colors.length
    this.LoadPattern()
    this.Initcdif()
  },
  sig_colors: [
    [255, 255, 255],
    [255, 255, 255],
    [0, 0, 0],
    [0, 180, 0],
    [0, 255, 0],
    [255, 0, 0],
    [255, 192, 0],
    [255, 255, 0],
    [0, 224, 128],
    [255, 0, 128],
    [255, 108, 0],
    [0, 108, 255],
    [0, 192, 255],
    [0, 255, 255],
    [128, 120, 255],
    [128, 224, 255],
    [255, 0, 255],
    [40, 40, 255],
    [128, 0, 255],
    [0, 144, 0],
    [144, 0, 0],
  ],
  cdif: [],
  Initcdif: function Initcdif() {
    let dds = new Array(this.cCount)
    let sig_colors = this.sig_colors
    for (let i = 0; i < this.cCount; ++i) {
      dds[i] = new Array(this.cCount);
      dds[i][i] = 0.0;
    }
    for (let i = 1; i < this.cCount; ++i) {
      for (let j = 0; j < i; ++j) {
        let dr = (sig_colors[i][0] - sig_colors[j][0]) * 0.3;
        let dg = (sig_colors[i][1] - sig_colors[j][1]) * 0.4;
        let db = (sig_colors[i][2] - sig_colors[j][2]) * 0.25;
        let dl = (sig_colors[i][0] * 0.15 +
                sig_colors[i][0] * 0.25 +
                sig_colors[i][0] * 0.1) -
            (sig_colors[j][0] * 0.15 +
                sig_colors[j][0] * 0.25 +
                sig_colors[j][0] * 0.1);
        let d = Math.sqrt(dr * dr + dg * dg + db * db + dl * dl);
        dds[j][i] = d;
        dds[i][j] = d;
      }
    }
    this.cdif = dds;
  },
  cCount: 0,
  sigCount: 0,
  pattern: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACAAgMAAAC+UIlYAAAADFBMVEX/AAD/AP8A/wD///8SU+EWAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3wwaCg0BGtaVrQAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUHAAADHUlEQVRYw+2WPY6jMBTHLejhMNOu4BRkpTTp5xIgzQGmilKmSjFUkbZFCpp6tN3mHGikpAK8/r/nZwhxMlllViOtFsWxsX/2+7SNKj941E7r/lr5Q6BNuW5iqqtv3xLlBtKW67jpd3XY75SyAF4wAwMAwpqLAVgEADuDANOu4iahCQ7AIAaUSrBalbYEDCI+BESPiyJk0KukmCnlzMybHHVXLD4M9w35oIJC6R4FbVm6UNw2QB0UoQcIawGaoIg9QNwI0AZF6gHSVgAdFNoDmH4BXp88gOl7FeD92QOYvvcTYDBvAAE5ET4AYpySPgCKOjO9gDHVOcoLGGc5V3sB424XLC9gAvYZ+WAT1Joa0KahxEWWx/0AkKntAJhBQANApjYEcDZhx+kB2JKpdTQA2GEjoGLzEidCN0kVW4BmKCilegGedRttU0RTgBpKhQ544iC+DkADpWIHFJwGwQCY5SFGACwPMU5JUtAoKkDFZicjoI5gqjOTze5HAOeFA2r0hWOAM+tiLCQ3z2LxGedDnVSjnNwqFU3OKDho6KDTltu049SuhYtT3os4Bu0BKjuOrTCFdjPaOERHVinMxip0HsixPPKLYvmKTxS5M0aeVWxBnWzjJqrCOhks4B3nAAwCOgNEBJaXg4vFWBGiJBSUg4sVFSWtmc5UAGyqNdM6CsvKwWWdZR01cfXI3dbVk2BNA/Yp+WCX5TSPxncFiZAXB5ivALIGXwM+ALcuANQ/Ht5+ngHbsI4AoK7eHpKrK5zcmxd18FkhLicdrgGkw00ioOhVJcfA2Eynw6UVnA5j4CYzT4J1fz5cGnDfD38RkM+DLwTc7f/VwLXb/37g/nz4D/yTwEuWPWbmKTN6ynI5K7P5JkNZZtlMLbWe5Vp3m1x35jdfLg6zfL/q8l/fu4XWB7XW+ghgpQHoPTrzwwJtKoo6TGPNHUcZcIA0FlwfLgLTIitfBES3rwROlLQvh8VkkDyJP+PFPZy0niyPmly90XoON6/sLDuhWx8WRwrWS949IlAIGIK1ybs5grXer44U7pKjXdKfCTe9I9zzzew3hQ1VpfX/zmMAAAAASUVORK5CYII=',
  datas: new Array(),
  borders: new Array(),
  masks: new Array(),
  LoadPattern: function LoadPattern() {
    let img = new Image()
    img.src = this.pattern
    let canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    let ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)
    let bytes = ctx.getImageData(0, 0, 128, 128).data
    for (let i = 0; i < 38; ++i) {
      let xp = i % 8;
      let yp = Math.floor(i / 8);
      let startpos = xp * 64 + yp * 8192;
      let data = new Array();
      for (let y = 0; y < 16; ++y) {
        for (let x = 0; x < 16; ++x) {
          let cpos = startpos + x * 4 + y * 512;
          if (bytes[cpos] > bytes[cpos + 1]) {
          // red > green
            data.push(bytes[cpos]);
          } else {
            data.push(0);
          }
        }
      }
      this.datas.push(data);
    }
    // borders
    for (let i = 0; i < 8; ++i) {
      let startpos = i * 64 + 7 * 8192;
      let border = [];
      let mask = [];
      for (let y = 0; y < 16; ++y) for (let x = 0; x < 16; ++x) {
        let cpos = startpos + x * 4 + y * 512;
        if (bytes[cpos] > bytes[cpos + 1]) {
          // red > green
          border.push(bytes[cpos]);
        } else {
          border.push(0);
        }
        if (bytes[cpos + 1] > bytes[cpos + 2]) {
          // green > blue
          mask.push(255 - bytes[cpos + 1]);
        } else {
          mask.push(255);
        }
      }
      this.borders.push(border);
      this.masks.push(mask);
    }
  },
  drawShape: function drawShape(c, shapeData, color) {
    let shapeCanvas = document.createElement('canvas')
    shapeCanvas.width = 16
    shapeCanvas.height = 16
    let ctx = shapeCanvas.getContext("2d")
    let shapeImage = ctx.getImageData(0, 0, 16, 16)
    let dpos = 0;
    let ipos = 0;
    for (let y = 0; y < 16; ++y) for (let x = 0; x < 16; ++x) {
      if (shapeData[dpos] > 0) {
        shapeImage.data[ipos] = color[0];
        shapeImage.data[ipos + 1] = color[1];
        shapeImage.data[ipos + 2] = color[2];
        shapeImage.data[ipos + 3] = shapeData[dpos];
      } else {
        shapeImage.data[ipos + 3] = 0;
      }
      dpos++;
      ipos += 4;
    }

    ctx.putImageData(shapeImage, 0, 0);
    c.drawImage(shapeCanvas, 0, 0);
  },
  drawBorder: function drawBorder(c, b) {
    this.drawShape(c, this.borders[b], [64, 64, 64]);
    var img = c.getImageData(0, 0, 16, 16);
    let mask = this.masks[b];
    for (let i = 0; i < 256; ++i) {
      img.data[i * 4 + 3] = mask[i];
    }
    c.putImageData(img, 0, 0);
  },
  GetIcon: function(name) {
    let seq = SHA.Get(name)
    let colors = SHA.GetRandomSeq(seq)
    let borders = this.borders
    let datas = this.datas
    let canvas = document.createElement('canvas')
    canvas.width = 16
    canvas.height = 16
    let pos = 0;
    let borderStyle = colors[pos++] % borders.length;
    let shapeSorted = [];
    shapeSorted.push(colors[pos++] % datas.length);

    let shape2 = colors[pos++] % datas.length;
    if (shape2 == shapeSorted[0]) {
      // second shape should be different
      shape2 = colors[pos++] % datas.length;
    }
    shapeSorted.push(shape2);

    if (colors[pos++] < 4) {
      shapeSorted.push(colors[pos++] % datas.length);
      if (colors[pos++] < 64) {
        shapeSorted.push(colors[pos++] % datas.length);
      }
    }


    let ctx = canvas.getContext("2d");
    let brights = [];
    // drag bg
    let bgCIdx = colors[pos++] % (this.cCount-6);

    let bgColor = this.sig_colors[bgCIdx];
    ctx.fillStyle = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
    ctx.fillRect(0, 0, 16, 16);

    let usedColors = [];
    let validColor = (c) => {
      if (usedColors.length > 0 && c == bgCIdx && shapeSorted[0] != shapeSorted[1]) {
        return true;
      }
      if (this.cdif[c][bgCIdx] < 90.0) return false;
      for (let n in usedColors) {
        if (n == c) return true;
      }
      for (let n in usedColors) {
        if (this.cdif[c][n] < 90.0) return false;
      }
      return true;
    }
    for (let i = 0; i < shapeSorted.length; ++i) {
      let c = colors[pos++] % this.cCount;
      while (!validColor(c)) {
        c = colors[pos++] % this.cCount;
      }
      usedColors.push(c);
      this.drawShape(ctx, datas[shapeSorted[i]], this.sig_colors[c]);
    }
    this.drawBorder(ctx, borderStyle);
    this.loadCssCode(`.sig${++this.sigCount}{background-image: url("${canvas.toDataURL()}")}`);
    return `sig${this.sigCount}`;
  },
  loadCssCode: function loadCssCode(code){
    let style = document.createElement('style');
    let head = document.head || document.getElementsByTagName('head')[0]
    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = code
    } else {
      let textNode = document.createTextNode(code)
      style.appendChild(textNode)
    }
    head.appendChild(style);
  },
}
IconCanvas.Init()
// console.log(IconCanvas.GetIcon('1'))
//#endregion

</script>

<template>
  <div id="sidePanel" :class="sidepanel">
    <div class="plrlist" v-for="plr in rawPlayers" :style="{opacity: plr.renderAlive ? 1 : 0.5}">
      <div :class="`icon ${plr.group.clanIcon}`"></div>
      <div :class="`icon ${plr.icon}`"></div>
      <div class="name">{{ plr.name }}</div>
      <div class="maxhp" :style="{width: Render.HPToWidth(plr.maxHealth)}">
        <div class="oldhp" :style="{width: Render.HPToWidth(plr.renderHealth)}"></div>
        <div class="hp" :style="{width: Render.HPToWidth(plr.renderHealth)}"></div>
      </div>
    </div>
  </div>
  <div id="mainPanel" :class="mainpanel">
    <div v-html="output" class="maincontent"></div>
  </div>
</template>

<style>
#app {
  margin: 0;
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}
body {
  font-size: 15px;
  line-height: 16px;
}
div {
  display: inline-block;
  box-sizing: border-box;
}
p {
  display: block;
}
span {
  display: inline-block;
  box-sizing: border-box;
}
.plrlist {
  position: relative;
  display: block;
  padding-top: 0px;
  padding-bottom: 0px;
  margin-top: 12px;
  margin-bottom: 12px;
}
.row {
  margin: 0;
  line-height: 24px;
}
.hsidepanel {
  background-color: #fbfbfb;
  position: absolute;
  left: 0;
  width: 200px;
  height: 100%;
  padding: 2px;
  border-right-color: blueviolet;
  border-right-width: 2px;
  border-right-style: solid;
  overflow: auto;
}
.vsidepanel {
  display: none;
}
.hmainpanel {
  position: absolute;
  left: 200px;
  width: calc(100% - 200px);
  height: 100%;
  overflow: auto;
}
.vmainpanel {
  position: absolute;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
}
.title1 {
  font-size: larger;
  line-height: 40px;
  margin: 8px;
}
.title2 {
  line-height: 40px;
  margin: 8px;
}
.maincontent {
  position: absolute;
}
.sentence {
  line-height: 14px;
}
.name {
  margin: 0 2px;
  padding: 2px;
  background: #f3f3f8;
}
.u {
  position: relative;
}
.maxhp{
 background: #ddddd0;
 height:2px;
 position: absolute;
 left: 18px;
 top: 0;
}
.oldhp{
 background: #f66;
 height:2px;
 position: absolute;
 transition: width 0.5s ease-in 1s;
}
.hp{
 background: #4c4;
 height:2px;
 position: absolute;
 transition: width 1s;
}
.healhp{
 background: #08f;
 height:2px;
 position: absolute;
}
.icon {
  margin-left: 2px;
  position: relative;
  width: 16px;
  height: 16px;
  vertical-align: middle;
  image-rendering: pixelated;
}
.wizard {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABT0lEQVQ4jZ2TMUrEUBCGv8lmlZDEgMKaM1gIgthuUthl9wgWFop3sBSLPYEHsBRsAh7ACygGwUIEt1eIiG7QjMWakCy7MTjw4DGP+ef//5knqkrbEBEFUFUpcuZ/CkVEi7vRthgou6qqFPlGgHnFM+/tJMz69AvcLEFENIqiRYDtTBSZy7zGai4DEdHBYNCEXcZCCaqKqhIEQdXMvwFERG+u9smNTisGoqq1DvH2HY8ft2y6IS+dN57Sa+zM5+hhUDOvZCAiGgQBw+EQgOetY9w1h+7eLvH3COtrlU/znbONC0REi1MAmACu65LnOQAJ6xwcnnB6ucPHyivnMmJp2aBrdOEe+v0+IlKuswAahiG2bdPr9UiSBN/3ybIM0zRJ05TJZIJlWQA4jjOVGsfTla56EEVROV/P8/A8j/F4XNMcxzFQ+VjVNW0aVxGzRv4As9aJ98QfgFgAAAAASUVORK5CYII=');
}
.kight {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABw0lEQVQ4jZXTT0gUURzA8e8bZ9pdszIPYhuVZIctT0JeMyG8pHso0g5hhw4FFgYFXcRLatFBUlgsCMwOeuhgh+gWUQgdCm/pIWu71app+6eZ2dl5+/Ngf6R2a/Z7e/Deh/d+8JTtfpfP6zl+pA421FNJxuDwta1rqeg0YORyNg8nb6MdGwxIplYqQoyJ0SmltebRzBiFbAZT51haXg6MGADDA2MKYPrxBK5TwNJ5PgZElMjvfYMj/aKU4sLZS0iVhY/QtP+QCgwA3BrolYIV4kxnFyLC9updHDhyvCzyFwBw53qXuDvqOX2yE9E+5rYQsZZ4SaQkAHC375j4ZoQT3b34+Qw1u/cCqFhLHIDFvrAk08XNIZbqauKV0m6G59P3kKKHZ2fx7KwADMVrJZkuApQHAG7cf60cx2FuZop8JoXz8i2z56KCNqmpizH+xij/hK0NXWyTfQsr7Hm/RtWpAl8di+7JL+qfM/izJz1RqU1lWair5umnNM/mXfXfJ/xs9nxUJAwNzQ6H2/M0H23lwUiPBAIWL5sS0qu8W/WIJXzVfuWbClsmH5IpOhojYga5wfz6TuaWfn15biZeqI7GiHgYbABWOsDpxyBAewAAAABJRU5ErkJggg==');
}
.row {
  display: block;
  padding-left: 16px;
}
.row>*:first-child {
  position: relative;
  left: -8px;
}
.stext {
  color: #08f;
}
.sstext {
  color: rgb(2, 109, 202);
}
.physicaldamage {
  color: chocolate;
}
.magicdamage {
  color: blueviolet;
}
.truedamage {
  color: red;
  text-shadow: 1px 1px 0.3px rgb(139, 139, 139);
}
.resultchart {
  border-collapse: collapse;
  text-align: center;
}
.resulttr {

}
.resultth {
  background-color: #fafafa;
  height: 24px;
  width: 120px;
  border-width: 2px;
  border-style: none;
  border-color: #eeeeee;
  border-top-style: solid;
}
.resulttd {
  height: 30px;
  width: 120px;
  border-width: 2px;
  border-style: none;
  border-color: #eeeeee;
  border-top-style: solid;
}
.resultname {
  text-align: left;
  padding-left: 8px;
}
.dead {
  opacity: 0.5;
}
</style>