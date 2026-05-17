const imageBase = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";

const champions = [
  {
    id: "samira",
    name: "Samira",
    image: `${imageBase}/Samira_0.jpg`,
    focus: "Q first. E only after the opening exists.",
    note: "Samira can mash in, but she cannot always leave. Her escape is killing, resetting, lifestealing, blocking the real spell, or using Flash.",
    situations: [
      {
        title: "before pressing E",
        trigger: "You feel the urge to dash because something is happening.",
        do: "Q first. Auto if safe. Check the HP ratio. E only when the target is already losing, reachable, and not protected.",
        avoid: "E as anxiety relief. E into full-health people. E because R exists.",
        drill: "Say: Q creates the opening; E commits to the opening."
      },
      {
        title: "low target in fog",
        trigger: "Someone is low and running into fog, river, tri-brush, or behind teammates.",
        do: "Stop at the edge. Q if visible. Enter only if low plus reachable plus escape/reset is realistic.",
        avoid: "Treating low HP as permission. E into unknown bodies. Following into places where the camera and brain lose the fight.",
        drill: "Say: low is not enough; low plus reachable."
      },
      {
        title: "W timing",
        trigger: "Lux Q, Ashe arrow, hook, bind, stun projectile, or another clear flying danger is coming.",
        do: "Hold W until the scary thing actually appears. Use W as parry/nope, then keep fighting or leave.",
        avoid: "W immediately after E just because danger feels near. W as armor. W against tower shots.",
        drill: "Before the fight, name one spell W is saving you from."
      },
      {
        title: "after R works",
        trigger: "R hits, damage lands, the fight gets exciting, and your hands want to stay.",
        do: "Leave unless the next kill is obvious. If someone dies, check E, then decide again.",
        avoid: "Standing in the middle because the ult felt good. Chasing the second kill into protected space.",
        drill: "Say: R is reward, not a contract to keep fighting."
      },
      {
        title: "after a takedown",
        trigger: "Someone dies and E comes back.",
        do: "Check the next target: low, reachable, not a tank, not under tower, not behind fresh CC. Dash again only if the check passes.",
        avoid: "Reading reset as automatic go. Reset means permission to check, not permission to int.",
        drill: "Say: kill one, check E."
      },
      {
        title: "early ADC attacks first",
        trigger: "The enemy ADC hits you at level 1 or 2 and your body says duel now.",
        do: "Step back first. Q from range. Auto only if safe. Let them walk into your minion wave before you consider E.",
        avoid: "Instant duel because they touched you. Committing before minions and HP ratio are on your side.",
        drill: "Back step, Q, breathe, then decide."
      },
      {
        title: "chased by Nasus or Swain",
        trigger: "A bruiser, tank, or drain champion is walking you down.",
        do: "Run first. Q only with real space. Exhaust or Flash if needed. Make them spend time crossing bad space.",
        avoid: "Turning to die fast. E into them unless they are basically dead.",
        drill: "Die slow, not fast."
      },
      {
        title: "took damage and panicked",
        trigger: "One hit lands and it feels like proof that the enemy knows everything.",
        do: "Treat damage as information. Step back, keep camera stable, keep playing the next action.",
        avoid: "Reading damage as judgment or enemy competence. Giving the whole fight away because HP moved.",
        drill: "Say: one hit is not the game."
      },
      {
        title: "tower range",
        trigger: "You are fighting near a tower or chasing under it.",
        do: "Move your feet out first. If a champion projectile is flying, W that. If tower is shooting, walk out.",
        avoid: "W-ing tower shots. Staying because the target is low.",
        drill: "Say: tower equals feet; projectile equals W."
      }
    ]
  },
  {
    id: "caitlyn",
    name: "Caitlyn",
    image: `${imageBase}/Caitlyn_0.jpg`,
    focus: "Stay unavailable. Farm, survive, shoot from outside their reach.",
    note: "Caitlyn is the comfort sniper pick: range, space, sustain, and leaving when noticed.",
    situations: [
      {
        title: "lane feels like judgment",
        trigger: "The enemy laner feels like a person judging you instead of a moving game object.",
        do: "Return to next safe minion. Keep XP. Take safe CS. Let the lane be a farming room.",
        avoid: "Trying to prove you can beat them. Trading because they seem confident.",
        drill: "Say: lane, survive, XP, next safe minion."
      },
      {
        title: "enemy notices you",
        trigger: "They turn toward you, walk at you, or hold engage range.",
        do: "Leave early. Keep champion near center. Use range, trap space, E backward if needed.",
        avoid: "Standing still to finish one greedy auto. Chasing after you have been noticed.",
        drill: "Say: if they notice me, I leave."
      },
      {
        title: "poked low",
        trigger: "You take damage and feel like lane is ruined.",
        do: "Back up, lifesteal when safe, collect the wave, and stop treating the lane as doomed.",
        avoid: "Panic recall after one bad trade. Taking another trade to fix the first one.",
        drill: "Say: sustain means I can keep farming."
      },
      {
        title: "midgame uncertainty",
        trigger: "Lane ends and you do not know where to stand.",
        do: "Stand behind bodies. Shoot the closest safe target. Hit towers when ahead; guard towers and collect waves when behind.",
        avoid: "Walking forward for a perfect target. Chasing into fog for a low enemy.",
        drill: "Say: closest safe target."
      },
      {
        title: "team fight starts",
        trigger: "Everyone is moving and you feel late or scared.",
        do: "Join from far away. Auto what is safe. Ult only when it is a clean finish or safe pressure.",
        avoid: "Holding all damage because the fight is confusing. Walking into the fight to feel useful.",
        drill: "Shoot from where Caitlyn is hard to touch."
      }
    ]
  },
  {
    id: "fizz",
    name: "Fizz",
    image: `${imageBase}/Fizz_0.jpg`,
    focus: "Mark, enter, stab, dodge, leave.",
    note: "Fizz is the reference loop because every button has a body job and a clean exit shape.",
    situations: [
      {
        title: "looking for a kill",
        trigger: "A squishy target is isolated or already losing.",
        do: "R marks the plan. Q enters. W/auto finishes damage. E dodges or exits.",
        avoid: "Going in before the target is killable. Using E so early that there is no exit.",
        drill: "Say the loop before the fight: mark, enter, stab, leave."
      },
      {
        title: "after E",
        trigger: "You used E and now the fight is still going.",
        do: "Respect that the safety button is gone. Finish only if the target dies quickly.",
        avoid: "Thinking untargetable once means untouchable forever.",
        drill: "After E, ask: am I leaving or killing?"
      },
      {
        title: "translating to Samira",
        trigger: "Samira feels worse because she cannot leave like Fizz.",
        do: "Keep the useful lesson: clean button jobs. Translate exit into W, reset, lifesteal, Flash, or not entering.",
        avoid: "Expecting Samira E to be Fizz E.",
        drill: "Say: Samira earns the entry with Q."
      }
    ]
  },
  {
    id: "kaisa",
    name: "Kai'Sa",
    image: `${imageBase}/Kaisa_0.jpg`,
    focus: "Only test her if the body feel makes you want reps.",
    note: "The K-pop assassin idea is appealing, but visual irritation breaks repetition.",
    situations: [
      {
        title: "first test game",
        trigger: "You want a sexy assassin ADC but the walk animation might bother you.",
        do: "Play one low-pressure bot game and judge body feel before judging strength.",
        avoid: "Forcing a champion your eyes hate because the idea sounds right.",
        drill: "Ask: do I want ten more reps?"
      },
      {
        title: "going in",
        trigger: "The enemy is low and Kai'Sa can follow.",
        do: "Check whether the target is isolated and whether team pressure is already there.",
        avoid: "Using the assassin fantasy as permission to dive protected targets.",
        drill: "Say: isolated first, fantasy second."
      }
    ]
  },
  {
    id: "missfortune",
    name: "Miss Fortune",
    image: `${imageBase}/MissFortune_0.jpg`,
    focus: "Simple lane damage without pretending she has a free exit.",
    note: "Miss Fortune can make farming and damage feel easy, but she does not solve the escape/chaos loop.",
    situations: [
      {
        title: "easy lane damage",
        trigger: "The wave is stable and Q/poke is available.",
        do: "Use the simple damage. Farm cleanly. Let easy buttons lower threat.",
        avoid: "Thinking easy poke means you can stand anywhere.",
        drill: "One safe Q, then back to minions."
      },
      {
        title: "ult angle",
        trigger: "Enemies are grouped or already controlled.",
        do: "Ult from safety when the fight is already shaped for it.",
        avoid: "Walking forward to make R happen. Ulting because you are bored.",
        drill: "Ask: can they stop me right now?"
      },
      {
        title: "chase temptation",
        trigger: "A low target is leaving and your movement speed feels good.",
        do: "Stop at fog or protection. Use range; do not become the engage.",
        avoid: "Playing her like Samira or Fizz.",
        drill: "Say: damage from safety."
      }
    ]
  },
  {
    id: "ezreal",
    name: "Ezreal",
    image: `${imageBase}/Ezreal_0.jpg`,
    focus: "Q spam is useful only if the fantasy still feels playable.",
    note: "Ezreal has the satisfying QQQ rhythm, but the champion fantasy may not reward enough reps.",
    situations: [
      {
        title: "Q rhythm",
        trigger: "You want button spam without hard commitment.",
        do: "Use Q as a safe test button and a way to stay engaged from range.",
        avoid: "Turning Q spam into random forward movement.",
        drill: "Q, move, Q, move."
      },
      {
        title: "fantasy mismatch",
        trigger: "The kit feels good but the character does not make you want games.",
        do: "Keep the lesson for other champs: a repeatable safe button lowers panic.",
        avoid: "Forcing the pick just because the mechanic is useful.",
        drill: "Ask: useful lesson or actual main?"
      }
    ]
  },
  {
    id: "jhin",
    name: "Jhin",
    image: `${imageBase}/Jhin_0.jpg`,
    focus: "Stylish, but style is not the same as wanting reps.",
    note: "Jhin is a comparison pick, not a forced solution.",
    situations: [
      {
        title: "style attraction",
        trigger: "The presentation feels clean but the body fantasy is not enough.",
        do: "Use the comparison to clarify what is missing: reward, safety, sexiness, or chaos.",
        avoid: "Confusing aesthetic respect with actual practice appetite.",
        drill: "Name what the pick gives and what it does not."
      },
      {
        title: "slow fight rhythm",
        trigger: "You are waiting on shots or reload timing.",
        do: "Treat him as pacing practice if you choose him.",
        avoid: "Expecting Samira-style mash reward.",
        drill: "Shot, step, reset hands."
      }
    ]
  },
  {
    id: "ashe",
    name: "Ashe",
    image: `${imageBase}/Ashe_0.jpg`,
    focus: "Use only when calm utility is the actual goal.",
    note: "Ashe felt boring and ult pressure felt unrewarding, so she should not be forced as a main.",
    situations: [
      {
        title: "ult pressure",
        trigger: "R is available and the map feels like a test.",
        do: "Use it only as a simple utility rep if you are practicing calm decisions.",
        avoid: "Letting one missed arrow define the whole game.",
        drill: "One clear arrow target, no drama."
      },
      {
        title: "boring lane",
        trigger: "The kit feels too quiet to create reward.",
        do: "Take the data and switch. Boredom matters because reps need reward.",
        avoid: "Punishing yourself with a champion that makes you stop playing.",
        drill: "Ask: am I learning or just tolerating?"
      }
    ]
  },
  {
    id: "rammus",
    name: "Rammus",
    image: `${imageBase}/Rammus_0.jpg`,
    focus: "Do not make practice feel like punishment.",
    note: "Rammus felt physically boring and irritating. That matters.",
    situations: [
      {
        title: "low reward pick",
        trigger: "A champion is simple but your body dislikes playing it.",
        do: "Respect the boredom signal and use a different practice room.",
        avoid: "Choosing simplicity if it kills repetition.",
        drill: "Say: simple is not the same as playable."
      }
    ]
  }
];

