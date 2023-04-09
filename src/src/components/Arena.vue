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
    this.CD = this.CD / this.lvl
    this.currentCD = (this.lvl * 0.5 - 0.5) * this.CD
  }
  InitActionSkl(_CD) {
    this.CD = _CD
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
class BasicAttack extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(1000)
    this.name = '普通攻击'
    this.type = '基础技能'
  }
  Init(plr, _CD) {
    this.owner = plr
    this.level = 1
    this.lvl = 1
    this.CD = this.CD
    this.currentCD = 0
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let dmg = stat[Stat.atk], target = targets[0]
    // let randomType = this.owner.GetRand(3) // for testing
    dmg = target.CalcDamage(dmg, DamageType.Physical)
    // dmg = target.CalcDamage(dmg, randomType) // for testing
    Renderer.Print(Transfer(`[0] 发动普通攻击，`, o, null, null, null, null, null), 500)
    target.DealDamage(o, dmg, DamageType.Physical, SourceType.Melee)
    // target.DealDamage(o, dmg, randomType) // for testing
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点物理伤害", null, null, DamageType.Physical, '100%攻'))
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
    let dmg = stat[Stat.atk], target = targets[0]
    dmg = target.CalcDamage(dmg, DamageType.Physical)
    Renderer.Print(Transfer(`[0] 挥剑劈砍，`, o, null, null, null, null, null), 500)
    target.DealDamage(o, dmg, DamageType.Physical, SourceType.Melee)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点物理伤害", null, null, DamageType.Physical, '100%攻'))
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
    let dmg = stat[Stat.mag], target = targets[0]
    dmg = target.CalcDamage(dmg, DamageType.Magic)
    Renderer.Print(Transfer(`[0] 吟唱魔导飞弹，`, o, null, null, null, null, null), 500)
    target.DealDamage(o, dmg, DamageType.Magic, SourceType.Ranged)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：造成 [2] 点魔法伤害", null, null, DamageType.Magic, '100%魔'))
    Renderer.EndLine()
  }
}
class StormSlash extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(5000)
    this.name = '暴风斩'
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let dmg = stat[Stat.atk] * (1.2 * this.lvl), target = targets[0]
    dmg = target.CalcDamage(dmg, DamageType.Physical)
    Renderer.Print(Transfer(`[0] 发动[暴风斩]，`, o, null, null, null, null, null), 500)
    target.DealDamage(o, dmg, DamageType.Physical, SourceType.Melee)
    Renderer.Print(Transfer(` `, o, null, null, null, null, null), 0)
    target.DealDamage(o, dmg, DamageType.Physical, SourceType.Melee)
    Renderer.Print(Transfer(` `, o, null, null, null, null, null), 0)
    target.DealDamage(o, dmg, DamageType.Physical, SourceType.Melee)
  }
  Introduction() {
    this.Intro()
    Renderer.Print(Transfer("效果：连续造成三次 [2] 点的物理伤害", null, null, DamageType.Physical, `${Math.floor((1.2 * this.lvl) * 100)}%攻`))
    Renderer.EndLine()
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
    this.basicStats = [180, 40, 10, 20, 0, 60, 30]
    this.statsBoost = [[60, 60], [30, 30], [20], [10], [10], [40], [30]]
    this.name = '骑士'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicSlash())
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
    this.basicStats = [120, 10, 10, 60, 10, 40, 20]
    this.statsBoost = [[60], [20], [10, 10], [30], [20], [20], [20]]
    this.name = '巫师'
  }
  GetSkillList() {
    let list = new Array()
    let tier0 = new Array()
    let tier1 = new Array()
    let tier2 = new Array()
    let tier3 = new Array()
    tier0.push(new BasicMissle())
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
    this.buffList = new Array();
    this.SP = 0;
    this.group = _group;
    this.type = _type;
    this.damageDealt = [0, 0, 0];
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
  CalcDamage(damage, type) {
    if (type == DamageType.Physical) {
      return Math.ceil(damage - this.stat[Stat.def]);
    }
    if (type == DamageType.Magic) {
      return Math.ceil(damage - this.stat[Stat.res]);
    }
    if (type == DamageType.True) {
      return Math.ceil(damage);
    }
    return 0;
  }
  DealDamage(source, damage, type, srcType) {
    if (!this.alive)
      return;
    let dex = this.GetStat()[Stat.dex];
    let str = this.GetStat()[Stat.atk];
    // console.log(dex * dex)
    if (srcType == SourceType.Ranged && dex * dex > this.GetRand(18000)) {
      Renderer.Print(Transfer(`[1] [闪避]了此攻击`, null, this, null, null, this.health, this.health), 300, true, []);
    } else if (srcType == SourceType.Melee && dex * dex > this.GetRand(3000) && str * str > this.GetRand(10000)) {
      Renderer.Print(Transfer(`[1] [格挡]了此攻击`, null, this, null, null, this.health, this.health), 300, true, []);
    } else {
      let oldhp = this.health;
      this.health = this.health - damage > 0 ? this.health - damage : 0;
      let hp = this.health;
      Renderer.Print(Transfer(`[1] 受到[2]点伤害`, null, this, type, damage, oldhp, this.health), 300, true, [new RenderRequest(this, hp)]);
      if (this.health == 0) {
        Renderer.Print(Transfer(`[0]死亡`, this, null, null, null, null, null), 500);
        Renderer.EndLine();
        this.Die();
      }
      source.damageDealt[type] += damage;
    }
  }
  Act() {
    let s = this.GetStat();
    let deltaTime = 100 + s[Stat.spd];
    let skls = new Array();
    this.SP += deltaTime;
    for (let skl of this.actionSkillList) {
      skl.CoolDown(deltaTime);
    }
    // console.log(deltaTime)
    if (this.SP >= 1000) {
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
      this.SP -= 1000;
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
      Renderer.Print(str, 0)
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
    str += Render.td(Transfer(` [2] `, null, null, DamageType.Physical, plr.damageDealt[DamageType.Physical], null, null), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, DamageType.Magic, plr.damageDealt[DamageType.Magic], null, null), 'resulttd')
    str += Render.td(Transfer(` [2] `, null, null, DamageType.True, plr.damageDealt[DamageType.True], null, null), 'resulttd')
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
      str += Render.td(Transfer(` [2] `, null, null, DamageType.Physical, plr.damageDealt[DamageType.Physical], null, null), 'resulttd')
      str += Render.td(Transfer(` [2] `, null, null, DamageType.Magic, plr.damageDealt[DamageType.Magic], null, null), 'resulttd')
      str += Render.td(Transfer(` [2] `, null, null, DamageType.True, plr.damageDealt[DamageType.True], null, null), 'resulttd')
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
  } else if (gameMode.value == GameMode.Test) {
    Test()
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
  },
  UpdateContent: function(id, content) {
    if (id != identity.value) return
    this.latestLine += content.str
    output.value = this.historyLines + Render.Row(this.latestLine)
  },
  Run: async function(id) {
    if (id != identity.value) return
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
    this.outputStream.push({str: _content, delay: _delayTime, end:end})
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
    str += `<span class="${_class}"></span>`
    return str
  },
  Player: function(plr, oldhp = 0, newhp = 0) {
    let str = ''
    str += this.Icon('icon')
    str += this.HealthBar(plr, oldhp, newhp)
    str += this.Name(plr.name)
    return this.Span(str)
  },
  PlayerForRender: function(plr, oldhp = 0, newhp = 0) {
    let str = ''
    str += this.Icon()
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
function Transfer(_str, caster = null, target = null, dmgtype = null, dmg = '', oldhp = 0, newhp = 0) {
  let s = '', str = _str
  let reg = str.match(/\[.*?\]/g)
  for (let i in reg) {
    if (reg[i] == '[0]') {
      str = str.replace(reg[i], Render.Player(caster, oldhp, newhp))
    } else if (reg[i] == '[1]') {
      str = str.replace(reg[i], Render.Player(target, oldhp, newhp))
    } else if (reg[i] == '[2]') {
      str = str.replace(reg[i], Render.Damage(dmgtype, dmg))
    } else {
      str = str.replace(reg[i], Render.SText(reg[i].slice(1, reg[i].length - 1)))
    }
  }
  s += `<span class="sentence">${str}</span>`
  return s
}
function T(str) {
  return Transfer(str, null, null, null, null, null, null)
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


</script>

<template>
  <div id="sidePanel" :class="sidepanel">
    <div class="plrlist" v-for="plr in rawPlayers" :style="{opacity: plr.renderAlive ? 1 : 0.5}">
      <div class="icon"></div>
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
  position: relative;
  width: 16px;
  height: 16px;
  vertical-align: middle;
  image-rendering: pixelated;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAI9JREFUOE/dkzEOgDAIReEMro7e/0SOrj0D5htpAKGpcbOLqcj7v/LLIiJERMyMR1/3676v6gwAim3dHGA5dlLIqA5Zic1KAgRrVB8CnKVkA4E/AKopzJwfUyrH+AqgQarGFWEuIzaJnwCzLqz61aMO1GYWW5vMxx2JgMpJVO6CGSBCqub0CPaP6xWOtu03J17Hh+CCR3ivAAAAAElFTkSuQmCC");
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
.physicaldamage {
  color: #f66;
}
.magicdamage {
  color: #08f;
}
.truedamage {
  color: black;
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