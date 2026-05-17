const imageBase = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";

const champions = [
  {
    id: "samira",
    name: "Samira",
    skin: "Soul Fighter Samira",
    image: `${imageBase}/Samira_30.jpg`,
    focus: "Q first. E only after the opening exists.",
    note: "Samira can mash in, but she cannot always leave. Her escape is killing, resetting, lifestealing, blocking the real spell, or using Flash.",
    situations: [
      {
        title: "E feels urgent before you know if the target is killable.",
        response: "When the fight starts moving, your body may want E to remove uncertainty. Do not let the dash be the first answer. Start with Q or an auto from safety so the fight gives information first: is the target losing, reachable, and not protected by fresh CC or teammates? If the only reason to dash is panic, keep E unused and make the next safe action."
      },
      {
        title: "An enemy is low, but you have not compared their HP to yours.",
        response: "A low health bar is not enough by itself. Before E, compare their HP to yours and ask what kind of champion they are. Squishy targets become reasonable when they are below roughly half your HP or already trapped by your team; tanks, drain champions, and bruisers need to be much lower because they can survive the first burst and punish the dash."
      },
      {
        title: "A low-health target runs into fog and chasing feels mandatory.",
        response: "When a low-health enemy runs toward fog, river, tri-brush, or teammates, stop at the edge instead of following the health bar. Q only if they are still visible. The useful question is not whether they are low; it is whether they are low, reachable, and cheap to kill. Fog, tower, tanks, and missing enemies turn the chase into a trap."
      },
      {
        title: "After E, being close to enemies makes W feel like armor.",
        response: "After dashing in, being close can feel scary enough that your hands spend W immediately. Hold it. W is for the actual thing that would stop you: Lux Q, Ashe R, a hook, a bind, or another visible projectile. It is a parry, not armor; using it early often means the real danger hits after the circle ends."
      },
      {
        title: "R lands, damage happens, and staying suddenly feels safer than leaving.",
        response: "When R lands and damage numbers happen, the successful moment can make the middle of the fight feel safer than it is. Treat R as the reward, not a promise to keep fighting. After R, leave unless the next target is already low and reachable. If someone dies, check E first, then decide whether another dash is actually safe."
      },
      {
        title: "E resets after a kill and the next dash feels required.",
        response: "When E comes back after a takedown, the refreshed button can feel like the game is telling you to go again. It is not. A reset only gives you a new check. Look for a low squishy on the edge of the fight; do not spend the reset into a tank, tower, fog, or fresh crowd control just because the button came back."
      },
      {
        title: "The enemy ADC hits first at level 1 and it feels personal.",
        response: "If the enemy ADC tags you at level 1 or 2, the hit can feel socially loaded, like you need to prove immediately that you are not scared. Step back before answering. Use Q from range, let your minions punish their chase, and only add autos or E if their health and position become clearly bad for them."
      },
      {
        title: "Nasus or Swain is chasing you and turning feels safer than running.",
        response: "When Nasus, Swain, Volibear, or another sticky champion is walking you down, turning around can feel more controllable than continuing to run. Run first and make them waste time. Q only when there is space, use Exhaust or Flash if needed, and do not E into them unless they are basically dead. A slow expensive death is better than an instant free one."
      },
      {
        title: "One hit lands and suddenly feels like proof the fight is doomed.",
        response: "Damage can feel like evidence that the enemy understands the fight, you are behind, and the rest is already doomed. Treat the hit as information, not judgment. Step back, keep the camera stable, and choose the next action. One hit does not mean they are good, and it does not mean you have to collapse."
      },
      {
        title: "A low target is under tower and your hands reach for W.",
        response: "When a low enemy is under tower, the kill can look close enough that your hands reach for W. Separate champion danger from tower danger. If a projectile or CC spell is flying, W can block it; if tower is shooting, the answer is feet, not W. Walk out of the tower's shooting area before the low-health bait turns into your death."
      }
    ]
  },
  {
    id: "caitlyn",
    name: "Caitlyn",
    skin: "Pool Party Caitlyn",
    image: `${imageBase}/Caitlyn_13.jpg`,
    focus: "Stay unavailable. Farm, survive, shoot from outside their reach.",
    note: "Caitlyn is the comfort sniper pick: range, space, sustain, and leaving when noticed.",
    situations: [
      {
        title: "The enemy laner walks up and lane starts feeling like judgment.",
        response: "When the enemy laner walks forward, your brain may treat them like a person evaluating you instead of a moving object in lane. Shrink the task to lane, XP, and next safe minion. You do not have to beat the person; you only have to keep Caitlyn unavailable, collect what is safe, and let range do the work."
      },
      {
        title: "You want one more minion after the enemy notices Caitlyn.",
        response: "If the enemy has turned toward you, the greedy minion or extra auto is no longer free. Leave early, not perfectly. Keep the champion near the center of the camera, use small clicks near Caitlyn, and give up the hit before the enemy gets a real engage angle."
      },
      {
        title: "You take poke and the lane feels ruined before it is.",
        response: "Taking damage can make the whole lane feel contaminated even when you still have wave, XP, range, and sustain. Back up and let Bloodthirster/Fleet-style comfort do its job when safe. Sustain is psychological as much as statistical: it keeps one bad trade from becoming panic recall or a revenge trade."
      },
      {
        title: "After lane, fog makes Caitlyn spacing feel unreadable.",
        response: "When lane ends and people move through fog, Caitlyn loses the simple lane frame that made spacing readable. Stand behind bodies and shoot the closest safe target. When ahead, hit towers from range; when behind, guard towers and collect waves. The target does not need to be perfect, only safe enough to keep shooting."
      },
      {
        title: "A distant fight starts and walking forward feels like participation.",
        response: "If a fight starts far away, the fear of not contributing can make walking into danger feel like participation. Join from outside the fight first. Auto what is safe, ult only when it is a clean finish or safe pressure, and do not walk into danger just to prove you are there."
      },
      {
        title: "A low enemy disappears into fog and the Caitlyn finish feels irresistible.",
        response: "A low enemy can make the satisfying Caitlyn finish feel worth chasing through fog or enemy bodies. Use range, traps, or ult if the finish is clean; otherwise let the target go. Caitlyn feels good when she is unavailable, not when she turns a safe game into a chase."
      }
    ]
  },
  {
    id: "fizz",
    name: "Fizz",
    skin: "Little Devil Fizz",
    image: `${imageBase}/Fizz_16.jpg`,
    focus: "Mark, enter, stab, dodge, leave.",
    note: "Fizz is the reference loop because every button has a body job and a clean exit shape.",
    situations: [
      {
        title: "A squishy looks punishable before the Fizz kill is real.",
        response: "A squishy target can look punishable before the fight is actually shaped for Fizz. Make the loop explicit before you enter: R marks, Q enters, W and autos finish, E dodges or exits. If the target is not isolated, already losing, or likely to die quickly, the clean Fizz shape is not actually there yet."
      },
      {
        title: "Fizz E is gone but your body still feels temporarily safe.",
        response: "After E, the fun untargetable moment is over even if the fight is still happening around you. Respect that the safety button is gone. Finish only if the target dies quickly; otherwise move out instead of pretending one dodge made you untouchable for the whole fight."
      },
      {
        title: "Samira feels wrong because you expect a Fizz exit.",
        response: "Samira can feel worse when you expect every champion to have Fizz's clean jump-in, dodge, and leave pattern. Keep the useful lesson without copying the escape fantasy. Samira exits through not entering too early, holding W for the real spell, killing for reset, lifestealing through a won fight, or using Flash."
      },
      {
        title: "A new champion feels wrong when its buttons do not have clear jobs.",
        response: "When comparing champions, the real question is whether their buttons give your hands a clear body map. Use Fizz as a reference, not a requirement. Every button should have a job your hands understand; the champion does not need to be Fizz, but it does need a loop you want to repeat."
      }
    ]
  },
  {
    id: "kaisa",
    name: "Kai'Sa",
    skin: "K/DA ALL OUT Kai'Sa",
    image: `${imageBase}/Kaisa_26.jpg`,
    focus: "Only test her if the body feel makes you want reps.",
    note: "The K-pop assassin idea is appealing, but visual irritation breaks repetition.",
    situations: [
      {
        title: "Kai'Sa fantasy fits, but the walk or body feel may not.",
        response: "Kai'Sa can sound right because the idea is a sexy assassin ADC, but repeated games depend on body feel. Test her in a low-pressure bot game before treating her as a real candidate. Strength on paper matters less than whether her animation, posture, and button feel make your eyes and hands want ten more reps."
      },
      {
        title: "A marked low enemy makes following feel correct before isolation is checked.",
        response: "A marked or reachable low enemy can make the assassin fantasy take over before isolation is checked. Check isolation and team pressure first. Kai'Sa can follow, but the fantasy does not make a protected target cheap; enter when the enemy is separated or already controlled, not just because the button reaches."
      },
      {
        title: "Kai'Sa's idea keeps winning even when playing her feels wrong.",
        response: "If Kai'Sa matches the idea of what you want but piloting her feels wrong, treat that mismatch as data. A champion can be conceptually perfect and still be a bad practice tool if the animation, posture, or reward loop makes you avoid games."
      }
    ]
  },
  {
    id: "missfortune",
    name: "Miss Fortune",
    skin: "Battle Bunny Miss Fortune",
    image: `${imageBase}/MissFortune_31.jpg`,
    focus: "Simple lane damage without pretending she has a free exit.",
    note: "Miss Fortune can make farming and damage feel easy, but she does not solve the escape/chaos loop.",
    situations: [
      {
        title: "Easy Q damage makes spacing feel less important than it is.",
        response: "When the wave is calm and Q feels easy, damage can happen without much effort and spacing can quietly get worse. Use the easy damage, then return to safe lane shape. Simple poke lowers threat only if it does not turn into standing anywhere or walking forward after the bounce."
      },
      {
        title: "The perfect Bullet Time angle asks you to walk into danger.",
        response: "If enemies are grouped but the perfect ult angle requires walking into danger, the angle is asking too much. Ult from safety when the fight is already shaped by allies, terrain, or enemy commitment. If you have to step into the fight to make R happen, the ult is probably solving the wrong problem."
      },
      {
        title: "Move speed makes chasing a low target feel safer than it is.",
        response: "A low target plus movement speed can make the chase feel safer than it is. Stop at fog, tower, or protection. Miss Fortune can punish from range, but she is not Samira or Fizz; if chasing makes you become the engage, let the target go."
      },
      {
        title: "Miss Fortune feels good but may miss the dash-reset loop.",
        response: "Miss Fortune can be easy and visually rewarding enough to play while still missing the dash-reset chaos that made Samira appealing. Use her when the rep is clean farming, easy damage, or lower-stress bot practice. Do not expect her to satisfy the same reward loop as a champion built around entering and resetting."
      }
    ]
  },
  {
    id: "ezreal",
    name: "Ezreal",
    skin: "Faerie Court Ezreal",
    image: `${imageBase}/Ezreal_33.jpg`,
    focus: "Q spam is useful only if the fantasy still feels playable.",
    note: "Ezreal has the satisfying QQQ rhythm, but the champion fantasy may not reward enough reps.",
    situations: [
      {
        title: "Ezreal Q gives safe button spam while the fight is unclear.",
        response: "Ezreal Q gives your hands something safe to do when the fight is uncertain and hard commitment feels bad. Use it as a test button and movement rhythm: Q, move, Q, move. The lesson is safe repetition under pressure, not randomly drifting forward because the button is available."
      },
      {
        title: "Useful Q rhythm does not mean Ezreal will earn reps.",
        response: "The kit can be mechanically useful while the character fantasy still does not make you want to queue more games. Keep the mechanic as a lesson for other champions. A repeatable safe button can lower panic, but a useful lesson is not automatically a main."
      },
      {
        title: "Missing Qs can make safe practice feel like judgment.",
        response: "When several Qs miss, the spam loop can start feeling like proof that you are bad instead of a low-cost way to stay engaged. Keep moving and keep the miss cheap. Ezreal Q is good practice because one miss does not have to commit your body; the next Q is another rep, not a verdict."
      }
    ]
  },
  {
    id: "jhin",
    name: "Jhin",
    skin: "Soul Fighter Jhin",
    image: `${imageBase}/Jhin_36.jpg`,
    focus: "Stylish, but style is not the same as wanting reps.",
    note: "Jhin is a comparison pick, not a forced solution.",
    situations: [
      {
        title: "Jhin looks stylish before you know if you want reps.",
        response: "Jhin can look clean and stylish without making you want to practice him. Use the comparison to name what is missing: reward, safety, sexiness, chaos, or a button loop your hands want. Respecting a champion's style is different from wanting hundreds of reps."
      },
      {
        title: "Slow shot rhythm fights the dopamine you wanted from Samira.",
        response: "His shot timing makes you wait, count, and reset hands when what you wanted was Samira-style mashing. Treat him as pacing practice only if that is the goal for the day. If the goal is dopamine, dash, and reset, forcing Jhin turns style into friction."
      }
    ]
  },
  {
    id: "ashe",
    name: "Ashe",
    skin: "Heartseeker Ashe",
    image: `${imageBase}/Ashe_6.jpg`,
    focus: "Use only when calm utility is the actual goal.",
    note: "Ashe felt boring and ult pressure felt unrewarding, so she should not be forced as a main.",
    situations: [
      {
        title: "Ashe arrow is ready and the whole map feels like a test.",
        response: "When Ashe R is available, the map can start feeling like a test you are about to fail. Use the arrow only when you have one clear target or a simple utility rep. A missed arrow is not the whole game, and forcing the shot because the button is glowing makes the ult feel worse."
      },
      {
        title: "Ashe is safe on paper but may feel too quiet to repeat.",
        response: "A kit can be clear and safe on paper while still feeling too quiet to create reward. Take that seriously and switch when needed. Boredom matters because reps need reward; calm utility is useful only if calm utility is actually what you want to practice."
      },
      {
        title: "Picking the responsible champion can turn practice into punishment.",
        response: "Picking Ashe can feel responsible, but responsibility is not the same as a playable learning loop. Use her for slows, spacing, and simple decisions when that is the specific rep. Do not turn practice into punishment by picking the champion your nervous system least wants to repeat."
      }
    ]
  },
  {
    id: "rammus",
    name: "Rammus",
    skin: "Durian Defender Rammus",
    image: `${imageBase}/Rammus_26.jpg`,
    focus: "Do not make practice feel like punishment.",
    note: "Rammus felt physically boring and irritating. That matters.",
    situations: [
      {
        title: "Rammus is simple, but boredom can kill the practice loop.",
        response: "A champion can be simple on paper and still make your body bored or irritated enough that you stop wanting reps. Respect the boredom signal. Simplicity is not the same as playable; if the champion kills repetition, it is not the right practice room for this system."
      },
      {
        title: "Low-pressure tanking can still feel physically empty.",
        response: "Choosing the simple tank may seem like it should lower pressure, but the lack of button reward can make the whole game feel empty. Do not force the pick to prove discipline. Use the negative fit as information about what the practice room needs: clear body feel, enough reward, and a loop you actually want to repeat."
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

  const title = document.createElement("p");
  title.className = "situation-heading";
  title.textContent = item.title;

  const response = document.createElement("p");
  response.className = "situation-response";
  response.textContent = item.response;

  article.append(title, response);
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
    button.setAttribute("aria-label", `${champion.name}, ${champion.skin}`);
    button.setAttribute("aria-pressed", String(index === 0));
    const img = document.createElement("img");
    img.src = champion.image;
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    button.append(img);
    button.addEventListener("click", () => {
      button.classList.remove("is-flashing");
      void button.offsetWidth;
      button.classList.add("is-flashing");
      window.setTimeout(() => button.classList.remove("is-flashing"), 620);
      renderChampion(champion.id);
    });
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