const championPicker = document.querySelector("#champion-picker");
const championName = document.querySelector("#champion-name");
const championFocus = document.querySelector("#champion-focus");
const championNote = document.querySelector("#champion-note");
const situationCount = document.querySelector("#situation-count");
const situationList = document.querySelector("#situation-list");

function situationCard(item) {
  const article = document.createElement("article");
  article.className = "situation-card";
  article.innerHTML = `
    <div class="situation-title">
      <h3>${item.title}</h3>
      <p>${item.trigger}</p>
    </div>
    <dl class="situation-detail">
      <div class="detail-row"><dt>do</dt><dd>${item.do}</dd></div>
      <div class="detail-row"><dt>avoid</dt><dd>${item.avoid}</dd></div>
      <div class="detail-row"><dt>drill</dt><dd>${item.drill}</dd></div>
    </dl>
  `;
  return article;
}

function renderChampion(championId) {
  const champion = champions.find((item) => item.id === championId) || champions[0];
  document.querySelectorAll(".portrait-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.champion === champion.id));
  });
  championName.textContent = champion.name;
  championFocus.textContent = champion.focus;
  championNote.textContent = champion.note;
  situationCount.textContent = `${champion.situations.length} notes`;
  situationList.replaceChildren(...champion.situations.map(situationCard));
}

