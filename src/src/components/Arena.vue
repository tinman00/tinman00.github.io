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
const CounterType = {
  Player: 0,
  Counter: 1
}
const playerString = ref("")
const identity = ref(null)
var gameEnd = false
var teams = new Array()
var players = new Array()
var groups = new Array()
var aliveGroups = new Array()
var sideContent = ''
//#region message receiver
onMounted(() => {
  window.addEventListener("message", (e) => {
    if (e.data.type == "rungame") {
      // console.log(e.data)
      playerString.value = e.data.msg
      identity.value = e.data.id
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
  }
  Init(plr) {
    this.owner = plr
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
}
class ActionSkill extends Skill {
  constructor() {
    super()
    this.isReady = false
  }
  InitActionSkl(_CD) {
    this.CD = _CD
    this.currentCD = 0
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
}
class BasicAttack extends ActionSkill {
  constructor() {
    super()
    this.InitActionSkl(1000)
  }
  Act(targets) {
    let o = this.owner, stat = o.GetStat()
    let dmg = stat[Stat.atk], target = targets[0]
    let randomType = this.owner.GetRand(3) // for testing
    // dmg = target.CalcDamage(dmg, DamageType.Physical)
    dmg = target.CalcDamage(dmg, randomType) // for testing
    // Renderer.Print(`${o.name} 发动普通攻击，`, 500)
    Renderer.Print(Transfer(`[0] 发动[普通攻击]，`, o, null, null, null, null, null), 500)
    // target.DealDamage(dmg, DamageType.Physical)
    target.DealDamage(dmg, randomType) // for testing
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
}
class BasicProfession extends Profession {
  constructor() {
    super()
    this.basicStats = [211, 40, 10, 32, 0, 32, 32]
    this.statsBoost = [[64, 64, 64], [30, 30], [20], [64], [20], [64], [64]]
  }
  GetSkillList() {
    let list = new Array()
    list.push(new BasicAttack())
    return list
  }
}
function GetProfessionList() {
  var list = new Array()
  list.push(new BasicProfession())
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
function Plr(_name, _team, _group, _type) {
  // console.log(`create Plr(${_name}, ${_team}, ${_group}, ${_type})`)
  this.name = _name
  this.team = _team
  this.attr = SHA.Get(_name)
  this.currentRand = 0
  this.stat = [0, 0, 0, 0, 0, 0, 0]
 // D refers to Direct, F refers to Final
  this.statDPlus = [0, 0, 0, 0, 0, 0, 0]
  this.statDMult = [0, 0, 0, 0, 0, 0, 0]
  this.statFPlus = [0, 0, 0, 0, 0, 0, 0]
  this.statFMult = [0, 0, 0, 0, 0, 0, 0]
  this.health = 0
  this.maxHealth = 0
  this.renderOldHealth = 0
  this.renderHealth = 0
  this.alive = _type == CounterType.Player ? true : false
  this.passiveSkillList = new Array()
  this.actionSkillList = new Array()
  this.buffList = new Array()
  this.SP = 0
  this.group = _group
  this.type = _type
}
Plr.prototype = {
  GetRandom: function() {
    return SHA.GetRandom(this.attr, this.currentRand++)
  },
  GetRand: function(num) {
    return this.GetRandom() % num
  },
  InitProfession: function() {
    let professionList = GetProfessionList()
    this.profession = professionList[this.GetRand(professionList.length)]
  },
  InitStat: function() {
    let p = this.profession
    this.stat = p.basicStats;
    for (let i in this.stat) {
      for (let j in p.statsBoost[i])
        this.stat[i] += this.GetRand(p.statsBoost[i][j]);
    }
    this.health = this.stat[Stat.HP]
    this.maxHealth = this.stat[Stat.HP]
    this.renderHealth = this.health
    this.renderOldHealth = this.maxHealth
  },
  InitSkills: function() {
    let p = this.profession
    let list = p.GetSkillList()
    // need improve
    for (let skl of list) {
      skl.Init(this)
      if (skl instanceof ActionSkill) {
        this.actionSkillList.push(skl)
      } else {
        this.passiveSkillList.push(skl)
      }
    }
  },
  GetStat: function() {
    let ret = new Array()
    for (let i = 0; i < this.stat.length; i++) {
      ret.push(Math.floor(((this.stat[i] + this.statDPlus[i]) * (1 + this.statDMult[i]) + this.statFPlus[i]) * (1 + this.statFMult[i])))
    }
    ret.push(this.health)
    ret.push(this.maxHealth)
    return ret
  }, 
  Die: function() {
    this.alive = false
    this.group.Die(this)
  },
  SelectOneEnermy: function() {
    let g = this.group
    let pos = this.GetRand(aliveGroups.length - 1)
    if (pos >= aliveGroups.indexOf(g)) {
      pos++
    }
    let targetGroup = aliveGroups[pos]
    pos = this.GetRand(targetGroup.members.length)
    return targetGroup.members[pos]
  },
  CalcDamage: function(damage, type) {
    if (type == DamageType.Physical) {
      return damage - this.stat[Stat.def]
    }
    if (type == DamageType.Magic) {
      return damage - this.stat[Stat.res]
    }
    if (type == DamageType.True) {
      return damage
    }
    return 0
  },
  DealDamage: function(damage, type) {
    let oldhp = this.health
    this.health = this.health - damage > 0 ? this.health - damage : 0
    let hp = this.health
    Renderer.Print(Transfer(`[1] 受到[2]点伤害`, null, this, type, damage, oldhp, this.health), 500, false, [new RenderRequest(this, oldhp, hp)])
    Renderer.EndLine()
    if (this.health == 0) {
      Renderer.Print(Transfer(`[0]死亡`, this, null, null, null, null, null), 300)
      Renderer.EndLine()
      this.Die()
    }
  },
  Act: function() {
    let s = this.GetStat()
    let deltaTime = 100 + s[Stat.spd]
    let skls = new Array()
    this.SP += deltaTime
    for (let skl of this.actionSkillList) {
      skl.CoolDown(deltaTime)
    }
    // console.log(deltaTime)
    if (this.SP >= 1000) {
      for (let skl of this.actionSkillList) {
        if (skl.isReady) {
          skls.push(skl)
        }
      }
      // console.log(this, skls)
      if (skls.length > 0) {
        let skl = skls[this.GetRand(skls.length)]
        // console.log(skls, skl)
        let targets = skl.SelectTargets()
        skl.Use(targets)
        // skl.Act(targets)
      }
      this.SP -= 1000
    }
  },
  UpdateRenderHealth: function(oldhp, hp) {
    this.renderOldHealth = oldhp
    this.renderHealth = hp
  }
}
//#endregion
//#region fight
//#region init
function Reset() {
  Renderer.Reset()
  gameEnd = false
  teams = new Array()
  players = new Array()
  groups = new Array()
  aliveGroups = new Array()
  roundcnt = 0
  sideContent = ''
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
          newGroup = new Group(teamId, curTeam)
          groups.push(newGroup)
          newGroup.Add(new Plr(`Team ${teamId}`, curTeam, newGroup, CounterType.Counter))
        }
        curTeam = new Array()
      }
    }
    if (curTeam.length != 0) {
      teams.push(curTeam)
    }
  }
  // for (let team of teams) {
  //   for (let plr of team){
  //     players.push(plr)
  //   }
  // }
  // console.log(teams)
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
  // console.log(teams)
  for (let team of teams) {
    for (let plr of team) {
      str = `${Render.Player(plr)}  血量${plr.stat[Stat.HP]}  攻${plr.stat[Stat.atk]}  防${plr.stat[Stat.def]}  魔${plr.stat[Stat.mag]}  抗${plr.stat[Stat.res]}  速${plr.stat[Stat.spd]}  敏${plr.stat[Stat.dex]}`
      Renderer.Print(str, 0)
      Renderer.EndLine()
      // console.log(plr.name, plr.GetStat())
    }
  }
  Renderer.Print('<br>', 0, 1)
}
//#endregion
let roundcnt = 0
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
    if (plr.alive) {
      plr.Act()
    }
  }
  RoundEnd()
}
function RoundEnd() {
  if (aliveGroups.length <= 1) {
    console.log(`Game End!`)
    console.log(`The team left is`, aliveGroups)
    // console.log(groups)
    gameEnd = true;
  }
}
function Win(team) {
  Renderer.Print(T('[---------------------------------]'), 0, 1, [])
  for (let plr of team) {
    Renderer.Print(Render.PlayerForRender(plr, plr.health, plr.health), 0, 1, [])
  }
  Renderer.Print('获得[胜利]!!!', 0, 1, [])
  Renderer.Print(T('[---------------------------------]'), 0, 1, [])
}
function Run() {
  Reset()
  InitPlayers()
  ShowBasicStats()
  Renderer.Run(identity.value)
  while (!gameEnd) {
    NextRound()
  }
  Win(aliveGroups[0].team)
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

    let str = ''
    for (let team of teams) {
      for (let plr of team) {
        let oldhp = plr.renderOldHealth, hp = plr.renderHealth
        str += Render.Row(Render.PlayerForRender(plr, oldhp, hp))
      }
    }
    sideContent = str
  },
  Run: async function(id) {
    if (id != identity.value) return
    let next = this.outputStream.shift()
    let healthChange = this.renderHealthStream.shift()
    this.UpdateRenderHealth(healthChange)
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
        }, next.delay * this.wait)
      } else {
        this.UpdateContent(id, next)
        this.End(next.end)
        this.Run(id)
      }
    }
  },
  Print: function(_content, _delayTime, end, healthUpdates) {
    this.outputStream.push({str: _content, delay: _delayTime, end:end})
    this.renderHealthStream.push(healthUpdates)
  },
  EndLine: function() {
    this.Print('', 0, true)
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
        req.plr.UpdateRenderHealth(req.oldhp, req.hp)
      }
    }
  }
}
class RenderRequest {
  constructor(_plr, _oldhp, _hp) {
    this.plr = _plr
    this.oldhp = _oldhp
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
  Icon: function() {
    let str = ''
    str += `<span class="icon"></span>`
    return str
  },
  Player: function(plr, oldhp, newhp) {
    let str = ''
    str += this.Icon()
    str += this.HealthBar(plr, oldhp, newhp)
    str += this.Name(plr.name)
    return this.Span(str)
  },
  PlayerForRender: function(plr, oldhp, newhp) {
    let str = ''
    str += this.Icon()
    str += this.HealthBarUnhidden(plr, oldhp, newhp)
    str += this.Name(plr.name)
    return this.Span(str)
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
  Row: function(str) {
    // return `${str}`
    return `<p class="row">${str}</p>`
  },
  Span: function(str) {
    return `<span class="u">${str}</span>`
  },
  SText: function(str) {
    return `<span class="stext">${str}</span>`
  }
}
function Transfer(_str, caster, target, dmgtype, dmg, oldhp, newhp) {
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
//#endregion


</script>

<template>
  <div id="sidePanel" class="sidepanel">
    <div v-html="sideContent"></div>
    <!-- <div v-for="plr in players"> -->
      <!-- {{ `Team ${plr.team} Name: ${plr.name}`}} -->
    <!-- </div> -->
  </div>
  <div id="mainPanel" class="mainpanel">
    <div v-html="output"></div>
  </div>
</template>

<style>
div {
  display: inline-block;
  box-sizing: border-box;
}
p {
  display: block;
}
span {
  display: inline-block;
}
.row {
  margin: 0;
  line-height: 24px;
}
.sidepanel {
  position: absolute;
  left: 0;
  width: 200px;
  height: 100%;
}
.mainpanel {
  position: absolute;
  left: 200px;
  width: calc(100% - 200px);
  height: 100%;
}
.sentence {
  line-height: 14px;
}
.name {
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
}
.hp{
 background: #4c4;
 height:2px;
 position: absolute;
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
  vertical-align: bottom;
  image-rendering: pixelated;
  background-image: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAI9JREFUOE/dkzEOgDAIReEMro7e/0SOrj0D5htpAKGpcbOLqcj7v/LLIiJERMyMR1/3676v6gwAim3dHGA5dlLIqA5Zic1KAgRrVB8CnKVkA4E/AKopzJwfUyrH+AqgQarGFWEuIzaJnwCzLqz61aMO1GYWW5vMxx2JgMpJVO6CGSBCqub0CPaP6xWOtu03J17Hh+CCR3ivAAAAAElFTkSuQmCC");
}
.row {
  display: block;
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
</style>