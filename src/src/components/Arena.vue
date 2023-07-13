<script setup>
import { computed } from '@vue/reactivity';
import sha512, { sha512_224 } from 'js-sha512'
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
const GameMode = {
  Normal: 0,
  Test: 1,
  WinRate: 2,
}
const SpecialName = {
  Test: '!test!',
  WinRate: "!rate!", 
  SuperStats: "!@!", 
  SetSeed: "seed:",
}
const BuffType = {
  Enchantment: 0,
  OnBeforeDamage: 1,
  OnBeforeDefend: 2,
  OnDealDamage: 3,
  OnDefend: 4,
  OnTime: 5
}
const SelectMethod = {
  Forward: 0,
  Backward: 1,
  All: 2,
}
var buffTypeCount = 6
const BuffId = {
  //#region Enchantment
  KnightSpirit: 0,
  OnFire: 1,
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
  Poison: 4,
  //#endregion
}
var buffCount = 20
const BuffIconUrl = {
  Rapid: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAHJJREFUOI3NkrENwDAIBD+SV/EI3n+AjJBVLOEKCQif4Cqh5p4zBvi6jo1eybhWBHBeEwAwukdYgCigFUEWIGwaM7A7cFNHbyAWbm+pl4WZ+mOABaNVOYCAt29/NdAw9pSYKNqcGKRHVzJgMCtBuMJ/1wJMgy2ZgoWJ8QAAAABJRU5ErkJggg==",
  Stun: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAGxJREFUOI2VkkESwCAIA0vH/3+ZXiqjmATMEcIaRXuwnNSN1LdBNqzAdZP5xlI0ZvpF42czS+LMQxsCEr63MKttuALMNwkjk0qwnnYNKE+eGqKHIDBNd43SgyAIdNTz78sRW1eQ0SohYgcScx9DYSL+zKlq8QAAAABJRU5ErkJggg==",
  KnockUp: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAIJJREFUOI1jYBhowEiC2v/Y9LIQqzF5NkT/j8uPGJZOkodL4jMARSMMcOjKofBxGfA/Ou8hhmJsgAmXxNJJ8gw/Lj9i+HH5EVkGMDIwMDAi+xUG0A3E6QJsAD0AYTbhAijhgKQZRQ8uA4jSjMsAojVjE/yPI8Hg9CqyBHpSxatx8AAArtg6GyvXzVYAAAAASUVORK5CYII=",
  Frozen: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAHBJREFUOI1jYKAlOH37z39CapgIaU6e/R+vIVgNQLcZnyEYBuByNi5DUAzA5+cMh79Y5RmRNc84wAxXjA4mTH7KwMDAwMChK8cwN5URro8Fm23IBsE04gI4Y4FYMIgMMFVlYcQWeMgAPQCp64KhawAAxdUy4FDwpbYAAAAASUVORK5CYII=",
  KnightSpirit: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAZhJREFUOI29k7FrU1EUxn/nvpe8+uwo1pglcXAQpdaCrUP/hm7SwX+gQ4IgiENLG8RBCGRTcFDIJDg5tdCpq4OguKaWNM+2BmlCRclL7j0OwdDXJLQunvHwfb/7ncO58L/q8M5d3Z29p6f7ch7z1pU5dcDtjMFay9XPHwY+c5Z5M9M3eyJ8OfDAS1rGJjj+OKmTF0PwPeKfvwmmWyO1I5uVSkXz+TzWWqL9Bo1mExHh+frTIf3QCNVqVcMwpF6v860RcfPGLQCcczxeWxlaYgJQLpe13W4TxzEAR84jk36GiCDSf/w0JBHp19trCqDa14goXbqkCFDVASRc2hn4/JOANz8e0el0ePl6E8Vy2EwxfT0m+m4JJkKM8bm/OAusMxJgrSUIAh4uL9JzHV682qDZ8niwNI8hxcl0I3cgIuRyOZxzCbGR8feWABQKBanVavR6PdLpCYwxZLMZnCrv3n8i5V+gVCrJWABAsVgU3/f5urOHqhJF+wAct45YWX1y9h38TTJ1+RILM1kWZrLYLuztbp/r3/xz/QEaBZatLVh+fwAAAABJRU5ErkJggg==",
  OnFire: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAJlJREFUOI2Vk7ENgDAMBJ+IMgUDMAUMwBLsg9iHJRgApmCAFPRQRTKOPyQu7dz/W3KAgtqG4WGzpgaezzN5nxWwnLWIq4GtMhP8wTJFksCCx+mmYnSFHCxNHBtomKWgCSxA9qLZ7woA0K8dnbVaUTrlwFg0gYaZWNEKVsVbcLoBAMfucS3hA1xLwLH7RCi5xJITlmbVp6w/0wsenDq/mhNLnwAAAABJRU5ErkJggg==",
  Poison: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAI9JREFUOI1jZMABvDP1/yPzt06/yIhNHYYgukZ0gG4QCoeQZmyGwBnEakY3hBGXZr8aRRT+ppb7WA1hwmY6umZcYgwMDAyM6Lb71SjCbYNpQuajuwSrC0gBLNgE0Z2Ly/lYXYAtsPDJMWFLYTCF6DQ6wBkLpACiExJ6DKAkJGINQdeMYQAxhuDNTPgMwpWdARibR0zgyVhuAAAAAElFTkSuQmCC",
}
const sideKey = ref(0)
const playerString = ref("")
const identity = ref(null)
const sidepanel = ref('hsidepanel')
const mainpanel = ref('hmainpanel')
const gameMode = ref(GameMode.Normal)
var rawPlayers = new Array()
var players = new Array()
var groups = new Array()
var aliveGroups = new Array()
var roundcnt = 0
var gameEnd = false
var mainPage = null
var autoScroll = false
var inputString = ""
var seed = ""
var superStats = false
var namesExisted = new Array()
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
var BuffIconMananger = {
  alreadyInit: function() {
    let ret = new Array();
    for (let i = 0; i < buffTypeCount; i++) {
      ret.push(new Array(buffCount).fill(false))
    }
    return ret;
  }(),
  Reset: function Reset() {
    for (let li of this.alreadyInit) {
      for (let i in li) {
        li[i] = false
      }
    }
  },
  Init: function Init(_type, _id, _class, _url) {
    if (this.alreadyInit[_type][_id]) {
      return
    }
    this.alreadyInit[_type][_id] = true
    CssStyle.AddBackground(_class, _url)
  }
}

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
    this.icon = `buff${_buffid}`
    this.name = 'empty'
  }
  InitIcon(buffId, imageUrl) {
    CssStyle.AddBackground(`buff${buffId}`, imageUrl);
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
  UpdateOld(oldBuff) {}
  Impact() {}
}
class EnchantmentBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.Enchantment
    this.icon = `eb${_buffid}`
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `eb${buffId}`, imageUrl);
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new EnchantmentBuff(0, this.owner, true)
  }
}
class OnBeforeDamageBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnBeforeDamage
    this.icon = `obdmgb${_buffid}`
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `obdmgb${buffId}`, imageUrl);
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnBeforeDamageBuff(0, this.owner, true)
  }
  Impact(dmg, target = null) { return dmg }
}
class OnBeforeDefendBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnBeforeDefend
    this.icon = `obdfdb${_buffid}`
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `obdfdb${buffId}`, imageUrl);
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnBeforeDefendBuff(0, this.owner, true)
  }
  Impact(dmg, Attacker = null) { return dmg }
}
class OnDealDamageBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnDealDamage
    this.icon = `oddmgb${_buffid}`
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `oddmgb${buffId}`, imageUrl);
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnDealDamageBuff(0, this.owner, true)
  }
  Impact(dmg, target = null) {}
}
class OnDefendBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnDefend
    this.icon = `odfdb${_buffid}`
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `odfdb${buffId}`, imageUrl);
  }
  Destroy() {
    this.owner.buffList[this.type][this.buffId] = new OnDefendBuff(0, this.owner, true)
  }
  Impact(dmg, Attacker = null) {}
}
class OnTimeBuff extends Buff {
  constructor(_lastTime, _owner, _isPermanent = false, _buffid = undefined, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, _buffid)
    this.type = BuffType.OnTime
    this.icon = `otb${_buffid}`
    this.impactFreq = _impactFreq
    this.currentTime = 0
  }
  InitIcon(buffId, imageUrl) {
    BuffIconMananger.Init(this.type, this.buffId, `otb${buffId}`, imageUrl);
  }
  Destroy() {
    // console.log(this.owner.name, this.name)
    this.owner.buffList[this.type][this.buffId] = new OnTimeBuff(0, this.owner, true)
  }
  Impact(deltaTime) { return deltaTime }
}
class Rapid extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Rapid, _impactFreq)
    this.rate = _rate
    this.name = '敏捷'
    this.InitIcon(BuffId.Rapid, BuffIconUrl.Rapid)
  }
  RegisterContent() {
    Renderer.Print(Transfer('[0] 获得[敏捷]效果，速度提升了', this.owner), 300, true)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从[敏捷]中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return deltaTime * this.rate }
}
class KnightSpiritBuff extends EnchantmentBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false) {
    super(_lastTime, _owner, _isPermanent, BuffId.KnightSpirit)
    this.rate = _rate
    this.name = '骑士精神'
    this.InitIcon(BuffId.KnightSpirit, BuffIconUrl.KnightSpirit)
  }
  Register() {
    this.owner.statDMult[Stat.atk] += this.rate
    this.owner.statFPlus[Stat.def] += 20
  }
  Destroy() {
    this.owner.statDMult[Stat.atk] -= this.rate
    this.owner.statFPlus[Stat.def] -= 20
    this.owner.buffList[this.type][this.buffId] = new EnchantmentBuff(0, this.owner, true)
  }
}
class OnFire extends EnchantmentBuff {
  constructor(_lastTime, _owner, _isPermanent = false) {
    super(_lastTime, _owner, _isPermanent, BuffId.OnFire)
    this.name = '燃烧'
    this.counter = 0
    this.InitIcon(BuffId.OnFire, BuffIconUrl.OnFire)
  }
  Register() {
    this.counter++
  }
  UpdateOld(oldBuff) {
    this.counter += oldBuff.counter
  }
  Destroy() {
    this.counter = 0
    this.owner.buffList[this.type][this.buffId] = new EnchantmentBuff(0, this.owner, true)
  }
}
class Stun extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Stun, _impactFreq)
    this.name = '眩晕'
    this.InitIcon(BuffId.Stun, BuffIconUrl.Stun)
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 眩晕了！', null, this.owner), 300)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从眩晕中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
class KnockUp extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.KnockUp, _impactFreq)
    this.name = '击飞'
    this.InitIcon(BuffId.KnockUp, BuffIconUrl.KnockUp)
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 被击飞了！', null, this.owner), 300)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从击飞中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
class Frozen extends OnTimeBuff {
  constructor(_lastTime, _owner, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Frozen, _impactFreq)
    this.name = '冻结'
    this.InitIcon(BuffId.Frozen, BuffIconUrl.Frozen)
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 被冻结了！', null, this.owner), 300)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从冻结中解除', this.owner), 300, true)
  }
  Impact(deltaTime) { return 0 }
}
class Poison extends OnTimeBuff {
  constructor(_lastTime, _owner, _dealer, _rate, _isPermanent = false, _impactFreq = null) {
    super(_lastTime, _owner, _isPermanent, BuffId.Poison, _impactFreq)
    this.name = '中毒'
    this.rate = Math.floor(_rate)
    this.dealer = _dealer
    this.InitIcon(BuffId.Poison, BuffIconUrl.Poison)
  }
  RegisterContent() {
    Renderer.Print(Transfer('[1] 中毒了！', null, this.owner), 500)
  }
  DestroyContent() {
    Renderer.Print(Transfer('[0] 从中毒中解除', this.owner), 500, true)
  }
  Register() {
    this.currentTime = 0
  }
  UpdateOld(oldBuff) {
    this.rate += oldBuff.rate
  }
  Impact(deltaTime) {
    this.currentTime += deltaTime
    if(this.currentTime >= this.impactFreq) {
      this.currentTime -= this.impactFreq
      Renderer.Print(Transfer("[1] 毒性发作，", null, this.owner), 500)
      this.owner.DealDamage(this.dealer, [new MagicDamage(this.rate)], DamageType.Ranged, false)
      Renderer.EndLine()
    }
    return deltaTime 
  }
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
    return this.owner.SelectOneEnermy(SelectMethod.Forward)
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
    this.currentCD = (this.lvl / 1.25 - 0.4) * this.CD
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
    Renderer.EndLine()
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
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('100%攻')]))
    Renderer.EndLine()
  }
}
class BasicSlashCrit extends BasicAttack {
  constructor() {
    super()
    this.InitActionSkl(1000)
    this.name = '挥剑劈砍(20%暴击率)'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    if (o.GetRand(100) > 80) {
      let dmg = target.CalcDamage([new PhysicalDamage(atp * 1.5)])
      Renderer.Print(Transfer(`[0] 发动[会心一击]，`, o), 500)
      target.DealDamage(o, dmg, SourceType.Melee)
      Renderer.EndLine()
    } else {
      let dmg = target.CalcDamage([new PhysicalDamage(atp)])
      Renderer.Print(Transfer(`[0] 挥剑劈砍，`, o), 500)
      target.DealDamage(o, dmg, SourceType.Melee)
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，", null, null, [new PhysicalDamage('100%攻')]))
    Renderer.Print(Transfer("有概率发动 [会心一击] 造成 [2] 点伤害，", null, null, [new PhysicalDamage('150%攻')]))
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
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new MagicDamage('100%魔')]))
    Renderer.EndLine()
  }
}
class BasicArrow extends BasicAttack {
  constructor() {
    super()
    this.InitActionSkl(1000)
    this.name = '飞箭'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 射出一道箭矢，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Ranged)
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('100%攻')]))
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
    let dmg = target.CalcDamage([new MagicDamage(atp * 0.7 + 40)])
    target.DealDamage(o, dmg, SourceType.Ranged, false)
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new MagicDamage('70%魔+40')]))
    Renderer.EndLine()
  }
}
class DualArrow extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(1500)
    this.name = '二连射'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], target = targets[0]
    Renderer.Print(Transfer(`[0] 瞄准目标发动[二连射]，`, o), 500)
    Renderer.EndLine()
    Renderer.Print(T(` `))
    let dmg = target.CalcDamage([new PhysicalDamage(atp * 0.8)])
    target.DealDamage(o, dmg, SourceType.Ranged, false)
    Renderer.EndLine()
    if (target.alive) {
      Renderer.Print(T(` `))
      dmg = target.CalcDamage([new PhysicalDamage(atp * 0.6)])
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，", null, null, [new PhysicalDamage('80%攻')]))
    Renderer.Print(Transfer("再造成 [2] 点伤害", null, null, [new PhysicalDamage('60%攻')]))
    Renderer.EndLine()
  }
}
class PoisonousArrow extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000)
    this.name = '涂毒箭矢'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], mag = stat[Stat.mag], target = targets[0]
    Renderer.Print(Transfer(`[0] 瞄准目标发射[涂毒箭矢]，`, o), 500)
    let dmg = target.CalcDamage([new PhysicalDamage(atp * 0.5)])
    target.DealDamage(o, dmg, SourceType.Ranged, false)
    Renderer.Comma()
    target.UpdateBuff(new Poison(1500, target, o, 25 + mag * 0.2, false, 500))
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并使目标中毒", null, null, [new PhysicalDamage('50%攻')]))
    Renderer.Print(Transfer("（每0.5回合受到 [2] 点伤害", null, null, [new MagicDamage('25 + 20%魔')]))
    Renderer.EndLine()
  }
}
class FireBall extends ComboSkill {
  constructor() {
    super()
    this.InitActionSkl(1500)
    this.name = '火球术'
  }
  Act(targets) {
    if (this.stage == 0) {
      let o = this.owner
      this.targets = targets
      Renderer.Print(Transfer(`[0] 开始吟唱[火球]术`, o), 500)
      Renderer.EndLine()
      this.owner.combo = this
      this.stage++
    } else if (this.stage == 1) {
      let o = this.owner, stat = o.GetStat()
      if (!this.targets[0].alive) {
        Renderer.Print(Transfer(`[0] 丢失了目标！`, o), 500, true)
        o.SP += 1000
        Renderer.EndLine()
        this.owner.combo = null
        this.stage = 0
        return
      }
      let atp = stat[Stat.mag], target = this.targets[0]
      let buf = target.buffList[BuffType.Enchantment][BuffId.OnFire].counter
      // console.log(buf)
      buf = typeof buf === "number" ? buf : 0
      let dmg = target.CalcDamage([new MagicDamage(atp * 0.6 + 90 + buf * 10)])
      Renderer.Print(Transfer(`[0] 发动[火球]术！，`, o), 500)
      target.UpdateBuff(new OnFire(1000, target, true))
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      Renderer.EndLine()
      this.owner.combo = null
      this.stage = 0
    }
  }
  InterruptContent() {
    Renderer.Print(Transfer(`[0] 的吟唱被打断了！`, this.owner), 500)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并对对手附加一层火焰", null, null, [new MagicDamage('60%魔+90+10*火焰层数')]))
    Renderer.EndLine()
  }
}
class Ignite extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(1900)
    this.name = '引燃'
  }
  SelectTargets() {
    let num = 4
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
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atk = stat[Stat.atk], mag = stat[Stat.mag]
    Renderer.Print(Transfer(`[0] [引燃]对手，`, o), 500, true)
    for (let target of targets) {
      let dmg = target.CalcDamage([new MagicDamage(mag * 0.4)])
      target.UpdateBuff(new OnFire(1000, target, true))
      Renderer.Print(T(` `))
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：对至多4名对手造成 [2] 点伤害，并分别对其附加一层火焰", null, null, [new MagicDamage('40%魔')]))
    Renderer.EndLine()
  }
}
class Detonate extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000)
    this.name = '引爆'
  }
  SelectTargets() {
    let num = 3
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
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atk = stat[Stat.atk], mag = stat[Stat.mag]
    Renderer.Print(Transfer(`[0] [引爆]对手，`, o), 500, true)
    for (let target of targets) {
      let buf = target.buffList[BuffType.Enchantment][BuffId.OnFire].counter
      buf = typeof buf === "number" ? buf : 0
      let dmg = target.CalcDamage([new MagicDamage(mag * 0.25 + buf * 110)])
      Renderer.Print(T(``))
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      target.buffList[BuffType.Enchantment][BuffId.OnFire].Destroy()
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：引爆至多6名对手，造成 [2] 点伤害，并移除其附加的火焰层数", null, null, [new MagicDamage('25%魔+火焰层数*110')]))
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
      Renderer.Print(Transfer(`[0] 开始吟唱[冰封]术`, o), 500)
      Renderer.EndLine()
      this.owner.combo = this
      this.stage++
    } else if (this.stage == 1) {
      let o = this.owner, stat = o.GetStat()
      if (!this.targets[0].alive) {
        Renderer.Print(Transfer(`[0] 丢失了目标！`, o), 500, true)
        o.SP += 1000
        this.owner.combo = null
        this.stage = 0
        return
      }
      let atp = stat[Stat.mag], target = this.targets[0]
      Renderer.Print(Transfer(`[0] 发动[冰封]术！`, o), 500)
      let dmg = target.CalcDamage([new MagicDamage(atp * 0.4)])
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      Renderer.Comma()
      target.UpdateBuff(new Frozen(2500, target))
      Renderer.EndLine()
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
class HeavyShot extends ComboSkill {
  constructor() {
    super()
    this.InitActionSkl(3000)
    this.name = '重击'
  }
  Act(targets) {
    if (this.stage == 0) {
      let o = this.owner
      this.targets = targets
      Renderer.Print(Transfer(`[0] 瞄准 [1]`, o, targets[0]), 500)
      Renderer.EndLine()
      this.owner.combo = this
      this.stage++
    } else if (this.stage == 1) {
      let o = this.owner, stat = o.GetStat()
      if (!this.targets[0].alive) {
        Renderer.Print(Transfer(`[0] 丢失了目标！`, o), 500, true)
        Renderer.EndLine()
        o.SP += 1000
        this.owner.combo = null
        this.stage = 0
        return
      }
      let atk = stat[Stat.atk], target = this.targets[0]
      Renderer.Print(Transfer(`[0] 发动[强力射击]！ `, o), 500)
      let dmg = target.CalcDamage([new PhysicalDamage(atk * 2.2)])
      target.DealDamage(o, dmg, SourceType.Ranged, false)
      Renderer.EndLine()
      this.owner.combo = null
      this.stage = 0
    }
  }
  InterruptContent() {
    Renderer.Print(Transfer(`[0] 的瞄准被打断了！`, this.owner), 500)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('220%攻')]))
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
    let rate = 2.5 + (this.level - 1) / 200
    o.UpdateBuff(new Rapid(2000, o, rate))
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`效果：接下来一回合内行动速度变为 [${Math.ceil((2.5 + (this.level - 1) / 200) * 100)}%]`))
    Renderer.EndLine()
  }
}
class RapidLoad extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000, true)
    this.name = '快速装填'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    Renderer.Print(Transfer(`[0] 发动[快速装填]，`, o), 500)
    let rate = 2.5 + (this.level - 1) / 200
    o.UpdateBuff(new Rapid(2000, o, rate))
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`效果：接下来一回合内行动速度变为 [${Math.ceil((2.5 + (this.level - 1) / 200) * 100)}%]`))
    Renderer.EndLine()
  }
}
class KnightSpirit extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(4000)
    this.name = '骑士精神'
  }
  Act(targets) {
    let o = this.owner, rate = (0.50 * this.lvl)
    o.UpdateBuff(new KnightSpiritBuff(2000, o, rate))
    Renderer.Print(Transfer(`[0] 发动[骑士精神]，攻防属性得到强化`, o), 500)
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：使自身的属性得到强化，攻提升 [2]，防提升[20]", null, null, [new PhysicalDamage(`${Math.floor((0.50 * this.lvl) * 100)}%`)]))
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
    Renderer.Print(Transfer(`[0] 发动[暴风斩]，`, o), 500, true)
    for (let i = 0; i < 5; i++) {
      if (!target.alive) break
      let dmg = target.CalcDamage([new PhysicalDamage(atp)])
      Renderer.Print(T(``))
      target.DealDamage(o, dmg, SourceType.Melee)
    Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：连续造成五次 [2] 点的物理伤害", null, null, [new PhysicalDamage(`${Math.floor((1.2 * this.lvl) * 100)}%攻`)]))
    Renderer.EndLine()
  }
}
class Apprehend extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(6000)
    this.name = '无情铁手'
  }
  SelectOneTarget() {
    let t = this.owner.SelectOneEnermy(SelectMethod.Backward)
    return t
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = 0.8 * stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 发动[无情铁手]，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee, false)
    Renderer.EndLine()
    if (target.alive) {
      target.group.Move(target, 0)
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并拉拽对手到最前排", null, null, [new PhysicalDamage('80%攻')]))
    Renderer.EndLine()
  }
}
class SwordSweep extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(3000)
    this.name = '横扫'
  }
  SelectTargets() {
    let num = 3
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
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk] * (0.8 * this.lvl)
    Renderer.Print(Transfer(`[0] 挥剑[横扫]，`, o), 500, true)
    Renderer.EndLine()
    for (let target of targets) {
      if (!target.alive) continue
      let dmg = target.CalcDamage([new PhysicalDamage(atp)])
      Renderer.Print(T(``))
      target.DealDamage(o, dmg, SourceType.Melee, false)
      if (o.GetRand(1000) > 850 && target.alive) {
        Renderer.Comma()
        target.UpdateBuff(new KnockUp(250, target))
      }
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：对至多3名敌人造成 [2] 点的物理伤害，有[15%]概率击飞每一名敌人", null, null, [new PhysicalDamage(`${Math.floor((0.8 * this.lvl) * 100)}%攻`)]))
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
    Renderer.Print(Transfer(`[0] 挥刀[上挑]，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee, false)
    Renderer.Comma()
    target.UpdateBuff(new KnockUp(500, target))
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害，并使对手被[击飞]0.5回合", null, null, [new PhysicalDamage('80%攻')]))
    Renderer.EndLine()
  }
}
class MomentarySlash extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(3000)
    this.name = '居合斩'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = 2.4 * stat[Stat.atk], target = targets[0]
    let dmg = target.CalcDamage([new PhysicalDamage(atp)])
    Renderer.Print(Transfer(`[0] 使用[居合斩]，`, o), 500)
    target.DealDamage(o, dmg, SourceType.Melee, false)
    Renderer.EndLine()
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点伤害", null, null, [new PhysicalDamage('240%攻')]))
    Renderer.EndLine()
  }
}
class Mangetsu extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(5000)
    this.name = '月光斩'
  }
  SelectTargets() {
    let num = 2
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
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let atp = stat[Stat.atk], mag = stat[Stat.mag], target = targets[0]
    Renderer.Print(Transfer(`[0] 使用[月光斩]，`, o), 500, true)
    for (let target of targets) {
      if (!target.alive) continue
      let dmg = target.CalcDamage([new PhysicalDamage(1.0 * atp), new MagicDamage(1.2 * mag)])
      Renderer.Print(T(``))
      target.DealDamage(o, dmg, SourceType.Melee, false)
      Renderer.EndLine()
    }
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：对至多2名敌人造成 [2] 点的混合伤害", null, null, [new PhysicalDamage('100%攻'), new MagicDamage('120%魔')]))
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
    this.professionRow = 1
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
class Knight extends Profession {
  constructor() {
    super()
    this.basicStats = [380, 40, 25, 20, 5, 40, 15]
    this.statsBoost = [[60, 60], [30], [5, 5], [10], [10], [10], [10]]
    this.professionRow = 1
    this.name = '骑士'
    this.icon = 'knight'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicSlash())
    tier1.push(new SwordSweep())
    tier2.push(new KnightSpirit())
    tier2.push(new Apprehend())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：重装战士，宣誓为你效忠`))
    Renderer.EndLine()
  }
}
class Samurai extends Profession {
  constructor() {
    super()
    this.basicStats = [300, 50, 5, 30, 0, 60, 30]
    this.statsBoost = [[60], [20], [10], [10], [10], [30], [20]]
    this.professionRow = 1
    this.name = '武士'
    this.icon = 'samurai'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicSlashCrit())
    tier1.push(new MomentarySlash())
    tier1.push(new SlashUp())
    tier2.push(new Mangetsu())
    tier3.push(new StormSlash())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：善战的武士，刀尖隐隐有鲜血的印痕`))
    Renderer.EndLine()
  }
}
class Wizard extends Profession {
  constructor() {
    super()
    this.basicStats = [260, 10, 0, 70, 10, 40, 20]
    this.statsBoost = [[60], [20], [5], [20, 10], [20], [20], [20]]
    this.professionRow = 2
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
    tier1.push(new FireBall())
    tier1.push(new Ignite())
    tier2.push(new Detonate())
    tier2.push(new Freeze())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：神秘的巫师，你不知道她的过去`))
    Renderer.EndLine()
  }
}
class Archer extends Profession {
  constructor() {
    super()
    this.basicStats = [260, 60, 0, 30, 0, 80, 40]
    this.statsBoost = [[60], [20, 10], [5], [10], [20], [10], [20]]
    this.professionRow = 2
    this.name = '弓箭手'
    this.icon = 'archer'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicArrow())
    tier1.push(new DualArrow())
    tier1.push(new RapidLoad())
    tier2.push(new HeavyShot())
    tier2.push(new PoisonousArrow())
    list = [tier0, tier1, tier2, tier3]
    return list
  }
  Introduction() {
    this.Intro()
    Renderer.Print(T(`介绍：敏捷的弓箭手，擅长用利箭刺穿目标`))
    Renderer.EndLine()
  }
}
function GetProfessionList() {
  var list = new Array()
  // list.push(new BasicProfession())
  list.push(new Knight())
  list.push(new Wizard())
  list.push(new Archer())
  list.push(new Samurai())
  return list
}
//#endregion
//#region group
class Group {
  constructor() {
    // priority, front, back, invicible
    this.memberList = new Array()
    this.members = [new Array(), new Array(), new Array(), new Array()]
    this.membersDead = new Array()
    this.die = true
    this.clanName = ''
    this.clanIcon = ''
  }
  SetTeam(_team) {
    this.team = _team
  }
  Update() {
    let alive = false
    for (let r of this.members) {
      alive ||= (r.length != 0)
    }
    if (alive) {
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
  AddToList(plr) {
    // console.log(`adding ${plr.name}`)
    if (this.clanName == '') {
      this.clanName = plr.name
      this.clanIcon = IconCanvas.GetIcon(this.clanName)
    }
    let pos = 0
    players.push(plr)
    this.memberList.push(plr)
    this.memberList = this.memberList.sort((a, b) => {
      return a.key < b.key ? 1 : -1
    })
    rawPlayers.push(plr)
  }
  Add(plr, row) {
    this.members[row].push(plr)
    this.Update()
  }
  Die(plr) {
    let row = plr.row
    let pos = this.members[row].indexOf(plr)
    this.members[row].splice(pos, 1)
    pos = players.indexOf(plr)
    players.splice(pos, 1)
    this.membersDead.push(plr)
    this.Update()
  }
  Move(plr, newRow) {
    let oldRow = plr.row
    plr.row = newRow
    let pos = this.members[oldRow].indexOf(plr)
    this.members[oldRow].splice(pos, 1)
    this.Add(plr, newRow)
  }
  SelectForward() {
    if (this.members[0].length > 0) {
      return new Array().concat(this.members[0])
    }
    for (let row of this.members) {
      if (row.length > 0) {
        return new Array().concat(row)
      }
    }
    return new Array()
  }
  SelectBackward() {
    if (this.members[0].length > 0) {
      return new Array().concat(this.members[0])
    }
    for (let i = 3; i >= 0; i--) {
      if (this.members[i].length > 0) {
        return new Array().concat(this.members[i])
      }
    }
    return new Array()
  }
  SelectAll() {
    if (this.members[0].length > 0) {
      return new Array().concat(this.members[0])
    }
    let ret = new Array()
    for (let row of this.members) {
      ret = ret.concat(row)
    }
    return ret
  }
}
//#endregion
//#region player
class Plr {
  constructor(_name, _clanName, _team, _group, _upgrade) {
    // console.log(`create Plr(${_name}, ${_team}, ${_group})`)
    this.name = _name;
    this.clanName = _clanName
    this.fullName = `${_name}@${_clanName}`
    this.key = sha512(this.fullName)
    this.team = _team;
    this.attr = SHA.Get(this.fullName);
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
    this.alive = true;
    this.renderAlive = true;
    this.passiveSkillList = new Array();
    this.actionSkillList = new Array();
    this.buffList = GetBuffList(this);
    this.SP = 0;
    this.group = _group;
    this.upgrade = _upgrade
    this.damageDealt = [0, 0, 0];
    this.icon = '';
    this.combo = null;
  }
  Copy() {
    let p = new Plr();
    p.name = this.name
    p.clanName = this.clanName
    p.fullName = this.fullName
    // p.team = this.team
    p.attr = new Array().concat(this.attr)
    p.currentRand = this.currentRand
    p.stat = new Array().concat(this.stat)
    p.statDPlus = new Array().concat(this.statDPlus)
    p.statDMult = new Array().concat(this.statDMult)
    p.statFPlus = new Array().concat(this.statFPlus)
    p.statFMult = new Array().concat(this.statFMult)
    p.health = this.health
    p.maxHealth = this.maxHealth
    p.renderHealth = this.renderHealth
    p.alive = this.alive
    p.renderAlive = this.renderAlive
    p.passiveSkillList = new Array().concat(this.passiveSkillList)
    p.actionSkillList = new Array().concat(this.actionSkillList)
    p.buffList = new Array().concat(this.buffList)
    p.SP = this.SP
    // p.group = this.group
    p.upgrade = this.upgrade
    p.damageDealt = new Array().concat(this.damageDealt)
    p.icon = this.icon
    p.combo = this.combo
    return p
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
    this.row = this.profession.professionRow
    this.group.Add(this, this.row)
  }
  InitStat() {
    let p = this.profession;
    this.stat = new Array().concat(p.basicStats);
    for (let i in this.stat) {
      for (let j in p.statsBoost[i]) {
        if (!superStats) {
          this.stat[i] += this.GetRand(p.statsBoost[i][j] + 1);
        } else {
          this.stat[i] += p.statsBoost[i][j];
        }
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
  SelectOneEnermy(method) {
    let g = this.group;
    let pos = this.GetRand(aliveGroups.length - 1);
    if (pos >= aliveGroups.indexOf(g)) {
      pos++;
    }
    let targetGroup = aliveGroups[pos];
    let targets = new Array();
    switch(method) {
      case SelectMethod.Forward:
        targets = targetGroup.SelectForward();
        break;
      case SelectMethod.Backward:
        targets = targetGroup.SelectBackward();
        break;
      case SelectMethod.All:
        targets = targetGroup.SelectAll();
        break;
    }
    pos = this.GetRand(targets.length);
    return targets[pos];
  }
  CalcDamage(damage) {
    for (let i in damage) {
      if (damage[i].type == DamageType.Physical) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp - this.GetStat()[Stat.def]), 1)
      }
      if (damage[i].type == DamageType.Magic) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp - this.GetStat()[Stat.res]), 1)
      }
      if (damage[i].type == DamageType.True) {
        damage[i].atp = Math.max(Math.ceil(damage[i].atp), 1)
      }
    }
    return damage
  }
  DealDamage(source, damage, srcType, canBeDodge = true) {
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
      if (canBeDodge && srcType == SourceType.Ranged && dex * dex > this.GetRand(36000)) {
        Renderer.Print(Transfer(`[1] [闪避]了此攻击  `, null, this, [], this.health, this.health), 300, false, []);
      } else if (canBeDodge && srcType == SourceType.Melee && dex * dex > this.GetRand(3000) && str * str > this.GetRand(20000)) {
        Renderer.Print(Transfer(`[1] [招架]了此攻击  `, null, this, [], this.health, this.health), 300, false, []);
      } else {
        let oldhp = this.health;
        this.health = this.health - atp > 0 ? this.health - atp : 0;
        let hp = this.health;
        Renderer.Print(Transfer(`[1] 受到[2]点伤害  `, null, this, dmg, oldhp, this.health), 300, false, [new RenderRequest(this, hp)]);
        if (this.health == 0) {
          this.Die();
          Renderer.EndLine();
          Renderer.Print(T(''))
          Renderer.Print(Transfer(`[0]死亡  `, this, null, [], 0, 0, "death"), 500);
        }
        for (let d of dmg) {
          source.damageDealt[d.type] += d.atp
        }
      }
      if (this.combo) {
        Renderer.Print("，")
        this.combo.Interrupt()
      }
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
    if (this.alive) {
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
      buff.UpdateOld(this.buffList[buff.type][buff.buffId])
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
  gameEnd = false
  rawPlayers = new Array()
  players = new Array()
  groups = new Array()
  aliveGroups = new Array()
  namesExisted = new Array()
  roundcnt = 0
  autoScroll = false
  seed = ""
  superStats = false
}
function InitPlayers() {
  GetTeams()
  InitProfessions()
  let seq = SHA.Get(seed)
  for (let grp of groups) {
    for (let plr of grp.team) {
      plr.attr = SHA.Get(plr.name + seed)
    }
  }
  // Log
  // console.log(`seed:"${seed}"`)
}

function GetTeams() {
  let plrString = inputString.split(/\r?\n/)
  let curTeam = new Array()
  let teamId = 1
  for (let i in plrString) {
    plrString[i] = plrString[i].trim()
  }
  while (plrString[0] == '') {
    plrString.splice(0, 1)
  }
  while (plrString[plrString.length - 1] == '') {
    plrString.splice(plrString.length - 1, 1)
  }
  if (plrString[0] == SpecialName.Test) {
    plrString.splice(0, 1)
    gameMode.value = GameMode.Test
  } else if (plrString[0] == SpecialName.WinRate) {
    plrString.splice(0, 1)
    gameMode.value = GameMode.WinRate
  }
  for (let i in plrString) {
    if (plrString[i].startsWith(SpecialName.SetSeed)) {
      if (typeof seed === 'string') {
        seed += plrString[i].slice(SpecialName.SetSeed.length, plrString[i].length)
      } else {
        seed = plrString[i].slice(SpecialName.SetSeed.length, plrString[i].length)
      }
      plrString.splice(i, 1)
    }
  }
  for (let i in plrString) {
    if (plrString[i] === SpecialName.SuperStats) {
      superStats = true
      plrString.splice(i, 1)
    }
  }
  let grouped = plrString.includes('')
  let grps = new Array()
  let currentGroup = new Array()
  for (let i in plrString) {
    let name = plrString[i]
    if (name == '') {
      if (currentGroup.length > 0) {
        grps.push(currentGroup)
      }
      clanName = null
      currentGroup = new Array()
      continue
    }
    if (!grouped) {
      if (currentGroup.length > 0) {
        grps.push(currentGroup)
      }
      currentGroup = new Array()
    }
    let upgrade = ''
    if (name.includes('+')) {
      let pos = name.indexOf('+')
      upgrade = name.substring(pos + 1)
      name = name.substring(0, pos)
    }
    if (name.includes('@')) {
      let strSlice = name.split('@')
      currentGroup.push({baseName: strSlice[0], clanName: strSlice[1], upgrade: upgrade})
    } else {
      currentGroup.push({baseName: name, clanName: name, upgrade: upgrade})
    }
  }
  if (currentGroup.length > 0) {
    grps.push(currentGroup)
  }
  InitTeams(grps)
  players = players.sort((a, b) => {
    return a.key < b.key ? 1 : -1
  })
}
function InitTeams(rawGroup) {
  for (let list of rawGroup) {
    let group = new Group()
    let team = new Array()
    for (let obj of list) {
      if (obj.clanName == null) {
        obj.clanName = obj.baseName
      }
      if (namesExisted.includes(`${obj.baseName}@${obj.clanName}`)) {
        continue
      }
      namesExisted.push(`${obj.baseName}@${obj.clanName}`)
      let plr = new Plr(obj.baseName, obj.clanName, team, group, obj.upgrade)
      team.push(plr)
      group.AddToList(plr)
    }
    team = team.sort((a, b) => {
      return a.fullName > b.fullName ? 1 : -1
    })
    let str = ''
    for (let plr of team) {
      str += plr.fullName
    }
    group.key = sha512(str)
    group.SetTeam(team)
    groups.push(group)
  }
  groups = groups.sort((a, b) => {
    return a.key > b.key ? 1 : -1
  })
}
function InitProfessions() {
  for (let grp of groups) {
    for (let plr of grp.team) {
      plr.InitProfession()
      plr.InitSkills()
      plr.InitStat()
    }
  }
}
function ShowBasicStats() {
  let str = ""
  Renderer.Print(Render.Title1(`Namerena False魔改版`))
  Renderer.Print(Render.Title2(`(魔改自“名字竞技场”，原地址namerena.github.io)`), 0, true)
  for (let plr of rawPlayers) {
    str = `${Render.Player(plr)}  血量${plr.stat[Stat.HP]}  攻${plr.stat[Stat.atk]}  防${plr.stat[Stat.def]}  魔${plr.stat[Stat.mag]}  抗${plr.stat[Stat.res]}  速${plr.stat[Stat.spd]}  敏${plr.stat[Stat.dex]}`
    Renderer.Print(T(` `))
    Renderer.Print(str)
    Renderer.EndLine()
    // console.log(plr.name, plr.GetStat())
  }
  if (!seed === "") {
    Renderer.Print(T(` `))
    Renderer.Print(`seed:"${seed}"`, 0, true)
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
  // for (let grp of aliveGroups) {
  //   console.log(grp)
  // }
  for (let plr of players) {
    if (plr.alive && !gameEnd) {
      plr.Act()
      RoundEnd()
    }
  }
  if (roundcnt > 200) gameEnd = true
}
function RoundEnd() {
  if (aliveGroups.length <= 1) {
    // Log
    // console.log(`Game End!`)
    // console.log(`The team left is`, aliveGroups)

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
  str += Render.td(`总伤`, 'resultth')
  str += Render.td(`造成物理伤害`, 'resultth')
  str += Render.td(`造成魔法伤害`, 'resultth')
  str += Render.td(`造成真实伤害`, 'resultth')
  final += Render.tr(str, 'resulttr')
  str = ''
  for (let plr of _team) {
    str += Render.td(Render.PlayerForRender(plr, plr.health, plr.health), 'resulttd resultname')
    let tot = plr.damageDealt[DamageType.Physical] + plr.damageDealt[DamageType.Magic] + plr.damageDealt[DamageType.True]
    str += Render.td(Transfer(` ${tot} `), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, [new PhysicalDamage(plr.damageDealt[DamageType.Physical])]), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, [new MagicDamage(plr.damageDealt[DamageType.Magic])]), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, [new TrueDamage(plr.damageDealt[DamageType.True])]), 'resulttd')
    final += Render.tr(str, 'resulttr')
    str = ''
  }
  str += Render.td(`败者`, 'resultth')
  str += Render.td(`总伤`, 'resultth')
  str += Render.td(`造成物理伤害`, 'resultth')
  str += Render.td(`造成魔法伤害`, 'resultth')
  str += Render.td(`造成真实伤害`, 'resultth')
  final += Render.tr(str, 'resulttr')
  str = ''
  for (let grp of groups) {
    if (grp.team == _team) continue
    for (let plr of grp.team) {
      str += Render.td(Render.PlayerForRender(plr, plr.health, plr.health), 'resulttd resultname')
      let tot = plr.damageDealt[DamageType.Physical] + plr.damageDealt[DamageType.Magic] + plr.damageDealt[DamageType.True]
      str += Render.td(Transfer(` ${tot} `), 'resulttd')
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
  Renderer.SetActive(true)
  CssStyle.SetActive(true)
  IconCanvas.SetActive(true)
  BuffIconMananger.Reset()
  inputString = playerString.value
  Reset()
  Renderer.Reset()
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
  } else if (gameMode.value == GameMode.WinRate) {
    Renderer.SetActive(false)
    CssStyle.SetActive(false)
    IconCanvas.SetActive(false)
    let groupWinCount = []
    let grps = []
    for (let grp of aliveGroups) {
      groupWinCount.push(0)
      grps.push(grp.clanName)
    }
    const f = TimeSlice(WinRate)
    f(identity.value, groupWinCount, grps, 100)
  }
}
function TimeSlice(fnc, time = 25) {
  if (fnc.constructor.name !== 'GeneratorFunction') return fnc()
  return function (...args) {
    const fnc_ = fnc(...args)
    function go() {
      const start = performance.now()
      let data
      do {
        data = fnc_.next()
      } while (!data.done && performance.now() - start < time)
      if (data.done) return data.value
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          try { resolve(go()) } catch (e) { reject(e) }
        })
      })
    }
    return go()
  }
}
function* WinRate(id, groupWinCount, grps, outputNum) {
  for (let cur = 0; cur <= 10000; cur += 100) {
    if (id != identity.value) return
    yield GetWinRate(id, groupWinCount, grps, cur, outputNum)
    while (outputNum <= cur + 100) {
      outputNum *= 10
    }
  }
}
function GetWinRate(id, groupWinCount, grps, cur, outputNum) {
  if (id != identity.value) return
  // console.log("rate", cur)
  if (cur == 10000) {
    Renderer.SetActive(true)
    Renderer.Print(S(`评测结束`), 0, true)
    Renderer.Close()
    Renderer.SetActive(false)
    return
  }
  for (let currentSeed = cur + 1; currentSeed <= cur + 100; currentSeed++) {
    // TimeSlice(() => {
      inputString = playerString.value + "\n" + `seed:${currentSeed}`
      Reset()
      InitPlayers()
      while (!gameEnd) {// 精准时间分片 
        // TimeSlice(() => {
          NextRound()
        // })
      }
      groupWinCount[grps.indexOf(aliveGroups[0].clanName)]++
    // })
  }
  if (cur + 100 >= outputNum) {
    Renderer.SetActive(true)
    Renderer.Print(S(`评测进行中${cur / 100 + 1}%...`), 800, true)
    Renderer.Print(S(`评测精度${100 / (cur + 100)}%:`), 100, true)
    for (let i in grps) {
      Renderer.Print(S(` `) + S(`小队"${grps[i]}"的胜率为`) + T(`[${groupWinCount[i] * 100 / (cur + 100)}%]`), 100, true)
    }
    Renderer.SetActive(false)
  } else {
    Renderer.SetActive(true)
    Renderer.Print(S(`评测进行中${cur / 100 + 1}%...`), 800, true)
    Renderer.SetActive(false)
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
  active: false,
  Reset: function() {
    this.historyLines = ""
    this.latestLine = ""
    this.outputStream = new Array()
    this.renderHealthStream = new Array()
    this.wait = 1
    this.delay = 100
    this.close = false
    this.active = true
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
  Clear: function() {
    this.output = []
  },
  Run: async function(id) {
    if (id != identity.value || this.close) {
      while (this.outputStream.length != 0 && this.close) {
        let content = this.outputStream.shift()
        // console.log("del", content.cmd, content.str)
        if (content.cmd == "start") {
          this.close = false
          break
        }
      }
      setTimeout(() => {
        this.Run(id)
      }, 1000)
      return
    }
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
    } else {
      // console.log(next.cmd, next.str)
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
  Print: function(_content, _delayTime = 0, end = false, healthUpdates = [], _class = "") {
    if (!this.active) return
    this.outputStream.push({str: _content, delay: _delayTime, end:end, class:_class, cmd:'print'})
    this.renderHealthStream.push(healthUpdates)
  },
  Comma: function() {
    this.Print(T('，'))
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
    ForceUpdate()
  },
  Close: function() {
    this.outputStream.push({str: '', delay: 0, end:false, cmd:'close'})
  },
  Start: function() {
    this.outputStream.push({str: '', delay: 0, end:false, cmd:'start'})
  },
  SetActive: function(state) {
    this.active = state
  },
}
function ForceUpdate() {
  sideKey.value++
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
  Name: function(name, _class = "") {
    let str = ''
    str += `<span class="name ${_class}">${name}</span>`
    return str
  },
  Icon: function(_class = '', _text = '') {
    let str = ''
    str += `<span class="icon ${_class}">${_text}</span>`
    return str
  },
  PlayerBuff: function(buffList) {
    let str = ''
    for (let list of buffList) {
      for (let buff of list) {
        if (buff.name != 'empty') {
          let counter = buff.counter
          if (typeof counter === "number") {
            str += this.Icon(buff.icon, counter);
          } else {
            str += this.Icon(buff.icon);
          }
        }
      }
    }
    return str;
  },
  Player: function(plr, oldhp = 0, newhp = 0) {
    let str = ''
    str += this.Icon(plr.group.clanIcon)
    str += this.Icon(plr.icon)
    str += this.HealthBar(plr, oldhp, newhp)
    str += plr.alive ? this.Name(plr.name) : this.Name(plr.name, "death")
    str += this.PlayerBuff(plr.buffList)
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
function Transfer(_str, caster = null, target = null, dmg = [], oldhp = 0, newhp = 0, _class = "") {
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
  s += `<span class="sentence ${_class}">${str}</span>`
  return s
}
function T(str) {
  return Transfer(str)
}
function S(str) {
  return `<span class="sentence">${str}</span>`
}
//#endregion
//#region icon canvas
var IconCanvas = {
  active: true,
  SetActive: function SetActive(state) {
    this.active = state
  },
  Init: function() {
    this.cCount = this.sig_colors.length
    this.LoadPattern()
    this.Initcdif()
  },
  sig_colors: [
    [255, 255, 255],
    [255, 255, 255],
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
    let canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    let ctx = canvas.getContext('2d')
    img.src = this.pattern
    img.onload = function() {
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
        IconCanvas.datas.push(data);
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
        IconCanvas.borders.push(border);
        IconCanvas.masks.push(mask);
      }
    }
  },
  DrawShape: function DrawShape(c, shapeData, color) {
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
  DrawBorder: function DrawBorder(c, b) {
    this.DrawShape(c, this.borders[b], [64, 64, 64]);
    var img = c.getImageData(0, 0, 16, 16);
    let mask = this.masks[b];
    for (let i = 0; i < 256; ++i) {
      img.data[i * 4 + 3] = mask[i];
    }
    c.putImageData(img, 0, 0);
  },
  GetIcon: function(name) {
    if (!this.active) return
    // console.log(`check data`)
    // for (let i = 0; i < this.datas.length; i++) {
    //   let allzero = true;
    //   for (let j = 0; j < this.datas[i].length; j++)
    //   if (this.datas[i][j] != 0) allzero = false;
      
    //   console.log(this.datas[i])
    //   console.log(allzero)
    // }
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
      // if (usedColors.length > 0 && c == bgCIdx && shapeSorted[0] != shapeSorted[1]) {
      //   return true;
      // }
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
      this.DrawShape(ctx, datas[shapeSorted[i]], this.sig_colors[c]);
    }
    this.DrawBorder(ctx, borderStyle);
    CssStyle.AddBackground(`sig${++this.sigCount}`, canvas.toDataURL());
    
    return `sig${this.sigCount}`;
  },
}
var CssStyle = {
  active: true,
  SetActive: function SetActive(state) {
    this.active = state
  },
  LoadCode: function LoadCode(code) {
    if (!this.active) return
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
  AddBackground: function AddBackground(_className, _imageUrl) {
    // console.log(`adding new icon class: ${_className}, url: ${_imageUrl}`)
    this.LoadCode(`.${_className}{background-image: url("${_imageUrl}")}`);
  }
}
IconCanvas.Init()
//#endregion
window.onresize = () => {
  if (document.documentElement.clientWidth >= 500) {
    sidepanel.value = 'hsidepanel'
    mainpanel.value = 'hmainpanel'
  } else {
    sidepanel.value = 'vsidepanel'
    mainpanel.value = 'vmainpanel'
  }
}
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
  border-right-color: #f66;
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
  text-align: center;
  line-height: 16px;
  font-weight: 900;
  font-size: small;
  color: rgb(255, 255, 255);
  -webkit-text-stroke: black 1px;
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
.samurai {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAABw0lEQVQ4jZXTT0gUURzA8e8bZ9pdszIPYhuVZIctT0JeMyG8pHso0g5hhw4FFgYFXcRLatFBUlgsCMwOeuhgh+gWUQgdCm/pIWu71app+6eZ2dl5+/Ngf6R2a/Z7e/Deh/d+8JTtfpfP6zl+pA421FNJxuDwta1rqeg0YORyNg8nb6MdGwxIplYqQoyJ0SmltebRzBiFbAZT51haXg6MGADDA2MKYPrxBK5TwNJ5PgZElMjvfYMj/aKU4sLZS0iVhY/QtP+QCgwA3BrolYIV4kxnFyLC9updHDhyvCzyFwBw53qXuDvqOX2yE9E+5rYQsZZ4SaQkAHC375j4ZoQT3b34+Qw1u/cCqFhLHIDFvrAk08XNIZbqauKV0m6G59P3kKKHZ2fx7KwADMVrJZkuApQHAG7cf60cx2FuZop8JoXz8i2z56KCNqmpizH+xij/hK0NXWyTfQsr7Hm/RtWpAl8di+7JL+qfM/izJz1RqU1lWair5umnNM/mXfXfJ/xs9nxUJAwNzQ6H2/M0H23lwUiPBAIWL5sS0qu8W/WIJXzVfuWbClsmH5IpOhojYga5wfz6TuaWfn15biZeqI7GiHgYbABWOsDpxyBAewAAAABJRU5ErkJggg==');
}
.archer {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAACEElEQVQ4jaWTz0vTcRjHX5/Pvs1NEPwRK1QaZlGnDnroGC2n03Dh1MC53bL6DwoWmh77B6ppbsqyQyzI2dcfdesSSNilCKkMsRloJm5N29r302FuHkwTfOC5PB9eb97vz8MjlFIcpjQAZWQLg18rn1iNxzlaW8e7l88539pVFF/4nNlYWTIrIaRJM4tT5+p/I6SlyGJJavuIH0/MRZZfzUV2PSzGoP7mwzO26pp5uQd8+vW9zjjAicu3ZNPAlAREQ++Eecl+lYt3Yta3D27MA6CUwsj+ybdIfP9YpQecSg84VSqZLNEDTvSAk0w6fSQYHFSbqS1rMDiIHnCilEIopViLLwCQ+Dpb9UEfWtp2IfJ2GvomtXA4lPF1+4ojjyObAFeaL2GrrqEQobyyhn/Cd3Owt8tbkof9fn8hqwQoPWbn22ysDKDu+v2zBbhfN4VDoXRnR0fp2JOxJIDftwMDuQhG1pDTfa78LgVAQ++EKTwymm73tFdEn0XXAXzdPoQQIGBjNb4TQZqkAXDhdrQ0l/mFDI+MZjxtHlse9nZ5sRZbsFiLdjt4PzEoFt88NQDh6p8SQ8PDRqvbXRkbH18G6Om5tse2t/8gKy0AuAZycHNLi/0gcEFgK5WQAEOPho3GxqbaSV1fBPC0eVj78fP/AppmlsC6w+E4OTMz/QWg1e0GoLyibF8Bcdhr3OsWDlx/AS9v2oSGZhI6AAAAAElFTkSuQmCC');
}
.knight {
  background-image: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAACXklEQVQ4jZWT3UvTYRTHP3O/33TLzblpliUGmvnSSiWLNM0XrBRKWJIS+B9EdNWFF94UQZdRl0FIN71A1kVmUETZC6n5ihYVonOa+LK5Lbffpr/f01XDORP6wnPxwDmf53vOeQ5CCLY54nJzjdguRmKTRGRO4PvKuvIbfZIZa1o6bWfKhappeLx+evondBvjdUKI6GXiYbsovHCDyrISnNUVBFyjLCgqDz5Ps6as0lieR1jT8+TlxygkIZodcIn8U028uXeH3r6nqNoa+YeK+elV2WO3kJRs4dXwHJ3t52luKBdxgM6OK+QcaOD2o24+3L1P3cF0nG215O1OxJQA+9MtyAYDe89ex2a1EgdQkSkoOkxGShLDk4uUNJbxvGea7sFfvO+6xqxPwWAwkGyz4Z6bjwKiTVzy+gkpIVrKj1LZeoL6pg4K8x0ElQgV565S5cigb0oBTcUoS/EOvIEggdUg7/oHqXfexGCysORbQSdJLGLiy0yYOkcaiYkyVqsp3oEnGCKwGqRrwEVY1aHX65l2z2NPtSEZZSwmIyOzEQyyREQYth5jVmaWQKjU5Np5O7kCCIypNmz2VC6eLubx61HGhkbweDxbjBHYZQZNaKysKZQec6BpGutKCNW/zOT4N3zeFYr2ZWxMiQXcutRKkiwxOhNk4NMQZdlmqvPtLAfCvBh04Xa5qao4EgOIKQHAebxADLr8AKytryP0ErIkIYBss47e8amYr7zlgjSW5orMnRki/OOZaGmqFeYUu6gpzdtyqeIc/NVJR47YIesIJ+hZ8IcZ+77p5X+V8L/6A2ziPAUhzVvdAAAAAElFTkSuQmCC');
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
.death {
  background-color: #ddd;
}
</style>