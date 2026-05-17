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
        situation: "You want to press E because the fight suddenly feels urgent, but you do not yet know if the target is actually killable or protected.",
        response: "Start with Q or an auto from safety so the fight gives information before you commit. E is for a target that is already losing, reachable, and not hiding behind fresh CC or teammates; if the only reason to dash is panic, keep E unused and make the next safe action."
      },
      {
        situation: "An enemy looks killable because their health bar is low, but you have not compared their HP to yours or checked whether they are a tank.",
        response: "Use the ratio check before your hands decide for you. Squishy targets become reasonable when they are below roughly half your HP or already trapped by your team; tanks and drain champions need to be much lower because they can still survive the first burst and punish the dash."
      },
      {
        situation: "A low-health enemy runs toward fog, river, tri-brush, or teammates, and your brain reads the low HP bar as permission to chase.",
        response: "Stop at the edge and Q only if they are still visible. The useful question is not whether they are low; it is whether they are low, reachable, and cheap to kill. Fog, tower, tanks, and missing enemies turn the chase into a trap."
      },
      {
        situation: "You dash in and immediately want to press W because being close to enemies feels dangerous.",
        response: "Hold W for the actual spell that would stop you, such as Lux Q, Ashe R, a hook, a bind, or another visible projectile. W is a parry, not armor; using it early makes the real danger hit after the circle ends."
      },
      {
        situation: "Your ult works, damage numbers happen, and the excitement makes you stay in the middle after the safe part of the fight is already over.",
        response: "Treat R as the reward, not a promise to keep fighting. After R, leave unless the next target is already low and reachable; if someone dies, check E first, then decide whether another dash is actually safe."
      },
      {
        situation: "Someone dies, E resets, and the reset makes it feel like the game is telling you to dash again immediately.",
        response: "A reset only gives you a new check. Look for the next low squishy on the edge of the fight; do not spend the reset into a tank, tower, fog, or fresh crowd control just because the button came back."
      },
      {
        situation: "The enemy ADC hits you first at level 1 or 2 and your body wants to instantly prove you are not scared.",
        response: "Step back before answering. Use Q from range, let your minions punish their chase, and only add autos or E if their health and position become clearly bad for them."
      },
      {
        situation: "Nasus, Swain, Volibear, or another sticky champion is chasing you and turning around feels like the only way to regain control.",
        response: "Run first and make them waste time. Q only when there is space, use Exhaust or Flash if needed, and do not E into them unless they are basically dead; a slow expensive death is better than an instant free one."
      },
      {
        situation: "You take one hit and it feels like proof that the enemy knows what they are doing and the fight is already doomed.",
        response: "Treat the hit as information, not judgment. Step back, keep the camera stable, and choose the next action; one hit does not mean they are good, and it does not mean you have to collapse."
      },
      {
        situation: "You chase a low enemy under tower and your hands reach for W even though the tower shot is not something Samira can parry.",
        response: "Separate champion danger from tower danger. If a projectile or CC spell is flying, W can block it; if tower is shooting, the answer is feet, not W. Walk out of the tower's shooting area before the low-health bait turns into your death."
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
        situation: "The enemy laner walks forward and your brain starts treating them like a person judging you instead of a moving object in lane.",
        response: "Shrink the task to lane, XP, and next safe minion. You do not have to beat the person; you only have to keep Caitlyn unavailable, collect what is safe, and let range do the work."
      },
      {
        situation: "You want one more minion or auto, but the enemy has turned toward you and your body has not admitted you have been noticed yet.",
        response: "Leave early, not perfectly. Keep the champion near the center of the camera, use small clicks near Caitlyn, and give up the greedy hit before the enemy gets a real engage angle."
      },
      {
        situation: "You take poke in lane and it feels like the entire lane is ruined even though you still have wave, XP, and sustain available.",
        response: "Back up and let Bloodthirster/Fleet-style comfort do its job when it is safe. The purpose of sustain is psychological as much as statistical: it keeps one bad trade from becoming panic recall or a revenge trade."
      },
      {
        situation: "Lane ends and you do not know where Caitlyn is supposed to stand once people start grouping and moving through fog.",
        response: "Stand behind bodies and shoot the closest safe target. When ahead, hit towers from range; when behind, guard towers and collect waves. The target does not need to be perfect, only safe enough to keep shooting."
      },
      {
        situation: "A fight starts far away and you feel late, so walking forward starts to feel like the only way to be useful.",
        response: "Join from outside the fight first. Auto what is safe, ult only when it is a clean finish or safe pressure, and do not walk into danger just to prove you are participating."
      },
      {
        situation: "A low enemy leaves the fight and your sniper fantasy wants the satisfying finish even though the path goes through fog or enemy bodies.",
        response: "Use range, traps, or ult if the finish is clean; otherwise let the low target go. Caitlyn feels good when she is unavailable, not when she turns a safe game into a chase."
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
        situation: "A squishy target looks punishable, but you are not sure whether the Fizz feeling is real kill pressure or just wanting the combo.",
        response: "Make the loop explicit before you enter: R marks, Q enters, W and autos finish, E dodges or exits. If the target is not isolated, already losing, or likely to die quickly, the clean Fizz shape is not actually there yet."
      },
      {
        situation: "You used E, the fun untargetable moment is over, and now the fight is still happening around you.",
        response: "Respect that the safety button is gone. Finish only if the target dies quickly; otherwise move out instead of pretending one dodge made you untouchable for the whole fight."
      },
      {
        situation: "Samira feels worse because you want every champion to have Fizz's clean jump-in, dodge, and leave pattern.",
        response: "Keep the useful lesson without copying the escape fantasy. Samira exits through not entering too early, holding W for the real spell, killing for reset, lifestealing through a won fight, or using Flash."
      },
      {
        situation: "You are comparing champions and the real question is whether their buttons give you the same clear body map as Fizz.",
        response: "Use Fizz as a reference, not a requirement. The useful standard is whether every button has a job your hands understand; the champion does not need to be Fizz, but it does need a loop you want to repeat."
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
        situation: "The idea of Kai'Sa sounds right because she could be a sexy assassin ADC, but the walk animation or body feel may make repeated games annoying.",
        response: "Test her in a low-pressure bot game before treating her as a real candidate. Strength on paper matters less than whether your eyes and hands want ten more reps."
      },
      {
        situation: "A low enemy is marked or reachable and the assassin fantasy makes following them look obvious.",
        response: "Check isolation and team pressure first. Kai'Sa can follow, but the fantasy does not make a protected target cheap; enter when the enemy is separated or already controlled, not just because the button reaches."
      },
      {
        situation: "You are tempted to force Kai'Sa because she matches the idea of what you want, even though actually piloting her feels wrong.",
        response: "Treat that mismatch as data. A champion can be conceptually perfect and still be a bad practice tool if the animation, posture, or reward loop makes you avoid games."
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
        situation: "The wave is calm and Miss Fortune Q feels easy, so you start relaxing your spacing because damage is happening without much effort.",
        response: "Use the easy damage, then return to safe lane shape. Simple poke lowers threat only if it does not turn into standing anywhere or walking forward after the bounce."
      },
      {
        situation: "Enemies are grouped and your ult could be huge, but you would have to walk into danger to make the angle look perfect.",
        response: "Ult from safety when the fight is already shaped for it by allies, terrain, or enemy commitment. If you have to step into the fight to make R happen, the ult is probably asking you to solve the wrong problem."
      },
      {
        situation: "A low target is leaving and your movement speed makes the chase feel safer than it really is.",
        response: "Stop at fog, tower, or protection. Miss Fortune can punish from range, but she is not Samira or Fizz; if chasing makes you become the engage, let the target go."
      },
      {
        situation: "Miss Fortune feels easy and sexy enough to play, but the fight still lacks the dash-reset chaos that made Samira appealing.",
        response: "Use her when the rep is clean farming, easy damage, or lower-stress bot practice. Do not expect her to satisfy the same reward loop as a champion built around entering and resetting."
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
        situation: "You want button spam without hard commitment, and Ezreal Q gives your hands something safe to do while the fight stays uncertain.",
        response: "Use Q as a test button and movement rhythm: Q, move, Q, move. The lesson is safe repetition under pressure, not randomly drifting forward because the button is available."
      },
      {
        situation: "The kit feels mechanically useful, but the character fantasy does not make you want to queue more games.",
        response: "Keep the mechanic as a lesson for other champions. A repeatable safe button can lower panic, but a useful lesson is not automatically a main."
      },
      {
        situation: "You miss several Qs and the spam loop starts feeling like proof that you are bad instead of a low-cost way to stay engaged.",
        response: "Keep moving and keep the miss cheap. Ezreal Q is good practice because one miss does not have to commit your body; the next Q is another rep, not a verdict."
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
        situation: "Jhin looks clean and stylish, but you are not sure that liking his presentation means you actually want to practice him.",
        response: "Use the comparison to name what is missing: reward, safety, sexiness, chaos, or a button loop your hands want. Respecting a champion's style is different from wanting hundreds of reps."
      },
      {
        situation: "His slower shot rhythm makes you wait, count, and reset hands when what you wanted was Samira-style mashing.",
        response: "Treat him as pacing practice only if that is the goal for the day. If the goal is dopamine, dash, and reset, forcing Jhin turns style into friction."
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
        situation: "Ashe R is available and the map starts feeling like a test you are about to fail.",
        response: "Use the arrow only when you have one clear target or a simple utility rep. A missed arrow is not the whole game, and forcing the shot because the button is glowing makes the ult feel worse."
      },
      {
        situation: "The kit is clear and safe on paper, but playing her feels too quiet to create reward.",
        response: "Take that seriously and switch when needed. Boredom matters because reps need reward; calm utility is useful only if calm utility is actually what you want to practice."
      },
      {
        situation: "You are tempted to pick Ashe because she seems responsible, even though responsibility is not the same as a playable learning loop.",
        response: "Use her for slows, spacing, and simple decisions when that is the specific rep. Do not turn practice into punishment by picking the champion your nervous system least wants to repeat."
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
        situation: "A champion is simple on paper, but playing it makes your body bored or irritated enough that you stop wanting reps.",
        response: "Respect the boredom signal. Simplicity is not the same as playable; if the champion kills repetition, it is not the right practice room for this system."
      },
      {
        situation: "You think choosing the simple tank should lower pressure, but the lack of button reward makes the whole game feel physically flat.",
        response: "Do not force the pick to prove discipline. Use the negative fit as information about what the practice room needs: clear body feel, enough reward, and a loop you actually want to repeat."
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

  const situation = document.createElement("p");
  situation.className = "situation-sentence";
  situation.textContent = item.situation;

  const response = document.createElement("p");
  response.className = "situation-response";
  response.textContent = item.response;

  article.append(situation, response);
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
  situationCount.textContent = `${champion.situations.length} situations`;
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