function renderPicker() {
  championPicker.replaceChildren(...champions.map((champion, index) => {
    const button = document.createElement("button");
    button.className = "portrait-button";
    button.type = "button";
    button.dataset.champion = champion.id;
    button.setAttribute("aria-label", champion.name);
    button.setAttribute("aria-pressed", String(index === 0));
    const img = document.createElement("img");
    img.src = champion.image;
    img.alt = "";
    img.loading = index < 3 ? "eager" : "lazy";
    button.append(img);
    button.addEventListener("click", () => renderChampion(champion.id));
    return button;
  }));
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function noteNode(note) {
  const article = document.createElement("article");
  article.className = "note";

  const time = document.createElement("time");
  time.dateTime = note.created_at || "";
  time.textContent = formatDate(note.created_at);

  const body = document.createElement("div");
  const title = document.createElement("h3");
  title.textContent = note.title || "note";
  const text = document.createElement("p");
  text.textContent = note.body || "";

  body.append(title, text);
  article.append(time, body);
  return article;
}

async function hydratePublicNotes() {
  const stream = document.querySelector("#notes-stream");
  if (!stream) return;
  try {
    const response = await fetch("/api/logs", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.notes) || data.notes.length === 0) return;
    stream.replaceChildren(...data.notes.map(noteNode));
  } catch {
    // Keep the static fallback note.
  }
}

renderPicker();
renderChampion("samira");
hydratePublicNotes();
