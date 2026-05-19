const imageBase = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";

const defaultSoundProfile = {
  duration: 2.8,
  volume: 0.88,
  masterPeak: 0.42,
  masterTail: 0.18,
  thump: { frequency: 42, endFrequency: 28, length: 0.24, gain: 0.42 },
  noise: { start: 0.02, length: 0.86, startFrequency: 4800, endFrequency: 520, gain: 0.2 },
  tail: { frequency: 34, center: 0.78, width: 0.52, gain: 0.018 },
  tones: [
    { type: "sine", frequency: 82.41, endFrequency: 41.2, start: 0, length: 0.66, gain: 0.7, attack: 0.004 },
    { type: "triangle", frequency: 130.81, endFrequency: 82.41, start: 0.018, length: 0.62, gain: 0.38, attack: 0.006 },
    { type: "triangle", frequency: 246.94, start: 0.05, length: 0.5, gain: 0.24, pan: -0.22 },
    { type: "triangle", frequency: 311.13, start: 0.07, length: 0.56, gain: 0.2, pan: 0.2 },
    { type: "triangle", frequency: 392, start: 0.09, length: 0.62, gain: 0.24 },
    { type: "sine", frequency: 493.88, start: 0.14, length: 0.5, gain: 0.16, pan: -0.18 },
    { type: "sine", frequency: 622.25, start: 0.17, length: 0.54, gain: 0.17, pan: 0.18 },
    { type: "sine", frequency: 987.77, start: 0.28, length: 0.5, gain: 0.12, pan: 0.34 },
    { type: "sine", frequency: 1479.98, start: 0.42, length: 0.58, gain: 0.075, pan: 0.12 },
    { type: "sine", frequency: 2217.46, start: 0.66, length: 0.66, gain: 0.045, pan: -0.2 }
  ]
};

const soundProfiles = {
  samira: {
    ...defaultSoundProfile,
    noise: { start: 0.02, length: 0.9, startFrequency: 5600, endFrequency: 680, gain: 0.24 },
    tail: { frequency: 42, center: 0.76, width: 0.5, gain: 0.02 },
    tones: [
      { type: "sawtooth", frequency: 92.5, endFrequency: 46.25, start: 0, length: 0.5, gain: 0.36, attack: 0.004 },
      { type: "triangle", frequency: 185, start: 0.02, length: 0.44, gain: 0.24, pan: -0.28 },
      { type: "triangle", frequency: 277.18, start: 0.06, length: 0.48, gain: 0.18, pan: 0.24 },
      { type: "triangle", frequency: 370, start: 0.1, length: 0.54, gain: 0.22 },
      { type: "sine", frequency: 740, start: 0.18, length: 0.48, gain: 0.14, pan: -0.18 },
      { type: "sine", frequency: 1108.73, start: 0.27, length: 0.44, gain: 0.12, pan: 0.22 },
      { type: "sine", frequency: 1661.22, start: 0.42, length: 0.56, gain: 0.075 }
    ]
  },
  caitlyn: {
    ...defaultSoundProfile,
    duration: 1.2,
    thump: { frequency: 68, endFrequency: 38, length: 0.36, gain: 0.42 },
    noise: { start: 0.008, length: 0.28, startFrequency: 7200, endFrequency: 1300, gain: 0.28 },
    tail: { frequency: 54, center: 0.42, width: 0.28, gain: 0.012 },
    tones: [
      { type: "square", frequency: 1244.51, endFrequency: 622.25, start: 0, length: 0.09, gain: 0.15 },
      { type: "sine", frequency: 311.13, start: 0.025, length: 0.36, gain: 0.2 },
      { type: "sine", frequency: 622.25, start: 0.09, length: 0.42, gain: 0.14, pan: -0.18 },
      { type: "sine", frequency: 1244.51, start: 0.18, length: 0.48, gain: 0.09, pan: 0.18 },
      { type: "sine", frequency: 1864.66, start: 0.32, length: 0.48, gain: 0.055 }
    ]
  },
  fizz: {
    ...defaultSoundProfile,
    duration: 1.28,
    thump: { frequency: 120, endFrequency: 80, length: 0.2, gain: 0.22 },
    noise: { start: 0.02, length: 0.52, startFrequency: 1800, endFrequency: 4200, gain: 0.13 },
    tail: { frequency: 72, center: 0.5, width: 0.38, gain: 0.014 },
    tones: [
      { type: "sine", frequency: 261.63, endFrequency: 392, start: 0, length: 0.28, gain: 0.22, pan: -0.28 },
      { type: "triangle", frequency: 392, endFrequency: 587.33, start: 0.08, length: 0.3, gain: 0.18, pan: 0.28 },
      { type: "sine", frequency: 783.99, start: 0.2, length: 0.32, gain: 0.15 },
      { type: "sine", frequency: 987.77, start: 0.34, length: 0.38, gain: 0.11, pan: -0.16 },
      { type: "triangle", frequency: 1318.51, start: 0.52, length: 0.36, gain: 0.08, pan: 0.16 }
    ]
  },
  kaisa: {
    ...defaultSoundProfile,
    duration: 1.46,
    thump: { frequency: 55, endFrequency: 38, length: 0.36, gain: 0.44 },
    noise: { start: 0.03, length: 0.76, startFrequency: 6400, endFrequency: 900, gain: 0.17 },
    tail: { frequency: 48, center: 0.72, width: 0.5, gain: 0.022 },
    tones: [
      { type: "sawtooth", frequency: 110, endFrequency: 82.41, start: 0, length: 0.5, gain: 0.28 },
      { type: "triangle", frequency: 220, start: 0.04, length: 0.52, gain: 0.18, pan: -0.22 },
      { type: "sine", frequency: 440, start: 0.11, length: 0.56, gain: 0.18, pan: 0.22 },
      { type: "sine", frequency: 659.25, start: 0.22, length: 0.5, gain: 0.13 },
      { type: "sine", frequency: 987.77, start: 0.38, length: 0.52, gain: 0.09 },
      { type: "sine", frequency: 1975.53, start: 0.62, length: 0.48, gain: 0.05 }
    ]
  },
  missfortune: {
    ...defaultSoundProfile,
    duration: 1.36,
    thump: { frequency: 50, endFrequency: 30, length: 0.34, gain: 0.6 },
    noise: { start: 0, length: 0.5, startFrequency: 3600, endFrequency: 420, gain: 0.24 },
    tail: { frequency: 38, center: 0.56, width: 0.44, gain: 0.02 },
    tones: [
      { type: "sawtooth", frequency: 146.83, endFrequency: 98, start: 0, length: 0.42, gain: 0.25 },
      { type: "triangle", frequency: 293.66, start: 0.05, length: 0.48, gain: 0.23, pan: -0.2 },
      { type: "triangle", frequency: 440, start: 0.12, length: 0.48, gain: 0.19, pan: 0.2 },
      { type: "sine", frequency: 587.33, start: 0.2, length: 0.48, gain: 0.12 },
      { type: "sine", frequency: 880, start: 0.34, length: 0.5, gain: 0.08 }
    ]
  },
  ezreal: {
    ...defaultSoundProfile,
    duration: 1.26,
    thump: { frequency: 76, endFrequency: 52, length: 0.36, gain: 0.24 },
    noise: { start: 0.02, length: 0.42, startFrequency: 5800, endFrequency: 1600, gain: 0.12 },
    tail: { frequency: 62, center: 0.62, width: 0.42, gain: 0.015 },
    tones: [
      { type: "sine", frequency: 392, start: 0, length: 0.34, gain: 0.14, pan: -0.35 },
      { type: "sine", frequency: 587.33, start: 0.08, length: 0.24, gain: 0.16, pan: 0.25 },
      { type: "sine", frequency: 783.99, start: 0.16, length: 0.28, gain: 0.14, pan: -0.18 },
      { type: "triangle", frequency: 1174.66, start: 0.28, length: 0.36, gain: 0.11, pan: 0.18 },
      { type: "sine", frequency: 1567.98, start: 0.44, length: 0.42, gain: 0.08 }
    ]
  },
  jhin: {
    ...defaultSoundProfile,
    duration: 1.72,
    thump: { frequency: 48, endFrequency: 32, length: 0.42, gain: 0.5 },
    noise: { start: 0.02, length: 0.62, startFrequency: 3200, endFrequency: 720, gain: 0.16 },
    tail: { frequency: 44, center: 0.86, width: 0.62, gain: 0.018 },
    tones: [
      { type: "triangle", frequency: 196, start: 0, length: 0.32, gain: 0.22 },
      { type: "triangle", frequency: 246.94, start: 0.16, length: 0.34, gain: 0.19 },
      { type: "triangle", frequency: 293.66, start: 0.34, length: 0.36, gain: 0.17 },
      { type: "sine", frequency: 392, start: 0.58, length: 0.72, gain: 0.2 },
      { type: "sine", frequency: 784, start: 0.76, length: 0.58, gain: 0.07 }
    ]
  },
  ashe: {
    ...defaultSoundProfile,
    duration: 1.4,
    thump: { frequency: 64, endFrequency: 44, length: 0.26, gain: 0.28 },
    noise: { start: 0.02, length: 0.72, startFrequency: 7600, endFrequency: 2200, gain: 0.14 },
    tail: { frequency: 52, center: 0.68, width: 0.5, gain: 0.012 },
    tones: [
      { type: "sine", frequency: 523.25, start: 0, length: 0.5, gain: 0.16, pan: -0.22 },
      { type: "sine", frequency: 783.99, start: 0.09, length: 0.56, gain: 0.16, pan: 0.22 },
      { type: "sine", frequency: 1046.5, start: 0.18, length: 0.58, gain: 0.12 },
      { type: "sine", frequency: 1567.98, start: 0.36, length: 0.62, gain: 0.08 },
      { type: "sine", frequency: 2093, start: 0.6, length: 0.5, gain: 0.05 }
    ]
  },
  rammus: {
    ...defaultSoundProfile,
    duration: 1.24,
    thump: { frequency: 38, endFrequency: 24, length: 0.46, gain: 0.68 },
    noise: { start: 0.02, length: 0.44, startFrequency: 1600, endFrequency: 260, gain: 0.18 },
    tail: { frequency: 28, center: 0.52, width: 0.4, gain: 0.026 },
    tones: [
      { type: "square", frequency: 73.42, endFrequency: 55, start: 0, length: 0.4, gain: 0.22 },
      { type: "triangle", frequency: 110, start: 0.04, length: 0.42, gain: 0.2 },
      { type: "triangle", frequency: 146.83, start: 0.14, length: 0.42, gain: 0.14 },
      { type: "sine", frequency: 220, start: 0.3, length: 0.38, gain: 0.08 }
    ]
  }
};

const defaultSoundScene = [
  { kind: "drum", frequency: 36, endFrequency: 18, start: 0, length: 0.72, gain: 0.9 },
  { kind: "brass", notes: [55, 82.41, 110], start: 0.08, length: 1.08, gain: 0.28 },
  { kind: "choir", notes: [164.81, 246.94, 329.63], start: 0.24, length: 1.5, gain: 0.14 },
  { kind: "noise", filter: "lowpass", start: 0.04, length: 1.3, startFrequency: 1800, endFrequency: 120, gain: 0.2, q: 0.4 },
  { kind: "bell", notes: [987.77, 1479.98], start: 0.58, length: 1.08, gain: 0.1 }
];

const soundScenes = {
  samira: [
    { kind: "cinematic", flavor: "gunblade", start: 0, length: 1.45, gain: 0.78 },
    { kind: "drum", frequency: 43, endFrequency: 18, start: 0, length: 0.72, gain: 1.04 },
    { kind: "noise", filter: "bandpass", start: 0.04, length: 0.52, startFrequency: 4200, endFrequency: 1100, gain: 0.18, pan: -0.74 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 0.52, startFrequency: 3800, endFrequency: 980, gain: 0.17, pan: 0.7 },
    { kind: "brass", notes: [73.42, 110, 146.83], start: 0.1, length: 1.1, gain: 0.3, pan: -0.08 },
    { kind: "string", notes: [220, 277.18, 370], start: 0.34, length: 0.95, gain: 0.16, pan: 0.18 },
    { kind: "bloom", frequency: 112, endFrequency: 36, start: 0.62, length: 0.56, gain: 0.42 }
  ],
  caitlyn: [
    { kind: "cinematic", flavor: "sniper", start: 0, length: 1.65, gain: 0.74 },
    { kind: "noise", filter: "lowpass", start: 0, length: 0.8, startFrequency: 900, endFrequency: 110, gain: 0.22 },
    { kind: "bell", notes: [1244.51, 1864.66], start: 0.06, length: 1.15, gain: 0.12 },
    { kind: "bloom", frequency: 92, endFrequency: 32, start: 0.28, length: 0.62, gain: 0.46 },
    { kind: "drum", frequency: 34, endFrequency: 16, start: 0.3, length: 0.7, gain: 0.58 },
    { kind: "brass", notes: [46.25, 69.3, 92.5], start: 0.38, length: 1.22, gain: 0.24 },
    { kind: "noise", filter: "bandpass", start: 0.32, length: 0.5, startFrequency: 5200, endFrequency: 940, gain: 0.2, pan: 0.34 }
  ],
  fizz: [
    { kind: "cinematic", flavor: "monster", start: 0, length: 1.7, gain: 0.82 },
    { kind: "water", start: 0, length: 1.25, gain: 0.4, pan: -0.12 },
    { kind: "drum", frequency: 66, endFrequency: 24, start: 0.05, length: 0.48, gain: 0.56 },
    { kind: "bell", notes: [392, 587.33, 783.99], start: 0.14, length: 0.8, gain: 0.12, pan: 0.18 },
    { kind: "water", start: 0.48, length: 1.0, gain: 0.32, pan: 0.34 },
    { kind: "string", notes: [261.63, 392, 523.25], start: 0.58, length: 0.95, gain: 0.13 },
    { kind: "noise", filter: "bandpass", start: 0.88, length: 0.72, startFrequency: 4200, endFrequency: 1100, gain: 0.12 }
  ],
  kaisa: [
    { kind: "cinematic", flavor: "void", start: 0, length: 1.65, gain: 0.78 },
    { kind: "choir", notes: [55, 82.41, 164.81], start: 0, length: 1.62, gain: 0.22 },
    { kind: "pulse", notes: [110, 220, 440], start: 0.08, length: 1.22, gain: 0.22, pan: -0.18 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 1.15, startFrequency: 9200, endFrequency: 180, gain: 0.28, q: 0.34 },
    { kind: "brass", notes: [65.41, 98, 130.81], start: 0.42, length: 1.06, gain: 0.22 },
    { kind: "bloom", frequency: 78, endFrequency: 22, start: 0.72, length: 0.62, gain: 0.36 },
    { kind: "string", notes: [329.63, 493.88, 987.77], start: 0.9, length: 0.95, gain: 0.11, pan: 0.24 }
  ],
  missfortune: [
    { kind: "cinematic", flavor: "sax", start: 0, length: 1.62, gain: 0.76 },
    { kind: "drum", frequency: 40, endFrequency: 18, start: 0, length: 0.78, gain: 0.86 },
    { kind: "brass", notes: [65.41, 98, 130.81, 196], start: 0.04, length: 1.18, gain: 0.3 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 0.48, startFrequency: 4800, endFrequency: 900, gain: 0.18, pan: -0.62 },
    { kind: "bloom", frequency: 98, endFrequency: 30, start: 0.18, length: 0.58, gain: 0.34, pan: -0.24 },
    { kind: "noise", filter: "bandpass", start: 0.38, length: 0.48, startFrequency: 4800, endFrequency: 900, gain: 0.18, pan: 0.62 },
    { kind: "bloom", frequency: 92, endFrequency: 28, start: 0.38, length: 0.58, gain: 0.35, pan: 0.24 },
    { kind: "string", notes: [293.66, 440, 587.33], start: 0.56, length: 1.04, gain: 0.13 }
  ],
  ezreal: [
    { kind: "cinematic", flavor: "arcane", start: 0, length: 1.45, gain: 0.72 },
    { kind: "spark", notes: [392, 587.33, 783.99], start: 0, length: 0.62, gain: 0.16, pan: -0.42 },
    { kind: "spark", notes: [523.25, 783.99, 1174.66], start: 0.18, length: 0.68, gain: 0.15, pan: 0.42 },
    { kind: "string", notes: [196, 293.66, 392], start: 0.32, length: 1.0, gain: 0.14 },
    { kind: "bloom", frequency: 84, endFrequency: 30, start: 0.5, length: 0.58, gain: 0.32 },
    { kind: "drum", frequency: 46, endFrequency: 22, start: 0.54, length: 0.5, gain: 0.42 },
    { kind: "noise", filter: "bandpass", start: 0.64, length: 0.82, startFrequency: 11200, endFrequency: 2200, gain: 0.18 }
  ],
  jhin: [
    { kind: "cinematic", flavor: "curtain", start: 0, length: 1.9, gain: 0.82 },
    { kind: "string", notes: [196], start: 0, length: 0.52, gain: 0.18 },
    { kind: "string", notes: [246.94], start: 0.24, length: 0.54, gain: 0.17 },
    { kind: "string", notes: [293.66], start: 0.5, length: 0.56, gain: 0.16 },
    { kind: "bell", notes: [392, 783.99], start: 0.8, length: 1.1, gain: 0.14 },
    { kind: "bloom", frequency: 58, endFrequency: 14, start: 0.82, length: 0.82, gain: 0.58 },
    { kind: "brass", notes: [49, 73.42, 98], start: 0.92, length: 1.1, gain: 0.28 },
    { kind: "choir", notes: [146.83, 220, 293.66], start: 1.06, length: 1.2, gain: 0.12 }
  ],
  ashe: [
    { kind: "cinematic", flavor: "ice", start: 0, length: 1.6, gain: 0.7 },
    { kind: "string", notes: [261.63, 392, 523.25], start: 0, length: 1.12, gain: 0.16, pan: -0.2 },
    { kind: "bell", notes: [1046.5, 1567.98, 2093], start: 0.12, length: 1.18, gain: 0.12, pan: 0.2 },
    { kind: "noise", filter: "bandpass", start: 0.16, length: 0.88, startFrequency: 6200, endFrequency: 1500, gain: 0.12 },
    { kind: "bloom", frequency: 72, endFrequency: 28, start: 0.46, length: 0.58, gain: 0.26 },
    { kind: "choir", notes: [174.61, 261.63, 349.23], start: 0.62, length: 1.18, gain: 0.11 }
  ],
  rammus: [
    { kind: "cinematic", flavor: "quake", start: 0, length: 1.58, gain: 0.84 },
    { kind: "roll", frequency: 30, endFrequency: 12, start: 0, length: 1.52, gain: 0.86 },
    { kind: "drum", frequency: 28, endFrequency: 12, start: 0.02, length: 0.92, gain: 0.92 },
    { kind: "noise", filter: "lowpass", start: 0.08, length: 1.38, startFrequency: 1600, endFrequency: 80, gain: 0.36, q: 0.35 },
    { kind: "bloom", frequency: 52, endFrequency: 18, start: 0.5, length: 0.62, gain: 0.4 },
    { kind: "bloom", frequency: 42, endFrequency: 14, start: 0.92, length: 0.62, gain: 0.32 },
    { kind: "brass", notes: [36.71, 55, 73.42], start: 0.86, length: 1.05, gain: 0.22 }
  ]
};

const defaultFxProfile = {
  id: "default",
  main: "255, 238, 174",
  secondary: "226, 156, 190",
  third: "100, 143, 137",
  dark: "45, 36, 38",
  sparkColors: ["255, 238, 174", "226, 156, 190", "100, 143, 137", "255, 250, 224"],
  sparkCount: 72,
  spread: 0.34,
  sliceAngles: [18, -24, 68, -72],
  glyphs: ["crest"]
};

const fxProfiles = {
  samira: {
    id: "samira",
    main: "255, 184, 96",
    secondary: "239, 81, 129",
    third: "91, 196, 185",
    dark: "54, 24, 34",
    sparkColors: ["255, 184, 96", "239, 81, 129", "91, 196, 185", "255, 246, 214"],
    sparkCount: 92,
    spread: 0.38,
    sliceAngles: [14, -18, 44, -48],
    glyphs: ["blade-left", "blade-right", "muzzle"]
  },
  caitlyn: {
    id: "caitlyn",
    main: "255, 216, 139",
    secondary: "115, 207, 224",
    third: "238, 147, 188",
    dark: "42, 37, 62",
    sparkColors: ["255, 216, 139", "115, 207, 224", "238, 147, 188", "255, 251, 225"],
    sparkCount: 64,
    spread: 0.3,
    sliceAngles: [0, 90, 45, -45],
    glyphs: ["crosshair", "bullet"]
  },
  fizz: {
    id: "fizz",
    main: "86, 224, 232",
    secondary: "255, 152, 90",
    third: "190, 112, 222",
    dark: "23, 48, 58",
    sparkColors: ["86, 224, 232", "255, 152, 90", "190, 112, 222", "232, 255, 250"],
    sparkCount: 76,
    spread: 0.32,
    sliceAngles: [28, -28, 78, -78],
    glyphs: ["bubble-one", "bubble-two", "wave"]
  },
  kaisa: {
    id: "kaisa",
    main: "244, 119, 220",
    secondary: "116, 122, 255",
    third: "96, 234, 219",
    dark: "45, 28, 70",
    sparkColors: ["244, 119, 220", "116, 122, 255", "96, 234, 219", "255, 237, 252"],
    sparkCount: 88,
    spread: 0.36,
    sliceAngles: [20, -34, 70, -64],
    glyphs: ["void-diamond", "void-wing-left", "void-wing-right"]
  },
  missfortune: {
    id: "missfortune",
    main: "255, 187, 87",
    secondary: "226, 64, 92",
    third: "244, 151, 193",
    dark: "60, 31, 28",
    sparkColors: ["255, 187, 87", "226, 64, 92", "244, 151, 193", "255, 244, 217"],
    sparkCount: 84,
    spread: 0.36,
    sliceAngles: [8, -8, 22, -22],
    glyphs: ["pistol-left", "pistol-right", "muzzle"]
  },
  ezreal: {
    id: "ezreal",
    main: "97, 209, 255",
    secondary: "255, 216, 93",
    third: "124, 126, 255",
    dark: "28, 43, 70",
    sparkColors: ["97, 209, 255", "255, 216, 93", "124, 126, 255", "239, 251, 255"],
    sparkCount: 78,
    spread: 0.33,
    sliceAngles: [32, -32, 58, -58],
    glyphs: ["blink-one", "blink-two", "chevron"]
  },
  jhin: {
    id: "jhin",
    main: "255, 213, 134",
    secondary: "178, 39, 73",
    third: "238, 180, 220",
    dark: "43, 25, 31",
    sparkColors: ["255, 213, 134", "178, 39, 73", "238, 180, 220", "255, 250, 232"],
    sparkCount: 68,
    spread: 0.31,
    sliceAngles: [0, 90, 180, 270],
    glyphs: ["petal-one", "petal-two", "petal-three", "petal-four"]
  },
  ashe: {
    id: "ashe",
    main: "166, 236, 255",
    secondary: "110, 160, 255",
    third: "255, 169, 214",
    dark: "28, 45, 66",
    sparkColors: ["166, 236, 255", "110, 160, 255", "255, 169, 214", "247, 254, 255"],
    sparkCount: 72,
    spread: 0.34,
    sliceAngles: [0, 180, 24, -24],
    glyphs: ["ice-arrow", "ice-shard-left", "ice-shard-right"]
  },
  rammus: {
    id: "rammus",
    main: "188, 221, 86",
    secondary: "255, 207, 92",
    third: "101, 167, 94",
    dark: "40, 58, 30",
    sparkColors: ["188, 221, 86", "255, 207, 92", "101, 167, 94", "255, 249, 218"],
    sparkCount: 70,
    spread: 0.3,
    sliceAngles: [12, -12, 78, -78],
    glyphs: ["shell", "quake", "spike-ring"]
  }
};

const champions = [
  {
    id: "samira",
    name: "Samira",
    skin: "Ningning Samira",
    person: "Ningning",
    snippet: "Life's Too Short",
    image: "/assets/champions/samira-ningning-cat.png",
    focus: "Recording review is the current queue plan.",
    note: "Samira can mash in, but she cannot always leave. Her escape is killing, resetting, lifestealing, blocking the real spell, or using Flash.",
    situations: [
      {
        title: "E feels urgent before you know if the target is killable.",
        response: "When the fight starts moving, your body may want E to remove uncertainty. Do not let the dash be the first answer. Start with Q or an auto from safety so the fight gives information first: is the target losing, reachable, and not protected by fresh CC or teammates? If the only reason to dash is panic, keep E unused and make the next safe action."
      },
      {
        title: "You do not recognize which CC can stop the dash.",
        response: "If you cannot name the stun, root, hook, charm, engage, or point-and-click lockdown that can stop you, do not E in first. Play Q-only: Q, safe auto, move, Q, and watch one danger spell. Sidestep or W flying threats like Lux Q, Morgana Q, Xerath E, Ahri charm, Ashe R, Anivia Q, and hooks; assume Annie walking near you has stun loaded; back up when Leona, Nautilus, Rell, Alistar, Rakan, or Pantheon walks at you; do not dive Malzahar, Lissandra, Warwick, Skarner-style grab, or Vi alone. When the scary spell misses, is used on someone else, or the fight is already messy, E is allowed only if the target is low and reachable."
      },
      {
        title: "Xerath or Annie is on screen and you cannot tell if the stun is ready.",
        response: "Treat them like loaded guns until the evidence changes. Xerath stun is the bright blue-purple ball flying straight at you: move sideways, Q from range, and W only if the ball is actually going to hit. Annie is harder because her stun is a passive, so the beginner rule is simpler: Annie walking toward you means assume stun ready. Into either champion, do not E first while they are facing you; wait for the stun to miss, hit someone else, or get spent before Samira enters."
      },
      {
        title: "A dangerous spell sound happens and your hand wants W immediately.",
        response: "Sound is a warning, not the final trigger. Use the chain: sound means look, visual means confirm, W means block. Lux Q, Morgana Q, Ashe R, Amumu Q, Blitz hook, Xerath E, Anivia Q, Ahri charm, Thresh hook, Nautilus hook, Seraphine root/ult, Zyra root, Bard Q, Jhin W, and similar threats should make your eyes snap to the projectile. Press W when it is actually coming toward you, not when fear says maybe."
      },
      {
        title: "Amumu throws bandage and you are unsure if W can save you.",
        response: "If Amumu is an enemy, W is for Bandage Toss, not his area ult. Press W when the bandage is already flying toward you, ideally about one or two champion widths away. If Amumu is very close, W on the throw animation; if he is far, sidestep first and W only if the bandage is still on track to hit. If Amumu is your ally, his Q or R starts the fight and your job is to follow late, not spend W randomly."
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
        title: "A low enemy enters an unwarded bush and the health bar pulls you in.",
        response: "Low enemy plus unwarded bush is bait until proven safe. Do not enter a bush you cannot see just because the target is low. Q from outside if they are visible, ward only if it is safe, go with a teammate, or take the wave, tower, or objective instead. The moment you lose vision, the kill is no longer a Samira reward; it is a test of whether panic can make you walk into hidden damage."
      },
      {
        title: "Jinx and Xerath turn lane into poke hell and CS starts feeling impossible.",
        response: "This is a survival lane, not a Samira fun lane. Back up behind caster minions, stop trading, Q only for safe CS, and move side to side when Xerath aims. Do not start the fight. Go only when Xerath stun misses, Zilean or your support lands real help, Jinx is low, traps are not blocking the path, or they walk too far forward. Below 50 percent HP, stop walking up; around 35 to 40 percent, recall instead of proving you can stay."
      },
      {
        title: "Jinx flashes in while Morgana is nearby and the whole fight feels sudden.",
        response: "Jinx flashing in is not automatically death; Jinx flashing in plus Morgana bind is the real danger. Step back first. Exhaust Jinx if she is actually hitting you, W Morgana Q if it is flying at you, and Q Jinx while backing up. E only if Jinx becomes low or overextended and Morgana bind is no longer the next thing that can stop you from playing."
      },
      {
        title: "After E, being close to enemies makes W feel like armor.",
        response: "After dashing in, being close can feel scary enough that your hands spend W immediately. Hold it. W is for the actual thing that would stop you: Lux Q, Ashe R, a hook, a bind, or another visible projectile. It is a parry, not armor; using it early often means the real danger hits after the circle ends."
      },
      {
        title: "You are near a team fight, R is not ready, and waiting there starts costing HP.",
        response: "If you do not have S yet, standing near the group is not preparation; it is leaking health while your hands wait for permission to ult. Move to the edge first. Build style from safety with Q, auto, and one real W block if a projectile is coming. Do not E just to finish the style bar unless the target is already losing, reachable, and the scary CC is gone. The pre-ult job is edge, poke, breathe, check S; only when S exists and the fight is already committed do you enter for R."
      },
      {
        title: "S rank appears and R starts feeling like it must fire.",
        response: "S rank means R is loaded, not that R must fire. R is the payoff after Q, autos, W, and E have already made the enemy disadvantaged. Use it to finish someone, hit multiple people who are already losing, or cash out a fight that is cracked open. If enemies are full HP, tanky, armored, walking away, or still holding CC, R can feel weak and get you killed. R when they are already losing, not to make them lose."
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
        title: "You tunnel on killing one target and stop seeing who is hitting you.",
        response: "Target tunnel is death. Use target, danger, target, danger: after every two buttons, check who is hitting you and whether a second enemy is creating the real problem. Kill the low target unless you become the low target. If chasing Jinx makes Morgana, Xerath, Annie, or another threat start hitting or CC'ing you, the kill has become bait and the correct play is to stop chasing."
      },
      {
        title: "You do not know what is happening and panic wants E.",
        response: "Uncertainty means distance. If you know they are losing, E or R can happen; if you do not know, run or Q from range. The panic loop is Q, move back, Q, move back. E is not allowed until the situation becomes readable again. Running when confused is not cowardice; it is the reset that keeps panic from becoming a free death."
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
        title: "Your team is bad and farming alone starts feeling like the whole answer.",
        response: "Safe gold matters, but safe gold still has to connect to fights. Farm only on your side of the map, with a path back, and without entering fog. Mid is usually safer than deep side lane because it is shorter, closer to teammates, and easier to retreat from. If enemies start grouping, hover toward team but stay on the edge. The missing piece is safe gold plus late entry: be close enough to clean up after big enemy spells fly."
      },
      {
        title: "A good Samira game makes reckless Samira feel unlocked.",
        response: "The lesson from S+ and A+ games is not that you are now allowed to E whenever. The lesson is that the boring rules caused the good game: Q a lot, save W for real danger, wait for enemy disadvantage, E only when real, R only when they are losing, stay near teammates, run when chased, and leave bad fights. A good game proves the blueprint; it does not remove the blueprint."
      },
      {
        title: "Normals still feel like judgment even when you are improving.",
        response: "Normals are reps, not a verdict. Getting poked is damage tolerance, dying is reset tolerance, getting baited is bait recognition, panicking is fighting-with-anxiety, remembering Q before E is Samira improvement, blocking one spell with W is huge, losing is exposure, and winning is confidence. The objective is making human games familiar enough that your hands can use the rules."
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
    skin: "Hanni Fizz",
    person: "Hanni",
    snippet: "Cookie",
    image: "/assets/champions/fizz-hanni.png",
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

const pageChampionIds = ["samira", "fizz"];
const pageChampions = champions.filter((champion) => pageChampionIds.includes(champion.id));

const recordingReview = {
  match: "NA1-5563247854",
  captured: "May 18, 2026, 5:46-5:57 PM ET",
  totalDuration: "5:57",
  totalRecordings: 13,
  reviewBasis: "Recording review is ordered as a queue plan with one feedback note per file.",
  mainFeedback: {
    title: "Samira: kill, crash, reset",
    focus: "The climb gap is conversion, not damage: every won fight must become wave crash, tower, dragon, Baron, nexus, or a recall with gold.",
    rule: "No second E/R unless the payout is secured or the next target is isolated, low, and the exit is named.",
    nextRep: "Queue cue: kill -> payout -> reset.",
    whyTrust: "This is trustworthy because deaths with shutdown gold erase the leads Samira creates; conversion turns the same mechanics into XP, tempo, and objectives."
  },
  detectedChampions: [
    {
      id: "samira",
      name: "Samira",
      confidence: "high",
      recordings: 13,
      evidence: "Replay side list names Samira on Alan's team; sampled clips center the Soul Fighter Samira model and nameplate.",
      improvementTitle: "Convert the first win",
      improvement: "The damage is already there. The repeatable habit is turning the first kill into XP, tempo, structure damage, objective setup, or a clean reset before another fight."
    }
  ],
  recordings: [
    { title: "highlight 01", duration: "0:06", kind: "highlight", champion: "Samira", feedbackTitle: "Ask for the payout first", feedback: "Before committing, know what the win buys: crash, plate, tower, dragon move, recall, or end.", src: "/recordings/16-10_NA1-5563247854_01.webm", poster: "/recordings/posters/16-10-na1-5563247854-01.jpg" },
    { title: "highlight 02", duration: "0:17", kind: "highlight", champion: "Samira", feedbackTitle: "Name the CC before going in", feedback: "Before E/R, identify the one spell that cancels the play; enter only after it is spent, blocked by W, or aimed elsewhere.", src: "/recordings/16-10_NA1-5563247854_02.webm", poster: "/recordings/posters/16-10-na1-5563247854-02.jpg" },
    { title: "highlight 03", duration: "0:12", kind: "highlight", champion: "Samira", feedbackTitle: "Stop chasing at fog", feedback: "A low target past vision is not free; shove the wave or take plate unless the next enemy position is known.", src: "/recordings/16-10_NA1-5563247854_03.webm", poster: "/recordings/posters/16-10-na1-5563247854-03.jpg" },
    { title: "highlight 04", duration: "0:16", kind: "highlight", champion: "Samira", feedbackTitle: "Turn bot kills into tempo", feedback: "After the first kill or forced recall, crash wave first, then choose plate, dragon move, reset, or support roam.", src: "/recordings/16-10_NA1-5563247854_04.webm", poster: "/recordings/posters/16-10-na1-5563247854-04.jpg" },
    { title: "highlight 05", duration: "0:42", kind: "highlight", champion: "Samira", feedbackTitle: "Fight from the edge first", feedback: "Let Q, autos, and W collect cooldowns before entering; Samira should clean the fight, not start it blind.", src: "/recordings/16-10_NA1-5563247854_05.webm", poster: "/recordings/posters/16-10-na1-5563247854-05.jpg" },
    { title: "highlight 06", duration: "0:01", kind: "highlight", champion: "Samira", feedbackTitle: "Make clips reviewable", feedback: "Keep at least five seconds before and after the fight so the trigger, cooldowns, and exit can be judged.", src: "/recordings/16-10_NA1-5563247854_06.webm", poster: "/recordings/posters/16-10-na1-5563247854-06.jpg" },
    { title: "highlight 07", duration: "0:13", kind: "highlight", champion: "Samira", feedbackTitle: "Recall with shutdown value", feedback: "After a tower or multi-kill, leave while holding gold; dying after the win gives away the tempo that should climb.", src: "/recordings/16-10_NA1-5563247854_07.webm", poster: "/recordings/posters/16-10-na1-5563247854-07.jpg" },
    { title: "highlight 08", duration: "0:17", kind: "highlight", champion: "Samira", feedbackTitle: "Count numbers before answering", feedback: "If a teammate dies nearby, count visible enemies before joining; do not spend E to rescue a fight already lost.", src: "/recordings/16-10_NA1-5563247854_08.webm", poster: "/recordings/posters/16-10-na1-5563247854-08.jpg" },
    { title: "highlight 09", duration: "0:26", kind: "highlight", champion: "Samira", feedbackTitle: "Side farm only with cover", feedback: "Catch the wave, then leave toward teammates; stay side only when mid has priority or three enemies are visible.", src: "/recordings/16-10_NA1-5563247854_09.webm", poster: "/recordings/posters/16-10-na1-5563247854-09.jpg" },
    { title: "highlight 10", duration: "0:11", kind: "highlight", champion: "Samira", feedbackTitle: "Do not duel without the exit", feedback: "When an enemy catches a wave, pressure the objective first; take the duel only with ult, summoner info, and a walk-out.", src: "/recordings/16-10_NA1-5563247854_10.webm", poster: "/recordings/posters/16-10-na1-5563247854-10.jpg" },
    { title: "highlight 11", duration: "0:12", kind: "highlight", champion: "Samira", feedbackTitle: "Never be first into choke", feedback: "At jungle walls, hold the edge until enemy CC is used; entering first makes Samira the target instead of the finisher.", src: "/recordings/16-10_NA1-5563247854_11.webm", poster: "/recordings/posters/16-10-na1-5563247854-11.jpg" },
    { title: "highlight 12", duration: "0:50", kind: "highlight", champion: "Samira", feedbackTitle: "End after the base win", feedback: "At inhib or nexus, kills are only a tool; hit the structure as soon as the fight is won instead of extending.", src: "/recordings/16-10_NA1-5563247854_12.webm", poster: "/recordings/posters/16-10-na1-5563247854-12.jpg" },
    { title: "full game 8x", duration: "2:09", kind: "full 8x", champion: "Samira", feedbackTitle: "Cut the 10-death pattern", feedback: "16/10 Samira says damage is not the gap; climb by refusing the second fight unless it buys tower, dragon, Baron, or nexus.", src: "/recordings/16-10_NA1-5563247854_13.mp4", poster: "/recordings/posters/16-10-na1-5563247854-13.jpg" }
  ]
};

const championPicker = document.querySelector("#champion-picker");
const championPanel = document.querySelector("#champion-panel");
const championName = document.querySelector("#champion-name");
const championFocus = document.querySelector("#champion-focus");
const championNote = document.querySelector("#champion-note");
const situationsSection = document.querySelector(".situations");
const situationCount = document.querySelector("#situation-count");
const situationList = document.querySelector("#situation-list");
const recordingsSection = document.querySelector(".recordings");
const recordingTitle = document.querySelector("#recordings-title");
const recordingSummary = document.querySelector("#recording-summary");
const recordingFocus = document.querySelector("#recording-focus");
const recordingGrid = document.querySelector("#recording-grid");
const recordingPreview = document.querySelector("#recording-preview");
const page = document.querySelector(".page");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentChampionId = "";
let activeRecordingFile = "";
let recordingReviewData = recordingReview;
let championAtmosphere;
let swapTimer = 0;
let settleTimer = 0;
let audioContext;
let activeStinger;
const fallbackAudioUrls = {};
let burstTimer = 0;
let fxTimer = 0;
const stingerVersion = "20260518-cinematic53";
const visualFxVersion = "20260518-world-vfx24";
let vfx3dModulePromise;
const vfx3dWarmPromises = {};
let vfx2dWarmPromise;
let ultimateShaderWarmPromise;
let cinematicPrimeStarted = false;
let vfxWarmQueueStarted = false;
const stingerUrls = Object.fromEntries(champions.map((champion) => [
  champion.id,
  `/audio/${champion.id}.mp3?v=${stingerVersion}`
]));

function soundProfileId(profileId = "default") {
  if (profileId === "samira") return "missfortune";
  if (profileId === "fizz") return "caitlyn";
  return profileId;
}

const visualDurations = {
  samira: 760,
  caitlyn: 720,
  fizz: 700,
  kaisa: 800,
  missfortune: 760,
  ezreal: 760,
  jhin: 860,
  ashe: 740,
  rammus: 820
};

const shaderSceneIds = {
  default: 0,
  samira: 1,
  caitlyn: 2,
  fizz: 3,
  kaisa: 4,
  missfortune: 5,
  ezreal: 6,
  jhin: 7,
  ashe: 8,
  rammus: 9
};

const defaultCinematicStage = {
  focusX: 0.5,
  focusY: 0.48,
  zoomStart: 1.1,
  zoomEnd: 1.22,
  panX: 0,
  panY: 0,
  roll: 0,
  impacts: [0.16, 0.54, 0.82],
  material: "aura"
};

const cinematicStages = {
  samira: {
    focusX: 0.44,
    focusY: 0.45,
    zoomStart: 1.12,
    zoomEnd: 1.34,
    panX: -0.04,
    panY: 0.02,
    roll: -0.018,
    impacts: [0.08, 0.34, 0.58, 0.82],
    material: "blade"
  },
  caitlyn: {
    focusX: 0.52,
    focusY: 0.43,
    zoomStart: 1.08,
    zoomEnd: 1.24,
    panX: 0.02,
    panY: -0.03,
    roll: 0.006,
    impacts: [0.14, 0.42, 0.7],
    material: "scope"
  },
  fizz: {
    focusX: 0.5,
    focusY: 0.44,
    zoomStart: 1.1,
    zoomEnd: 1.28,
    panX: 0.01,
    panY: 0.04,
    roll: -0.012,
    impacts: [0.08, 0.48, 0.78],
    material: "water"
  },
  kaisa: {
    focusX: 0.5,
    focusY: 0.44,
    zoomStart: 1.08,
    zoomEnd: 1.3,
    panX: 0.02,
    panY: -0.01,
    roll: 0.014,
    impacts: [0.12, 0.46, 0.72],
    material: "void"
  },
  missfortune: {
    focusX: 0.52,
    focusY: 0.46,
    zoomStart: 1.1,
    zoomEnd: 1.27,
    panX: -0.01,
    panY: 0.02,
    roll: 0.008,
    impacts: [0.12, 0.34, 0.62],
    material: "gunfire"
  },
  ezreal: {
    focusX: 0.48,
    focusY: 0.43,
    zoomStart: 1.1,
    zoomEnd: 1.32,
    panX: -0.03,
    panY: -0.02,
    roll: -0.018,
    impacts: [0.1, 0.38, 0.72],
    material: "arcane"
  },
  jhin: {
    focusX: 0.5,
    focusY: 0.44,
    zoomStart: 1.08,
    zoomEnd: 1.22,
    panX: 0,
    panY: -0.03,
    roll: 0.004,
    impacts: [0.16, 0.46, 0.78],
    material: "stage"
  },
  ashe: {
    focusX: 0.5,
    focusY: 0.43,
    zoomStart: 1.08,
    zoomEnd: 1.26,
    panX: -0.02,
    panY: -0.02,
    roll: -0.006,
    impacts: [0.14, 0.5, 0.78],
    material: "ice"
  },
  rammus: {
    focusX: 0.52,
    focusY: 0.52,
    zoomStart: 1.12,
    zoomEnd: 1.34,
    panX: 0.02,
    panY: 0.05,
    roll: 0.014,
    impacts: [0.12, 0.32, 0.56, 0.82],
    material: "quake"
  }
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function fxCenterFor(button) {
  const buttonRect = button.getBoundingClientRect();
  const rawX = buttonRect.left + buttonRect.width / 2;
  const rawY = buttonRect.top + buttonRect.height / 2;
  const marginX = 24;
  const marginY = 24;
  return {
    x: clamp(rawX, marginX, window.innerWidth - marginX),
    y: clamp(rawY, marginY, window.innerHeight - marginY)
  };
}

function soundProfileFor(profileId = "default") {
  return soundProfiles[profileId] || defaultSoundProfile;
}

function soundSceneFor(profileId = "default") {
  return soundScenes[profileId] || defaultSoundScene;
}

function fxProfileFor(profileId = "default") {
  return {
    ...defaultFxProfile,
    ...(fxProfiles[profileId] || {}),
    id: (fxProfiles[profileId] || defaultFxProfile).id || profileId
  };
}

function championById(championId) {
  return champions.find((champion) => champion.id === championId) || champions[0];
}

function pageChampionById(championId) {
  return pageChampions.find((champion) => champion.id === championId) || pageChampions[0];
}

function ensureChampionAtmosphere() {
  if (championAtmosphere || !championPanel) return championAtmosphere;

  const root = document.createElement("div");
  const shaderCanvas = document.createElement("canvas");
  const materialCanvas = document.createElement("canvas");
  const art = document.createElement("img");
  root.className = "champion-atmosphere";
  shaderCanvas.className = "champion-atmosphere-shader";
  materialCanvas.className = "champion-atmosphere-material";
  art.className = "champion-atmosphere-art";
  art.alt = "";
  art.decoding = "async";
  art.loading = "eager";
  root.setAttribute("aria-hidden", "true");
  root.append(shaderCanvas, art, materialCanvas);
  championPanel.prepend(root);

  championAtmosphere = {
    root,
    shaderCanvas,
    materialCanvas,
    art,
    context: materialCanvas.getContext("2d", { alpha: true, desynchronized: true }),
    shaderState: createUltimateShaderState(shaderCanvas),
    champion: null,
    profile: null,
    startedAt: performance.now(),
    burstStartedAt: 0,
    raf: 0
  };

  return championAtmosphere;
}

function resizeAtmosphereCanvas(canvas, context, width, height, dpr) {
  const pixelWidth = Math.max(1, Math.round(width * dpr));
  const pixelHeight = Math.max(1, Math.round(height * dpr));
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    if (context) {
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
    }
  }
  if (context) context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function renderChampionAtmosphereFrame(now = performance.now()) {
  const scene = championAtmosphere;
  if (!scene?.root?.isConnected || !scene.profile) return;

  const rect = scene.root.getBoundingClientRect();
  const width = Math.max(1, Math.ceil(rect.width));
  const height = Math.max(1, Math.ceil(rect.height));
  const dpr = Math.min(window.devicePixelRatio || 1, width < 760 ? 0.92 : 0.86);
  const elapsed = now - scene.startedAt;
  const cycle = ((elapsed % 6200) / 6200);
  const shaderDuration = 6200;
  const shaderElapsed = (0.1 + cycle * 0.72) * shaderDuration;
  const burst = scene.burstStartedAt ? Math.max(0, 1 - ((now - scene.burstStartedAt) / 960)) : 0;

  if (scene.shaderState) {
    renderUltimateShader(scene.shaderState, scene.profile, width, height, shaderElapsed, shaderDuration, dpr);
  }

  if (scene.context) {
    resizeAtmosphereCanvas(scene.materialCanvas, scene.context, width, height, dpr);
    scene.context.clearRect(0, 0, width, height);
    drawChampionAtmosphereFrame(scene.context, scene.profile, width, height, elapsed / 1000, burst);
  }

  window.__leagueAmbientStats = {
    champion: scene.profile.id,
    width,
    height,
    dpr,
    material: "static-plate",
    shader: Boolean(scene.shaderState)
  };
  scene.raf = 0;
}

function updateChampionAtmosphere(champion, options = {}) {
  if (!championPanel || !champion) return;
  const profile = fxProfileFor(champion.id);
  const scene = ensureChampionAtmosphere();
  if (!scene) return;

  applyFxProfileVars(championPanel, profile);
  championPanel.dataset.championFx = champion.id;
  if (scene.art.src !== champion.image) scene.art.src = champion.image;
  scene.champion = champion;
  scene.profile = profile;
  if (!scene.startedAt || options.reset) scene.startedAt = performance.now();
  if (options.burst) scene.burstStartedAt = performance.now();

  if (scene.raf) cancelAnimationFrame(scene.raf);
  scene.raf = requestAnimationFrame(renderChampionAtmosphereFrame);
}

function selectionStageFor(button) {
  const panelRect = championPanel?.getBoundingClientRect();
  const buttonRect = button?.getBoundingClientRect();
  const source = panelRect?.width ? panelRect : buttonRect;
  const viewportWidth = window.innerWidth || 1;
  const viewportHeight = window.innerHeight || 1;
  const isCompactStage = viewportWidth < 560;
  const width = clamp(
    (source?.width || 520) * (isCompactStage ? 0.94 : 1.06),
    isCompactStage ? 250 : 300,
    Math.min(880, viewportWidth - (isCompactStage ? 46 : 20))
  );
  const height = clamp(
    (source?.height || 260) + (isCompactStage ? 36 : 72),
    isCompactStage ? 190 : 210,
    Math.min(isCompactStage ? 320 : 380, viewportHeight - 120)
  );
  const x = clamp((source?.left || 0) + (source?.width || viewportWidth) * 0.5, width * 0.5 + 10, viewportWidth - width * 0.5 - 10);
  const y = clamp(
    (source?.top || viewportHeight * 0.42) + (source?.height || height) * (isCompactStage ? 0.48 : 0.52),
    height * 0.5 + 76,
    viewportHeight - height * 0.5 - 10
  );
  return { x, y, width, height };
}

function applySelectionStage(fx, button) {
  const stage = selectionStageFor(button);
  fx.style.setProperty("--fx-stage-x", `${stage.x}px`);
  fx.style.setProperty("--fx-stage-y", `${stage.y}px`);
  fx.style.setProperty("--fx-stage-width", `${stage.width}px`);
  fx.style.setProperty("--fx-stage-height", `${stage.height}px`);
  return stage;
}

function applyFxProfileVars(element, profile) {
  if (!element) return;
  element.dataset.championFx = profile.id;
  element.style.setProperty("--fx-main", profile.main);
  element.style.setProperty("--fx-secondary", profile.secondary);
  element.style.setProperty("--fx-third", profile.third);
  element.style.setProperty("--fx-dark", profile.dark);
  profile.sliceAngles.forEach((angle, index) => {
    element.style.setProperty(`--fx-angle-${index + 1}`, `${angle}deg`);
  });
}

function effectPixelRatioFor() {
  const maxDimension = Math.max(window.innerWidth || 1, window.innerHeight || 1);
  if (maxDimension <= 900) return 1;
  return Math.min(0.86, Math.max(0.62, 920 / maxDimension));
}

function effect2dPixelRatioFor(profileId, width, shaderDpr) {
  if (width <= 760) return Math.min(shaderDpr, 0.86);
  if (width <= 1100) return Math.min(shaderDpr, 0.56);
  return Math.min(shaderDpr, profileId === "fizz" ? 0.38 : 0.44);
}

function loadVfx3dModule() {
  if (motionQuery.matches || !("WebGLRenderingContext" in window)) return Promise.resolve(null);
  vfx3dModulePromise ||= import(`/vfx3d.js?v=${visualFxVersion}`).catch(() => null);
  return vfx3dModulePromise;
}

function warmUltimateShader() {
  if (motionQuery.matches || ultimateShaderWarmPromise || !("WebGLRenderingContext" in window)) return ultimateShaderWarmPromise || Promise.resolve();
  ultimateShaderWarmPromise = Promise.resolve().then(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 420;
    canvas.height = 260;
    canvas.style.cssText = "position:fixed;left:-520px;top:-360px;width:420px;height:260px;opacity:0;pointer-events:none;";
    document.body.append(canvas);
    const state = createUltimateShaderState(canvas);
    if (state) {
      renderUltimateShader(state, fxProfileFor(currentChampionId || champions[0]?.id || "samira"), 420, 260, 180, 1000, 1);
      const loseContext = state.gl.getExtension("WEBGL_lose_context");
      state.gl.deleteBuffer(state.buffer);
      state.gl.deleteProgram(state.program);
      loseContext?.loseContext();
    }
    canvas.remove();
  }).catch(() => {});
  return ultimateShaderWarmPromise;
}

function scheduleVfxWarmQueue() {
  if (motionQuery.matches || vfxWarmQueueStarted) return;
  vfxWarmQueueStarted = true;
  const activeId = currentChampionId || pageChampions[0]?.id;
  const ids = [
    activeId,
    ...pageChampions.map((champion) => champion.id).filter((championId) => championId !== activeId)
  ].filter(Boolean);
  ids.forEach((championId, index) => {
    window.setTimeout(() => {
      void warmVfx3dRenderer(championId);
    }, 220 + index * 260);
  });
}

function primeCinematicAssets() {
  if (cinematicPrimeStarted) return;
  cinematicPrimeStarted = true;
  void loadVfx3dModule();
  void warmUltimateShader();
  void warmCinematicCanvases();
  void warmVfx3dRenderer(currentChampionId || pageChampions[0]?.id);
  window.setTimeout(scheduleVfxWarmQueue, 700);
}

function warmVfx3dRenderer(championId = currentChampionId || pageChampions[0]?.id) {
  if (motionQuery.matches || !("WebGLRenderingContext" in window)) return Promise.resolve();
  const champion = championById(championId);
  if (!champion?.id) return Promise.resolve();
  if (vfx3dWarmPromises[champion.id]) return vfx3dWarmPromises[champion.id];
  vfx3dWarmPromises[champion.id] = loadVfx3dModule().then(async (module) => {
    if (!module) return;
    const warmWidth = Math.max(320, Math.min(480, Math.ceil((window.innerWidth || 960) * 0.42)));
    const warmHeight = Math.max(260, Math.min(360, Math.ceil((window.innerHeight || 540) * 0.42)));
    const warmRatio = effectPixelRatioFor();
    const canvas = document.createElement("canvas");
    canvas.width = warmWidth;
    canvas.height = warmHeight;
    canvas.style.cssText = `position:fixed;left:-${warmWidth + 80}px;top:-${warmHeight + 80}px;width:${warmWidth}px;height:${warmHeight}px;opacity:0;pointer-events:none;`;
    document.body.append(canvas);
    const profile = fxProfileFor(champion.id);
    const scene = module.createChampionVfx3D({
      canvas,
      championId: champion.id,
      profile,
      duration: 720
    });
    scene.resize(warmWidth, warmHeight, warmRatio);
    scene.render(0, 720);
    scene.render(180, 720);
    scene.dispose();
    canvas.remove();
  }).catch(() => {});
  return vfx3dWarmPromises[champion.id];
}

function buildFallbackSoundUrl(profileId = "default") {
  if (fallbackAudioUrls[profileId]) return fallbackAudioUrls[profileId];

  const profile = soundProfileFor(profileId);
  const scene = soundSceneFor(profileId);

  const sampleRate = 44100;
  const duration = Math.max(
    profile.duration,
    ...scene.map((event) => (event.start || 0) + (event.length || 0) + 0.12)
  );
  const frameCount = Math.floor(sampleRate * duration);
  const dataSize = frameCount * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  const toneSample = (time, tone) => {
    const start = tone.start || 0;
    const length = tone.length || 0.18;
    const from = tone.frequency;
    const to = tone.endFrequency || tone.frequency;
    const gain = tone.gain || 0.1;
    if (time < start || time > start + length) return 0;
    const local = time - start;
    const progress = local / length;
    const sweep = from + (to - from) * progress;
    const phase = 2 * Math.PI * (from * local + 0.5 * (sweep - from) * local * progress);
    const envelope = Math.sin(Math.PI * progress) ** 0.62;
    const raw = tone.type === "square"
      ? Math.sign(Math.sin(phase))
      : tone.type === "sawtooth"
        ? 2 * (local * sweep - Math.floor(0.5 + local * sweep))
        : Math.sin(phase);
    return raw * envelope * gain;
  };

  const eventSample = (time, event) => {
    if (event.kind === "noise" || event.kind === "water") {
      const start = event.start || 0;
      const length = event.length || 0.2;
      if (time < start || time > start + length) return 0;
      const progress = (time - start) / length;
      const envelope = Math.sin(Math.PI * progress) ** 0.62;
      const filterTone = event.filter === "lowpass" ? 0.42 : event.filter === "highpass" ? 1 : 0.72;
      return (Math.random() * 2 - 1) * envelope * (event.gain || 0.12) * filterTone;
    }
    if (event.kind === "thump" || event.kind === "drum" || event.kind === "hit" || event.kind === "roll" || event.kind === "cinematic") {
      return toneSample(time, { ...event, type: "sine" });
    }
    if (event.notes) {
      return event.notes.reduce((sum, frequency, index) => {
        const offset = index * 0.025;
        return sum + toneSample(time, {
          ...event,
          start: (event.start || 0) + offset,
          length: Math.max(0.08, (event.length || 0.4) - offset),
          frequency,
          gain: (event.gain || 0.1) / Math.max(1.6, event.notes.length),
          type: event.kind === "spark" ? "square" : event.kind === "brass" || event.kind === "pulse" ? "sawtooth" : "sine"
        });
      }, 0);
    }
    return toneSample(time, event);
  };

  for (let i = 0; i < frameCount; i += 1) {
    const time = i / sampleRate;
    const tail = profile.tail || defaultSoundProfile.tail;
    const tailFade = Math.max(0, 1 - Math.abs(time - tail.center) / tail.width) ** 2;
    const sample =
      scene.reduce((sum, event) => sum + eventSample(time, event), 0) +
      Math.sin(2 * Math.PI * tail.frequency * time) * tailFade * tail.gain;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 32767, true);
  }

  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  fallbackAudioUrls[profileId] = `data:audio/wav;base64,${window.btoa(binary)}`;
  return fallbackAudioUrls[profileId];
}

function playFallbackSelectSound(profileId = "default") {
  if (!window.Audio) return;
  const profile = soundProfileFor(profileId);
  const audio = new window.Audio(buildFallbackSoundUrl(profileId));
  audio.volume = profile.volume || defaultSoundProfile.volume;
  void audio.play().catch(() => {});
}

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

function trustLine(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return /^why\b/i.test(text) ? text : `Why trust this: ${text}`;
}

function hasText(value) {
  return String(value || "").trim().length > 0;
}

function writeChampion(champion) {
  championName.textContent = champion.name;
  championFocus.textContent = "";
  championNote.textContent = "";
  if (situationCount) situationCount.textContent = `${champion.situations.length} archived`;
  if (situationList) situationList.replaceChildren(...champion.situations.map(situationCard));
  updateChampionAtmosphere(champion, {
    burst: Boolean(currentChampionId && champion.id !== currentChampionId),
    reset: !currentChampionId
  });
}

function recordingMainCard(review) {
  const item = review.mainFeedback || {};
  const article = document.createElement("article");
  article.className = "recording-main";

  const title = document.createElement("h3");
  title.textContent = (review.detectedChampions || []).map((champion) => champion.name).filter(Boolean).join(", ") || "recording focus";

  const focus = document.createElement("p");
  focus.className = "recording-main-focus";
  focus.textContent = item.focus || item.title || "Name the payout before the dash.";

  const rule = document.createElement("p");
  rule.className = "recording-main-rule";
  rule.textContent = item.rule || item.nextRep || "Before E/R: wave, tower, dragon, recall, or nexus. If none is real, hold the dash.";

  const why = document.createElement("p");
  why.className = "recording-main-why";
  why.textContent = item.whyTrust ? `Why: ${item.whyTrust}` : "";

  const limit = document.createElement("p");
  limit.className = "recording-main-limit";
  limit.textContent = item.reviewLimit || "";

  article.append(title, focus);
  if (rule.textContent) article.append(rule);
  if (why.textContent) article.append(why);
  if (limit.textContent) article.append(limit);
  return article;
}

function recordingDeepDetails(item) {
  const hasNuance = Array.isArray(item.nuance) && item.nuance.length > 0;
  const rows = [
    ["rule", item.diamondRule],
    ["why", item.whyTrust],
    ["evidence", item.evidence],
    ["limit", item.reviewLimit]
  ].filter(([, value]) => hasText(value));

  if (!hasNuance && rows.length === 0) return null;

  const details = document.createElement("details");
  details.className = "recording-deep";

  const summary = document.createElement("summary");
  summary.textContent = "more";
  details.append(summary);

  for (const [label, value] of rows) {
    const block = document.createElement("div");
    block.className = "recording-deep-row";
    const strong = document.createElement("strong");
    strong.textContent = label;
    const p = document.createElement("p");
    p.textContent = value;
    block.append(strong, p);
    details.append(block);
  }

  if (hasNuance) {
    const block = document.createElement("div");
    block.className = "recording-deep-row";
    const strong = document.createElement("strong");
    strong.textContent = "nuance";
    const list = document.createElement("ul");
    for (const point of item.nuance) {
      const li = document.createElement("li");
      li.textContent = point;
      list.append(li);
    }
    block.append(strong, list);
    details.append(block);
  }

  return details;
}

function recordingVideo(item) {
  const video = document.createElement("video");
  video.controls = true;
  video.preload = "metadata";
  video.poster = item.poster;
  video.src = item.src;
  video.setAttribute("playsinline", "");
  return video;
}

function recordingTextStack(primary, secondary = "", className = "") {
  const stack = document.createElement("div");
  stack.className = `recording-cell-stack${className ? ` ${className}` : ""}`;
  const strong = document.createElement("strong");
  strong.textContent = primary || "unknown";
  stack.append(strong);
  if (secondary) {
    const span = document.createElement("span");
    span.textContent = secondary;
    stack.append(span);
  }
  return stack;
}

function tableCell(label, ...children) {
  const td = document.createElement("td");
  td.dataset.label = label;
  td.append(...children.filter(Boolean));
  return td;
}

function sortedRecordings(items = []) {
  return [...items].sort((a, b) => (
    (b.matchTimeMs || 0) - (a.matchTimeMs || 0) ||
    (b.durationSeconds || 0) - (a.durationSeconds || 0) ||
    (b.clipNumber || 0) - (a.clipNumber || 0) ||
    String(a.file || "").localeCompare(String(b.file || ""))
  ));
}

function recordingDetailCell(item) {
  const detail = document.createElement("div");
  detail.className = "recording-table-detail";

  const description = document.createElement("p");
  description.textContent = item.feedback || item.pattern || "No feedback generated yet.";
  detail.append(description);

  if (hasText(item.pattern) && item.pattern !== item.feedback) {
    const pattern = document.createElement("p");
    pattern.textContent = item.pattern;
    detail.append(pattern);
  }

  const deep = recordingDeepDetails(item);
  if (deep) detail.append(deep);
  return detail;
}

function recordingPreviewMeta(label, value) {
  const row = document.createElement("div");
  row.className = "recording-preview-meta";
  const key = document.createElement("span");
  key.textContent = label;
  const text = document.createElement("strong");
  text.textContent = value || "unknown";
  row.append(key, text);
  return row;
}

function recordingPreviewCard(item) {
  const article = document.createElement("article");
  article.className = "recording-preview-card";
  if (!item) return article;

  const videoWrap = document.createElement("div");
  videoWrap.className = "recording-preview-video";
  videoWrap.append(recordingVideo(item));

  const copy = document.createElement("div");
  copy.className = "recording-preview-copy";

  const title = document.createElement("h3");
  title.textContent = item.champion || "Recording";

  const meta = document.createElement("div");
  meta.className = "recording-preview-metas";
  meta.append(
    recordingPreviewMeta("game", item.gameHappenedAtLabel || item.recordedAtLabel),
    recordingPreviewMeta("type", item.gameType || item.kind),
    recordingPreviewMeta("time", item.clipWindow || item.clipTimestamp || item.timestamp),
    recordingPreviewMeta("length", item.duration)
  );

  const takeaway = document.createElement("p");
  takeaway.className = "recording-preview-takeaway";
  takeaway.textContent = item.feedbackTitle || "Focus";

  const description = document.createElement("p");
  description.className = "recording-preview-description";
  description.textContent = item.feedback || item.pattern || "No feedback generated yet.";

  const why = document.createElement("p");
  why.className = "recording-preview-why";
  why.textContent = item.whyTrust ? `Why: ${item.whyTrust}` : "";

  copy.append(title, meta, takeaway, description);
  if (why.textContent) copy.append(why);
  article.append(videoWrap, copy);
  return article;
}

function setActiveRecording(item, review) {
  if (!item || !recordingPreview || !recordingGrid) return;
  activeRecordingFile = item.file || "";
  recordingPreview.replaceChildren(recordingPreviewCard(item));
  recordingGrid.replaceChildren(recordingTable(review));
}

function recordingPreviewButton(item, review) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "recording-preview-button";
  button.textContent = item.file === activeRecordingFile ? "viewing" : "preview";
  button.addEventListener("click", () => setActiveRecording(item, review));
  return button;
}

const recordingDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

function compactRecordingDate(item) {
  const source = item.gameHappenedAt || item.recordedAt;
  const date = source ? new Date(source) : null;
  if (date && !Number.isNaN(date.getTime())) {
    return recordingDateFormatter.format(date).replace(",", "");
  }
  return (item.gameHappenedAtLabel || item.recordedAtLabel || "time unknown")
    .replace(/May\s+(\d+),\s+2026,\s+/i, "5/$1 ")
    .replace(/,\s*2026/i, "");
}

function compactGameType(value) {
  return (value || "type unknown")
    .replace(/Co-op vs AI/i, "Co-op AI")
    .replace(/\bBeginner\b/i, "beginner")
    .replace(/\bIntermediate\b/i, "intermediate");
}

function statLine(item) {
  const stats = [];
  if (item.kda) stats.push(`KDA ${item.kda}`);
  if (Number.isFinite(Number(item.cs))) stats.push(`${item.cs} CS`);
  return stats;
}

function recordingParagraph(item) {
  return item.gameDetail || item.pattern || item.feedback || item.whyTrust || "No feedback generated yet.";
}

function recordingTimeline(item) {
  const events = Array.isArray(item.timeline) ? item.timeline.filter(hasText).slice(0, 6) : [];
  if (!events.length) return null;
  const list = document.createElement("ol");
  list.className = "recording-list-timeline";
  for (const event of events) {
    const li = document.createElement("li");
    li.textContent = event;
    list.append(li);
  }
  return list;
}

function secondsForRecording(item) {
  if (Number.isFinite(Number(item.durationSeconds))) return Number(item.durationSeconds);
  const match = String(item.duration || "").match(/^(\d+):(\d{2})$/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : 0;
}

function durationLabel(seconds) {
  const rounded = Math.max(0, Math.round(Number(seconds) || 0));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

function championId(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  return pageChampionIds.includes(normalized) ? normalized : normalized;
}

function recordingsForChampion(review, selectedChampionId) {
  return sortedRecordings(review.recordings || [])
    .filter((item) => championId(item.champion) === selectedChampionId);
}

function recordingEmptyCard(champion) {
  const article = document.createElement("article");
  article.className = "recording-empty";

  const title = document.createElement("h3");
  title.textContent = `${champion.name} recordings`;

  const copy = document.createElement("p");
  copy.textContent = `No ${champion.name} recordings yet.`;

  const detail = document.createElement("p");
  detail.textContent = "New games appear here after the Highlights folder updates.";

  article.append(title, copy, detail);
  return article;
}

function recordingListCard(item) {
  const article = document.createElement("article");
  article.className = "recording-list-card";

  const copy = document.createElement("div");
  copy.className = "recording-list-copy";

  const meta = document.createElement("div");
  meta.className = "recording-list-facts";
  meta.textContent = [
    compactGameType(item.gameType || item.kind),
    item.champion || "Unknown",
    compactRecordingDate(item),
    item.gameLength || item.duration,
    ...statLine(item)
  ].join(" | ");

  const title = document.createElement("h3");
  title.textContent = item.feedbackTitle || "Focus";

  const takeaway = document.createElement("p");
  takeaway.className = "recording-list-takeaway";
  takeaway.textContent = recordingParagraph(item);

  const timeline = recordingTimeline(item);
  copy.append(meta, title, takeaway);
  if (timeline) copy.append(timeline);

  const videoWrap = document.createElement("div");
  videoWrap.className = "recording-list-video";
  videoWrap.append(recordingVideo(item));

  article.append(copy, videoWrap);
  return article;
}

function recordingList(review) {
  const list = document.createElement("div");
  list.className = "recording-list";
  list.append(...sortedRecordings(review.recordings || []).map(recordingListCard));
  return list;
}

function recordingTable(review) {
  const wrapper = document.createElement("div");
  wrapper.className = "recording-table-wrap";

  const table = document.createElement("table");
  table.className = "recording-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["game", "type", "timestamp", "champion", "length", "takeaway", "detail", "video"].forEach((label) => {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    headerRow.append(th);
  });
  thead.append(headerRow);

  const tbody = document.createElement("tbody");
  for (const item of sortedRecordings(review.recordings || [])) {
    const row = document.createElement("tr");
    if (item.file === activeRecordingFile) row.className = "is-active";
    const gameSub = [item.matchId, item.score].filter(Boolean).join(" - ");
    const typeSub = item.queueId ? `queue ${item.queueId}` : item.gameTypeSource || "not found in logs";
    const timestampPrimary = item.clipWindow || item.clipTimestamp || item.timestamp || "unknown";
    const timestampSub = item.recordedAtTimeLabel ? `saved ${item.recordedAtTimeLabel}` : item.recordedAtLabel || "";
    const championSub = item.confidence ? `${item.confidence} confidence` : "";

    row.append(
      tableCell("game", recordingTextStack(item.gameHappenedAtLabel || item.recordedAtLabel, gameSub)),
      tableCell("type", recordingTextStack(item.gameType || item.kind || "unknown", typeSub)),
      tableCell("timestamp", recordingTextStack(timestampPrimary, timestampSub)),
      tableCell("champion", recordingTextStack(item.champion || "Unknown", championSub)),
      tableCell("length", recordingTextStack(item.duration || "")),
      tableCell("takeaway", recordingTextStack(item.feedbackTitle || "Focus", item.drill || "")),
      tableCell("detail", recordingDetailCell(item)),
      tableCell("video", recordingPreviewButton(item, review))
    );
    tbody.append(row);
  }

  table.append(thead, tbody);
  wrapper.append(table);
  return wrapper;
}

function renderRecordings(review = recordingReview, selectedChampionId = currentChampionId || "samira") {
  if (!recordingSummary || !recordingFocus || !recordingGrid) return;
  const champion = pageChampionById(selectedChampionId);
  const championRecordings = recordingsForChampion(review, champion.id);
  if (recordingTitle) recordingTitle.textContent = `${champion.name} recordings`;
  if (page) page.dataset.recordingChampion = champion.id;

  if (!championRecordings.length) {
    recordingSummary.textContent = "0 recordings";
    recordingFocus.replaceChildren(recordingMainCard({
      detectedChampions: [{ name: champion.name }],
      mainFeedback: {
        focus: `No ${champion.name} recordings yet.`,
        rule: `New ${champion.name} games will appear after the Highlights folder updates.`,
        whyTrust: "No footage, no feedback.",
        reviewLimit: ""
      }
    }));
    recordingGrid.replaceChildren(recordingEmptyCard(champion));
    return;
  }

  const totalSeconds = championRecordings.reduce((sum, item) => sum + secondsForRecording(item), 0);
  const matches = [...new Set(championRecordings.map((item) => item.matchId).filter(Boolean))];
  const championReview = {
    ...review,
    totalRecordings: championRecordings.length,
    totalDuration: durationLabel(totalSeconds),
    match: matches.length === 1 ? matches[0] : `${matches.length} matches`,
    detectedChampions: [{ name: champion.name }],
    recordings: championRecordings
  };
  recordingSummary.textContent = `${championReview.totalRecordings} rec | ${championReview.totalDuration} | ${championReview.match}`;
  recordingFocus.replaceChildren(recordingMainCard(championReview));
  recordingGrid.replaceChildren(recordingList(championReview));
}

function renderRecordingLoading() {
  if (!recordingSummary || !recordingFocus || !recordingGrid) return;
  recordingSummary.textContent = "loading current recordings";
  recordingGrid.replaceChildren();
  recordingFocus.replaceChildren();
}

async function hydrateRecordings() {
  renderRecordingLoading();
  try {
    const response = await fetch("/recordings/recordings.json", {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!response.ok) {
      recordingReviewData = recordingReview;
      renderRecordings(recordingReviewData, currentChampionId || "samira");
      return;
    }
    const data = await response.json();
    if (!Array.isArray(data.recordings) || data.recordings.length === 0) {
      recordingReviewData = recordingReview;
      renderRecordings(recordingReviewData, currentChampionId || "samira");
      return;
    }
    recordingReviewData = data;
    renderRecordings(recordingReviewData, currentChampionId || "samira");
  } catch {
    recordingReviewData = recordingReview;
    renderRecordings(recordingReviewData, currentChampionId || "samira");
  }
}

function setPressedChampion(championId) {
  document.querySelectorAll(".portrait-button").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.champion === championId));
  });
}

function playSynthSelectSound(profileId = "default") {
  const profile = soundProfileFor(profileId);
  const scene = soundSceneFor(profileId);
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    playFallbackSelectSound(profileId);
    return;
  }

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();

    const now = audioContext.currentTime;
    const sceneDuration = Math.max(
      profile.duration || defaultSoundProfile.duration,
      ...scene.map((event) => (event.start || 0) + (event.length || 0) + 0.16)
    );
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-14, now);
    compressor.knee.setValueAtTime(22, now);
    compressor.ratio.setValueAtTime(8, now);
    compressor.attack.setValueAtTime(0.002, now);
    compressor.release.setValueAtTime(0.28, now);
    compressor.connect(audioContext.destination);

    const reverb = audioContext.createConvolver();
    const impulseLength = Math.floor(audioContext.sampleRate * 1.7);
    const impulse = audioContext.createBuffer(2, impulseLength, audioContext.sampleRate);
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < impulseLength; i += 1) {
        const progress = i / impulseLength;
        data[i] = (Math.random() * 2 - 1) * ((1 - progress) ** 2.4) * 0.58;
      }
    }
    reverb.buffer = impulse;
    const reverbGain = audioContext.createGain();
    reverbGain.gain.setValueAtTime(0.18, now);
    reverb.connect(reverbGain).connect(compressor);

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(profile.masterPeak || defaultSoundProfile.masterPeak, now + 0.014);
    master.gain.exponentialRampToValueAtTime(profile.masterTail || defaultSoundProfile.masterTail, now + Math.min(0.76, sceneDuration * 0.46));
    master.gain.exponentialRampToValueAtTime(0.0001, now + sceneDuration);
    master.connect(compressor);

    const connectOutput = (node, event = {}) => {
      let output = node;
      if (typeof event.pan === "number" && audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(event.pan, now + (event.start || 0));
        output.connect(panner);
        output = panner;
      }
      output.connect(master);
      if (event.wet !== 0) output.connect(reverb);
    };

    const playTone = (tone) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      let output = gain;
      osc.type = tone.type || "triangle";
      const start = tone.start || 0;
      const length = Math.max(0.03, tone.length || 0.3);
      osc.frequency.setValueAtTime(tone.frequency, now + start);
      if (tone.endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(tone.endFrequency, now + start + length);
      }
      if (tone.detune) {
        osc.detune.setValueAtTime(tone.detune, now + start);
      }
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(tone.gain || 0.12, now + start + (tone.attack || 0.018));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(gain);
      if (tone.filter) {
        const filter = audioContext.createBiquadFilter();
        filter.type = tone.filter;
        filter.frequency.setValueAtTime(tone.startFrequency || tone.filterFrequency || 1800, now + start);
        if (tone.endFrequencyFilter || tone.endFilterFrequency) {
          filter.frequency.exponentialRampToValueAtTime(tone.endFrequencyFilter || tone.endFilterFrequency, now + start + length);
        }
        filter.Q.setValueAtTime(tone.q || 0.8, now + start);
        gain.connect(filter);
        output = filter;
      }
      connectOutput(output, tone);
      osc.start(now + start);
      osc.stop(now + start + length + 0.06);
    };

    const playNoise = (event) => {
      const length = Math.max(event.filter === "highpass" ? 0.32 : 0.18, event.length || 0.24);
      const start = event.start || 0;
      const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * length), audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      let smoothed = 0;
      for (let i = 0; i < noiseData.length; i += 1) {
        const progress = i / noiseData.length;
        const fade = Math.sin(Math.PI * progress) ** (event.curve || 0.9);
        smoothed = smoothed * 0.82 + (Math.random() * 2 - 1) * 0.18;
        noiseData[i] = smoothed * fade;
      }
      const noise = audioContext.createBufferSource();
      const noiseFilter = audioContext.createBiquadFilter();
      const noiseGain = audioContext.createGain();
      noise.buffer = noiseBuffer;
      noiseFilter.type = event.filter || "bandpass";
      noiseFilter.frequency.setValueAtTime(event.startFrequency || 4800, now + start);
      noiseFilter.frequency.exponentialRampToValueAtTime(event.endFrequency || 520, now + start + length);
      noiseFilter.Q.setValueAtTime(event.q || 0.78, now + start);
      noiseGain.gain.setValueAtTime(0.0001, now + start);
      noiseGain.gain.exponentialRampToValueAtTime(event.gain || 0.12, now + start + 0.045);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      noise.connect(noiseFilter).connect(noiseGain);
      connectOutput(noiseGain, event);
      noise.start(now + start);
      noise.stop(now + start + length + 0.05);
    };

    const playThump = (event) => {
      playTone({
        type: "sine",
        frequency: event.frequency,
        endFrequency: event.endFrequency,
        start: event.start || 0,
        length: event.length,
        gain: event.gain,
        attack: 0.01,
        pan: event.pan
      });
    };

    const playChord = (event, instrument = "string") => {
      const notes = event.notes || [event.frequency || 220];
      const gain = event.gain || 0.14;
      const settings = {
        brass: { type: "sawtooth", attack: 0.06, filter: "lowpass", startFrequency: 950, endFilterFrequency: 2400, q: 0.55, wet: 1 },
        string: { type: "triangle", attack: 0.05, filter: "lowpass", startFrequency: 1700, endFilterFrequency: 900, q: 0.72, wet: 1 },
        choir: { type: "sine", attack: 0.18, filter: "lowpass", startFrequency: 1150, endFilterFrequency: 720, q: 0.48, wet: 1 },
        bell: { type: "sine", attack: 0.032, filter: "bandpass", startFrequency: 680, endFilterFrequency: 1120, q: 0.42, wet: 1 },
        spark: { type: "square", attack: 0.008, filter: "bandpass", startFrequency: 3600, endFilterFrequency: 6200, q: 1.4, wet: 1 },
        pulse: { type: "sawtooth", attack: 0.02, filter: "bandpass", startFrequency: 760, endFilterFrequency: 2100, q: 1.1, wet: 1 }
      }[instrument];
      notes.forEach((note, index) => {
        const offset = index * 0.035;
        playTone({
          ...settings,
          frequency: note,
          start: (event.start || 0) + offset,
          length: Math.max(0.12, (event.length || 0.7) - offset),
          gain: gain / Math.max(1.55, notes.length),
          pan: typeof event.pan === "number" ? event.pan : ((index - (notes.length - 1) / 2) * 0.16),
          detune: (index - (notes.length - 1) / 2) * 4
        });
      });
    };

    const playBloom = (event) => {
      const length = Math.max(0.48, event.length || 0.58);
      playThump({ ...event, length, gain: (event.gain || 0.4) * 0.72 });
      playNoise({
        ...event,
        start: (event.start || 0) + 0.035,
        length,
        filter: "bandpass",
        startFrequency: 2600,
        endFrequency: 420,
        gain: (event.gain || 0.4) * 0.18,
        q: 0.62,
        wet: 1
      });
    };

    const playDrum = (event) => {
      playThump(event);
      playNoise({
        ...event,
        start: (event.start || 0) + 0.02,
        length: Math.min(0.32, event.length || 0.3),
        filter: "lowpass",
        startFrequency: 1200,
        endFrequency: 90,
        gain: (event.gain || 0.42) * 0.28,
        q: 0.42,
        wet: 0
      });
    };

    const playWater = (event) => {
      playNoise({
        ...event,
        filter: "bandpass",
        startFrequency: 480,
        endFrequency: 4200,
        q: 1.5,
        wet: 1
      });
      playTone({
        type: "sine",
        frequency: 220,
        endFrequency: 587.33,
        start: (event.start || 0) + 0.08,
        length: Math.min(0.52, event.length || 0.7),
        gain: (event.gain || 0.2) * 0.28,
        pan: event.pan || 0.22,
        wet: 1
      });
    };

    const playRoll = (event) => {
      const pulses = 6;
      for (let index = 0; index < pulses; index += 1) {
        const progress = index / (pulses - 1);
        playBloom({
          ...event,
          start: (event.start || 0) + progress * (event.length || 1.2) * 0.72,
          length: 0.48,
          frequency: (event.frequency || 34) + index * 3,
          endFrequency: (event.endFrequency || 14) + index,
          gain: (event.gain || 0.5) * (0.24 + progress * 0.1),
          pan: Math.sin(index * 1.7) * 0.22
        });
      }
    };

    const playImpactSample = (event) => {
      const start = event.start || 0;
      const length = Math.max(0.22, event.length || 0.9);
      const gainValue = event.gain || 0.62;
      const buffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * length), audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      const base = event.frequency || 42;
      const texture = event.texture || "impact";
      for (let index = 0; index < data.length; index += 1) {
        const time = index / audioContext.sampleRate;
        const progress = index / data.length;
        const envelope = Math.exp(-progress * (texture === "swell" ? 2.8 : 5.4));
        const hit = Math.sin(2 * Math.PI * (base - base * 0.44 * progress) * time);
        const sub = Math.sin(2 * Math.PI * (base * 0.5) * time) * 0.72;
        const scrape = (Math.random() * 2 - 1) * (texture === "water" ? 0.42 : texture === "crack" ? 0.22 : 0.16);
        const bow = Math.sin(2 * Math.PI * (base * 2.02 + Math.sin(progress * 7) * 18) * time) * (texture === "sax" ? 0.26 : 0.08);
        data[index] = (hit * 0.72 + sub * 0.42 + scrape + bow) * envelope;
      }
      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      const shaper = audioContext.createWaveShaper();
      const curve = new Float32Array(256);
      for (let index = 0; index < curve.length; index += 1) {
        const x = (index / 127.5) - 1;
        curve[index] = Math.tanh(x * (texture === "crack" ? 2.4 : 1.55));
      }
      shaper.curve = curve;
      shaper.oversample = "2x";
      source.buffer = buffer;
      filter.type = event.filter || (texture === "crack" ? "bandpass" : "lowpass");
      filter.frequency.setValueAtTime(event.startFrequency || (texture === "crack" ? 3800 : 620), now + start);
      filter.frequency.exponentialRampToValueAtTime(event.endFrequency || (texture === "crack" ? 1200 : 96), now + start + length);
      filter.Q.setValueAtTime(event.q || (texture === "crack" ? 1.1 : 0.54), now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      source.connect(filter).connect(shaper).connect(gain);
      connectOutput(gain, event);
      source.start(now + start);
      source.stop(now + start + length + 0.04);
    };

    const playCinematic = (event) => {
      const start = event.start || 0;
      const gain = event.gain || 0.7;
      const flavor = event.flavor || "default";
      const palettes = {
        gunblade: { brass: [55, 82.41, 110, 164.81], choir: [220, 277.18], drum: 42, noise: 11600 },
        sniper: { brass: [36.71, 55, 73.42], choir: [146.83, 220], drum: 32, noise: 15000 },
        monster: { brass: [32.7, 49, 65.41], choir: [98, 146.83], drum: 38, noise: 820 },
        void: { brass: [41.2, 61.74, 82.41], choir: [164.81, 246.94, 329.63], drum: 30, noise: 9000 },
        sax: { brass: [73.42, 110, 146.83], choir: [220, 293.66], drum: 40, noise: 12800 },
        arcane: { brass: [49, 73.42, 98], choir: [196, 293.66, 392], drum: 46, noise: 12400 },
        curtain: { brass: [49, 73.42, 98, 146.83], choir: [196, 246.94, 392], drum: 34, noise: 6200 },
        ice: { brass: [58.27, 87.31, 116.54], choir: [261.63, 392, 523.25], drum: 44, noise: 14800 },
        quake: { brass: [30.87, 46.25, 61.74], choir: [92.5, 138.59], drum: 28, noise: 1200 },
        default: { brass: [55, 82.41, 110], choir: [164.81, 246.94], drum: 36, noise: 6400 }
      };
      const palette = palettes[flavor] || palettes.default;
      playImpactSample({
        start,
        length: flavor === "curtain" ? 1.2 : 0.95,
        frequency: palette.drum,
        gain: gain * 0.84,
        texture: flavor === "monster" ? "water" : flavor === "sax" ? "sax" : flavor === "sniper" || flavor === "curtain" ? "crack" : "impact",
        wet: 1
      });
      playDrum({ start: start + 0.02, length: 0.92, frequency: palette.drum, endFrequency: Math.max(12, palette.drum * 0.42), gain: gain * 0.54 });
      playChord({ start: start + 0.04, length: 1.36, notes: palette.brass, gain: gain * 0.42 }, "brass");
      playChord({ start: start + 0.18, length: 1.62, notes: palette.choir, gain: gain * 0.28 }, "choir");
      playNoise({ start: start + 0.02, length: 1.28, filter: flavor === "monster" || flavor === "quake" ? "lowpass" : "bandpass", startFrequency: palette.noise, endFrequency: flavor === "ice" ? 3600 : 140, gain: gain * 0.24, q: 0.5, wet: 1 });
      if (flavor === "sax") {
        [220, 246.94, 293.66, 277.18].forEach((note, index) => {
          playTone({
            type: "sawtooth",
            frequency: note,
            endFrequency: note * (index === 3 ? 0.92 : 1.035),
            start: start + 0.18 + index * 0.16,
            length: 0.28,
            gain: gain * 0.11,
            attack: 0.055,
            filter: "bandpass",
            startFrequency: 780,
            endFilterFrequency: 1240,
            q: 1.4,
            pan: -0.12 + index * 0.08
          });
        });
      }
      if (flavor === "sniper" || flavor === "curtain") {
        playImpactSample({ start: start + 0.58, length: 0.46, frequency: flavor === "sniper" ? 96 : 62, gain: gain * 0.9, texture: "crack", filter: "bandpass", startFrequency: 5200, endFrequency: 320, wet: 0 });
        playBloom({ start: start + 0.6, length: 0.56, frequency: flavor === "sniper" ? 94 : 58, endFrequency: 18, gain: gain * 0.38, wet: 1 });
      }
      if (flavor === "monster") {
        playWater({ start: start + 0.08, length: 1.18, gain: gain * 0.44, pan: -0.16 });
      }
    };

    scene.forEach((event) => {
      switch (event.kind) {
        case "cinematic":
          playCinematic(event);
          break;
        case "noise":
          playNoise(event);
          break;
        case "thump":
          playThump(event);
          break;
        case "drum":
          playDrum(event);
          break;
        case "bloom":
          playBloom(event);
          break;
        case "brass":
        case "string":
        case "choir":
        case "bell":
        case "spark":
        case "pulse":
          playChord(event, event.kind);
          break;
        case "water":
          playWater(event);
          break;
        case "roll":
          playRoll(event);
          break;
        default:
          playTone(event);
      }
    });
  } catch {
    playFallbackSelectSound(profileId);
  }
}

function playCinematicAccent(profileId = "default") {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  const accents = {
    samira: { low: 42, crack: 5200, swell: 0.62, hits: [0.18, 0.52, 0.86], texture: "metal", pan: [-0.48, 0.42, 0] },
    caitlyn: { low: 38, crack: 7800, swell: 0.34, hits: [0.16, 0.74], texture: "rifle", pan: [0.18, -0.06] },
    fizz: { low: 30, crack: 1350, swell: 1.04, hits: [0.06, 0.34, 0.54], texture: "water", pan: [-0.32, 0.08, 0.24] },
    kaisa: { low: 36, crack: 6400, swell: 0.72, hits: [0.12, 0.62, 1.02], texture: "void", pan: [-0.18, 0.18, 0] },
    missfortune: { low: 40, crack: 6900, swell: 0.42, hits: [0.2, 0.42], texture: "guns", pan: [-0.44, 0.44] },
    ezreal: { low: 46, crack: 8200, swell: 0.58, hits: [0.16, 0.72], texture: "arcane", pan: [-0.32, 0.26] },
    jhin: { low: 32, crack: 4600, swell: 0.76, hits: [0.24, 0.88], texture: "stage", pan: [0, 0] },
    ashe: { low: 44, crack: 9600, swell: 0.64, hits: [0.18, 0.74], texture: "ice", pan: [-0.22, 0.18] },
    rammus: { low: 28, crack: 860, swell: 0.9, hits: [0.1, 0.36, 0.64, 0.92], texture: "stone", pan: [-0.18, 0.12, -0.06, 0.16] },
    default: { low: 38, crack: 5200, swell: 0.54, hits: [0.2, 0.62], texture: "impact", pan: [0, 0] }
  };
  const accent = accents[profileId] || accents.default;

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime;
    const output = audioContext.createGain();
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(5, now);
    compressor.attack.setValueAtTime(0.004, now);
    compressor.release.setValueAtTime(0.22, now);
    output.gain.setValueAtTime(0.88, now);
    output.connect(compressor).connect(audioContext.destination);

    const connect = (node, pan = 0) => {
      if (audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        node.connect(panner).connect(output);
      } else {
        node.connect(output);
      }
    };

    const playSub = (start, length, gainValue, frequency) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, now + start);
      osc.frequency.exponentialRampToValueAtTime(Math.max(18, frequency * 0.46), now + start + length);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(gain);
      connect(gain);
      osc.start(now + start);
      osc.stop(now + start + length + 0.04);
    };

    const playNoise = (start, length, gainValue, filterType, startFrequency, endFrequency, pan = 0, curve = 1.2) => {
      const frameCount = Math.floor(audioContext.sampleRate * length);
      const buffer = audioContext.createBuffer(1, frameCount, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < frameCount; index += 1) {
        const progress = index / frameCount;
        const attack = Math.min(1, progress / 0.08);
        const release = (1 - progress) ** curve;
        const texture =
          accent.texture === "water" ? Math.sin(progress * 86) * 0.12 + Math.sin(progress * progress * 940) * 0.08 :
          accent.texture === "stone" ? Math.sign(Math.sin(progress * 220)) * 0.1 :
          accent.texture === "ice" ? Math.sin(progress * 420) * 0.1 :
          0;
        data[index] = ((Math.random() * 2 - 1) + texture) * attack * release;
      }
      const source = audioContext.createBufferSource();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(startFrequency, now + start);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, endFrequency), now + start + length);
      filter.Q.setValueAtTime(accent.texture === "rifle" ? 2.2 : 0.85, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(gainValue, now + start + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      source.connect(filter).connect(gain);
      connect(gain, pan);
      source.start(now + start);
      source.stop(now + start + length + 0.04);
    };

    playNoise(0.02, 1.28, accent.swell * 0.18, accent.texture === "water" || accent.texture === "stone" ? "lowpass" : "bandpass", accent.crack, accent.texture === "ice" ? 2600 : 180, 0, 1.6);
    if (accent.texture === "water") {
      playNoise(0.0, 1.75, 0.16, "lowpass", 860, 74, -0.1, 1.08);
      playNoise(0.22, 0.58, 0.34, "bandpass", 520, 3600, 0.08, 1.46);
      playNoise(0.42, 0.34, 0.26, "highpass", 6200, 1300, 0.22, 2.2);
      playSub(0.38, 0.68, 0.34, 28);
    }
    accent.hits.forEach((start, index) => {
      const pan = accent.pan[index] || 0;
      playSub(start, 0.42, 0.24, accent.low + index * 4);
      playNoise(start + 0.012, accent.texture === "rifle" ? 0.16 : 0.24, accent.texture === "rifle" ? 0.36 : 0.22, "highpass", accent.crack, accent.crack * 0.32, pan, 2.4);
      if (accent.texture === "water") {
        playNoise(start + 0.06, 0.58, 0.18, "bandpass", 520, 3600, pan, 1.3);
      }
    });
  } catch {
    // The licensed music remains the primary sound if the accent layer cannot play.
  }
}

function playChampionFoley(profileId = "default") {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime + 0.006;

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-22, now);
    compressor.knee.setValueAtTime(24, now);
    compressor.ratio.setValueAtTime(3.4, now);
    compressor.attack.setValueAtTime(0.003, now);
    compressor.release.setValueAtTime(0.2, now);
    compressor.connect(audioContext.destination);

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.5, now + 0.045);
    master.gain.exponentialRampToValueAtTime(0.38, now + 1.15);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 3.35);
    master.connect(compressor);

    const wet = audioContext.createGain();
    wet.gain.setValueAtTime(0.18, now);
    const delay = audioContext.createDelay(0.7);
    const feedback = audioContext.createGain();
    delay.delayTime.setValueAtTime(0.115, now);
    feedback.gain.setValueAtTime(0.24, now);
    delay.connect(feedback).connect(delay);
    delay.connect(wet).connect(compressor);

    const connect = (node, pan = 0, send = 0.24) => {
      let output = node;
      if (audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        output.connect(panner);
        output = panner;
      }
      output.connect(master);
      if (send > 0) {
        const sendGain = audioContext.createGain();
        sendGain.gain.setValueAtTime(send, now);
        output.connect(sendGain).connect(delay);
      }
    };

    const tone = ({ start = 0, length = 0.24, frequency = 440, endFrequency, gain = 0.12, type = "sine", pan = 0, attack = 0.01, filter, q = 0.8, send = 0.22 }) => {
      const osc = audioContext.createOscillator();
      const amp = audioContext.createGain();
      const safeAttack = Math.max(0.016, attack);
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now + start);
      if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(12, endFrequency), now + start + length);
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(gain, now + start + safeAttack);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      let output = amp;
      osc.connect(amp);
      if (filter) {
        const biquad = audioContext.createBiquadFilter();
        biquad.type = filter.type || "bandpass";
        biquad.frequency.setValueAtTime(filter.start || filter.frequency || 1200, now + start);
        if (filter.end) biquad.frequency.exponentialRampToValueAtTime(Math.max(40, filter.end), now + start + length);
        biquad.Q.setValueAtTime(filter.q || q, now + start);
        amp.connect(biquad);
        output = biquad;
      }
      connect(output, pan, send);
      osc.start(now + start);
      osc.stop(now + start + length + 0.04);
    };

    const texture = ({ start = 0, length = 0.28, gain = 0.12, pan = 0, filter = "bandpass", from = 1200, to = 400, q = 0.9, color = "air", send = 0.22, curve = 1.5 }) => {
      const safeLength = Math.max(filter === "highpass" ? 0.4 : 0.24, length);
      const safeFilter = filter === "highpass" && length < 0.4 ? "bandpass" : filter;
      const frames = Math.max(1, Math.floor(audioContext.sampleRate * safeLength));
      const buffer = audioContext.createBuffer(1, frames, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      let smoothed = 0;
      let drift = 0;
      for (let index = 0; index < frames; index += 1) {
        const p = index / frames;
        const attack = Math.min(1, p / 0.055);
        const release = (1 - p) ** curve;
        smoothed = smoothed * 0.78 + (Math.random() * 2 - 1) * 0.22;
        drift = drift * 0.995 + (Math.random() * 2 - 1) * 0.005;
        const water = color === "water" ? Math.sin(p * 95) * 0.14 + Math.sin(p * p * 1500) * 0.09 : 0;
        const ice = color === "ice" ? Math.sin(p * 520) * 0.12 + Math.sign(Math.sin(p * 130)) * 0.035 : 0;
        const stone = color === "stone" ? Math.sign(Math.sin(p * 190)) * 0.08 : 0;
        const metal = color === "metal" ? Math.sin(p * 260) * 0.08 : 0;
        data[index] = (smoothed + drift + water + ice + stone + metal) * attack * release;
      }
      const source = audioContext.createBufferSource();
      const biquad = audioContext.createBiquadFilter();
      const amp = audioContext.createGain();
      source.buffer = buffer;
      biquad.type = safeFilter;
      biquad.frequency.setValueAtTime(from, now + start);
      biquad.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + start + safeLength);
      biquad.Q.setValueAtTime(q, now + start);
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(gain, now + start + 0.045);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + safeLength);
      source.connect(biquad).connect(amp);
      connect(amp, pan, send);
      source.start(now + start);
      source.stop(now + start + safeLength + 0.04);
    };

    const impact = (start, frequency, gain, pan = 0, color = "air") => {
      tone({ start, length: 0.76, frequency, endFrequency: Math.max(18, frequency * 0.38), gain: gain * 0.72, type: "sine", pan, attack: 0.04, send: 0.2 });
      texture({ start: start + 0.035, length: 0.58, gain: gain * 0.24, pan, filter: color === "stone" || color === "water" ? "lowpass" : "bandpass", from: color === "stone" ? 900 : 3200, to: color === "water" ? 520 : 420, q: 0.62, color, send: 0.28, curve: 1.45 });
    };

    const bubble = (start, pan, size = 1) => {
      texture({ start, length: 0.24 + size * 0.12, gain: 0.06 * size, pan, filter: "bandpass", from: 480 + size * 300, to: 2400 + size * 700, q: 1.4, color: "water", send: 0.38, curve: 1.08 });
      tone({ start: start + 0.035, length: 0.24 + size * 0.08, frequency: 520 + size * 420, endFrequency: 980 + size * 760, gain: 0.022 * size, type: "sine", pan, attack: 0.028, send: 0.42 });
    };

    const metalSlash = (start, pan, reverse = false) => {
      texture({ start, length: 0.46, gain: 0.13, pan, filter: "bandpass", from: reverse ? 4600 : 1800, to: reverse ? 900 : 5200, q: 0.92, color: "metal", send: 0.3, curve: 1.35 });
      tone({ start: start + 0.03, length: 0.44, frequency: reverse ? 620 : 820, endFrequency: reverse ? 240 : 1280, gain: 0.042, type: "triangle", pan, attack: 0.028, filter: { type: "bandpass", start: 1400, end: 3600, q: 1.1 }, send: 0.36 });
    };

    const gesture = ({ start = 0, length = 0.9, color = "air", pan = 0, noiseGain = 0.1, toneGain = 0.04, from = 1800, to = 260, frequency = 220, endFrequency = 180, send = 0.32 }) => {
      texture({ start, length, gain: noiseGain, pan, filter: color === "water" || color === "stone" ? "lowpass" : "bandpass", from, to, q: 0.72, color, send, curve: 1.08 });
      tone({ start: start + length * 0.08, length: length * 0.72, frequency, endFrequency, gain: toneGain, type: color === "ice" ? "sine" : "triangle", pan, attack: 0.035, filter: { type: "bandpass", start: from * 0.42, end: Math.max(90, to * 1.4), q: 1.1 }, send: send + 0.08 });
    };

    const sparkleCloud = (start, count, color, baseFrequency, panStart = -0.24, panStep = 0.16) => {
      Array.from({ length: count }).forEach((_, index) => {
        const offset = start + index * 0.09;
        tone({
          start: offset,
          length: 0.36,
          frequency: baseFrequency + index * 86,
          endFrequency: baseFrequency * 1.45 + index * 112,
          gain: 0.018 + index * 0.002,
          type: "sine",
          pan: panStart + index * panStep,
          attack: 0.018,
          filter: { type: "bandpass", start: baseFrequency * 1.8, end: baseFrequency * 2.8, q: 1.6 },
          send: 0.46
        });
        texture({ start: offset + 0.02, length: 0.34, gain: 0.025, pan: panStart + index * panStep, filter: "bandpass", from: baseFrequency * 2.2, to: baseFrequency * 0.9, q: 1.2, color, send: 0.34, curve: 1.55 });
      });
    };

    if (profileId === "fizz") {
      gesture({ start: 0, length: 2.72, color: "water", pan: -0.08, noiseGain: 0.24, toneGain: 0.035, from: 720, to: 64, frequency: 92, endFrequency: 38, send: 0.42 });
      gesture({ start: 0.24, length: 1.25, color: "water", pan: 0.18, noiseGain: 0.14, toneGain: 0.02, from: 360, to: 2600, frequency: 210, endFrequency: 460, send: 0.5 });
      [0.08, 0.17, 0.3, 0.44, 0.62, 0.78, 0.96, 1.18, 1.42, 1.68].forEach((start, index) => {
        bubble(start, -0.42 + (index % 6) * 0.16, 0.55 + (index % 4) * 0.22);
      });
      texture({ start: 0.58, length: 1.08, gain: 0.12, pan: 0.12, filter: "bandpass", from: 4200, to: 820, q: 0.72, color: "water", send: 0.38, curve: 1.5 });
      tone({ start: 0.34, length: 1.45, frequency: 42, endFrequency: 27, gain: 0.16, type: "sine", pan: -0.02, attack: 0.06, send: 0.24 });
    } else if (profileId === "samira") {
      gesture({ start: 0, length: 1.55, color: "metal", pan: 0, noiseGain: 0.12, toneGain: 0.04, from: 4200, to: 520, frequency: 180, endFrequency: 132, send: 0.34 });
      [0.1, 0.27, 0.48, 0.72].forEach((start, index) => metalSlash(start, index % 2 ? 0.44 : -0.44, index % 2 === 0));
      impact(0.92, 48, 0.18, 0.02, "metal");
      texture({ start: 0.98, length: 0.9, gain: 0.09, pan: 0, filter: "bandpass", from: 5600, to: 700, q: 0.9, color: "metal", send: 0.36 });
    } else if (profileId === "caitlyn") {
      gesture({ start: 0.02, length: 1.18, color: "metal", pan: -0.08, noiseGain: 0.08, toneGain: 0.036, from: 900, to: 3600, frequency: 164, endFrequency: 246, send: 0.42 });
      sparkleCloud(0.12, 4, "metal", 920, -0.24, 0.16);
      texture({ start: 0.54, length: 0.56, gain: 0.1, pan: 0.18, filter: "bandpass", from: 4800, to: 1100, q: 0.92, color: "metal", send: 0.3, curve: 1.45 });
      impact(0.56, 58, 0.18, 0.1, "metal");
      gesture({ start: 0.74, length: 0.86, color: "air", pan: -0.28, noiseGain: 0.065, toneGain: 0.022, from: 2200, to: 320, frequency: 510, endFrequency: 210, send: 0.44 });
    } else if (profileId === "kaisa") {
      gesture({ start: 0, length: 2.1, color: "air", pan: 0, noiseGain: 0.11, toneGain: 0.055, from: 520, to: 6200, frequency: 64, endFrequency: 42, send: 0.42 });
      [0.12, 0.38, 0.68, 1.02].forEach((start, index) => {
        tone({ start, length: 0.42, frequency: 220 + index * 110, endFrequency: 330 + index * 150, gain: 0.045, type: "sawtooth", pan: index % 2 ? 0.24 : -0.24, filter: { type: "bandpass", start: 680, end: 5400, q: 1.8 }, send: 0.32 });
        texture({ start: start + 0.05, length: 0.44, gain: 0.08, pan: index % 2 ? 0.24 : -0.24, filter: "bandpass", from: 6400, to: 900, q: 1.0, color: "air", send: 0.32, curve: 1.45 });
      });
    } else if (profileId === "missfortune") {
      gesture({ start: 0.06, length: 1.65, color: "air", pan: 0, noiseGain: 0.1, toneGain: 0.03, from: 1800, to: 150, frequency: 86, endFrequency: 46, send: 0.38 });
      [0.26, 0.5].forEach((start, index) => {
        impact(start, index ? 54 : 62, 0.18, index ? 0.46 : -0.46, "metal");
        texture({ start: start + 0.04, length: 0.56, gain: 0.08, pan: index ? 0.55 : -0.55, filter: "bandpass", from: 4200, to: 900, q: 0.72, color: "metal", send: 0.28, curve: 1.45 });
      });
      sparkleCloud(0.7, 3, "metal", 980, -0.26, 0.26);
      texture({ start: 0.54, length: 1.1, gain: 0.1, pan: 0, filter: "lowpass", from: 1500, to: 140, q: 0.46, color: "air", send: 0.36 });
    } else if (profileId === "ezreal") {
      gesture({ start: 0, length: 1.7, color: "air", pan: 0.04, noiseGain: 0.1, toneGain: 0.04, from: 740, to: 7200, frequency: 180, endFrequency: 520, send: 0.48 });
      [0.08, 0.26, 0.48, 0.76].forEach((start, index) => {
        tone({ start, length: 0.28, frequency: 520 + index * 170, endFrequency: 980 + index * 220, gain: 0.046, type: "sine", pan: -0.34 + index * 0.22, filter: { type: "bandpass", start: 1800, end: 6800, q: 1.5 }, send: 0.36 });
      });
      texture({ start: 0.34, length: 0.96, gain: 0.11, pan: 0.1, filter: "bandpass", from: 8800, to: 1100, q: 0.8, color: "air", send: 0.42, curve: 1.22 });
      impact(0.92, 54, 0.14, 0.18, "air");
    } else if (profileId === "jhin") {
      gesture({ start: 0, length: 1.5, color: "metal", pan: 0, noiseGain: 0.075, toneGain: 0.045, from: 480, to: 1800, frequency: 146, endFrequency: 98, send: 0.52 });
      [0.12, 0.36, 0.62, 0.96].forEach((start, index) => {
        tone({ start, length: index === 3 ? 0.82 : 0.32, frequency: 196 + index * 49, endFrequency: index === 3 ? 98 : 160 + index * 36, gain: index === 3 ? 0.085 : 0.034, type: "triangle", pan: -0.18 + index * 0.12, filter: { type: "bandpass", start: 420 + index * 260, end: 980 + index * 320, q: 1.0 }, send: 0.5 });
        if (index < 3) texture({ start: start + 0.03, length: 0.44, gain: 0.024, pan: -0.18 + index * 0.12, filter: "bandpass", from: 2400, to: 940, q: 0.9, color: "metal", send: 0.34, curve: 1.4 });
      });
      impact(1.1, 38, 0.18, 0, "metal");
    } else if (profileId === "ashe") {
      gesture({ start: 0.04, length: 1.75, color: "ice", pan: -0.1, noiseGain: 0.14, toneGain: 0.04, from: 10800, to: 920, frequency: 320, endFrequency: 210, send: 0.5 });
      [0.34, 0.62, 0.94].forEach((start, index) => {
        tone({ start, length: 0.34, frequency: 880 + index * 420, endFrequency: 520 + index * 240, gain: 0.04, type: "sine", pan: -0.24 + index * 0.2, filter: { type: "bandpass", start: 4200, end: 1600, q: 2.8 }, send: 0.42 });
        texture({ start: start + 0.04, length: 0.42, gain: 0.06, pan: -0.24 + index * 0.2, filter: "bandpass", from: 7600, to: 2200, q: 1.4, color: "ice", send: 0.34, curve: 1.45 });
      });
      impact(1.0, 48, 0.13, 0.14, "ice");
    } else if (profileId === "rammus") {
      gesture({ start: 0, length: 2.42, color: "stone", pan: 0, noiseGain: 0.2, toneGain: 0.052, from: 760, to: 62, frequency: 42, endFrequency: 28, send: 0.22 });
      [0.16, 0.42, 0.72, 1.06, 1.44].forEach((start, index) => {
        impact(start, 30 + index * 3, 0.16 - index * 0.012, index % 2 ? 0.18 : -0.16, "stone");
        texture({ start: start + 0.045, length: 0.44, gain: 0.07, pan: index % 2 ? 0.28 : -0.24, filter: "bandpass", from: 940 + index * 160, to: 150, q: 0.65, color: "stone", send: 0.22, curve: 1.32 });
      });
    } else {
      impact(0.2, 48, 0.18, 0, "air");
      texture({ start: 0.05, length: 0.9, gain: 0.12, pan: 0, filter: "bandpass", from: 5600, to: 420, q: 0.8, color: "air", send: 0.24 });
    }
  } catch {
    // Foley is an enhancement; music and the base accent layer still play.
  }
}

function playPremiumMaterialFoley(profileId = "default") {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    audioContext ||= new AudioContextClass();
    if (audioContext.state === "suspended") audioContext.resume();
    const now = audioContext.currentTime + 0.012;
    const stage = cinematicStageFor(profileId);
    const profile = soundProfileFor(profileId);

    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-24, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(2.6, now);
    compressor.attack.setValueAtTime(0.006, now);
    compressor.release.setValueAtTime(0.24, now);
    compressor.connect(audioContext.destination);

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(Math.min(0.36, (profile.masterPeak || 0.42) * 0.68), now + 0.06);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 3.15);
    master.connect(compressor);

    const connect = (node, pan = 0) => {
      let output = node;
      if (audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(pan, now);
        output.connect(panner);
        output = panner;
      }
      output.connect(master);
    };

    const tone = ({ start = 0, length = 0.5, frequency = 160, endFrequency, gain = 0.05, type = "sine", pan = 0, attack = 0.035 }) => {
      const osc = audioContext.createOscillator();
      const amp = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, now + start);
      if (endFrequency) osc.frequency.exponentialRampToValueAtTime(Math.max(16, endFrequency), now + start + length);
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(gain, now + start + Math.max(0.018, attack));
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      osc.connect(amp);
      connect(amp, pan);
      osc.start(now + start);
      osc.stop(now + start + length + 0.04);
    };

    const texture = ({ start = 0, length = 0.7, gain = 0.08, pan = 0, filter = "bandpass", from = 1200, to = 260, q = 0.7, color = "air", curve = 1.3 }) => {
      const frames = Math.max(1, Math.floor(audioContext.sampleRate * Math.max(0.18, length)));
      const buffer = audioContext.createBuffer(1, frames, audioContext.sampleRate);
      const data = buffer.getChannelData(0);
      let smoothed = 0;
      for (let index = 0; index < frames; index += 1) {
        const p = index / frames;
        const attack = Math.min(1, p / 0.065);
        const release = (1 - p) ** curve;
        smoothed = smoothed * 0.84 + (Math.random() * 2 - 1) * 0.16;
        const water = color === "water" ? Math.sin(p * 90) * 0.13 + Math.sin(p * p * 1800) * 0.07 : 0;
        const glass = color === "glass" ? Math.sin(p * 480) * 0.06 : 0;
        const frost = color === "ice" ? Math.sin(p * 760) * 0.075 : 0;
        const grit = color === "stone" ? Math.sign(Math.sin(p * 160)) * 0.055 : 0;
        data[index] = (smoothed + water + glass + frost + grit) * attack * release;
      }
      const source = audioContext.createBufferSource();
      const biquad = audioContext.createBiquadFilter();
      const amp = audioContext.createGain();
      source.buffer = buffer;
      biquad.type = filter;
      biquad.frequency.setValueAtTime(Math.max(40, from), now + start);
      biquad.frequency.exponentialRampToValueAtTime(Math.max(40, to), now + start + length);
      biquad.Q.setValueAtTime(q, now + start);
      amp.gain.setValueAtTime(0.0001, now + start);
      amp.gain.exponentialRampToValueAtTime(gain, now + start + 0.05);
      amp.gain.exponentialRampToValueAtTime(0.0001, now + start + length);
      source.connect(biquad).connect(amp);
      connect(amp, pan);
      source.start(now + start);
      source.stop(now + start + length + 0.04);
    };

    if (stage.material === "water") {
      texture({ start: 0, length: 2.25, gain: 0.2, pan: -0.08, filter: "lowpass", from: 720, to: 86, q: 0.45, color: "water", curve: 0.95 });
      texture({ start: 0.18, length: 0.82, gain: 0.17, pan: 0.18, filter: "bandpass", from: 460, to: 4300, q: 0.9, color: "water", curve: 1.15 });
      texture({ start: 0.48, length: 0.42, gain: 0.18, pan: 0.28, filter: "highpass", from: 6200, to: 1300, q: 0.72, color: "water", curve: 1.9 });
      tone({ start: 0.34, length: 1.2, frequency: 46, endFrequency: 24, gain: 0.11, type: "sine", pan: -0.02, attack: 0.06 });
      [0.1, 0.19, 0.31, 0.46, 0.66, 0.9, 1.18].forEach((start, index) => {
        texture({ start, length: 0.28 + index * 0.018, gain: 0.038, pan: -0.42 + index * 0.14, filter: "bandpass", from: 620 + index * 120, to: 2200 + index * 260, q: 1.35, color: "water", curve: 1.05 });
      });
    } else if (stage.material === "scope") {
      texture({ start: 0.02, length: 0.9, gain: 0.07, pan: -0.08, filter: "bandpass", from: 720, to: 3600, q: 1.1, color: "glass", curve: 1.2 });
      tone({ start: 0.08, length: 0.72, frequency: 196, endFrequency: 294, gain: 0.04, type: "triangle", pan: -0.14 });
      texture({ start: 0.38, length: 0.22, gain: 0.2, pan: 0.26, filter: "highpass", from: 8200, to: 1400, q: 0.84, color: "glass", curve: 2.3 });
      tone({ start: 0.42, length: 0.42, frequency: 62, endFrequency: 22, gain: 0.1, type: "sine", pan: 0.08 });
    } else if (stage.material === "blade") {
      [0.08, 0.24, 0.44, 0.68].forEach((start, index) => {
        texture({ start, length: 0.42, gain: 0.088, pan: index % 2 ? 0.42 : -0.42, filter: "bandpass", from: index % 2 ? 5200 : 1600, to: index % 2 ? 900 : 6200, q: 0.88, color: "metal", curve: 1.25 });
      });
      tone({ start: 0.58, length: 0.66, frequency: 54, endFrequency: 20, gain: 0.1, type: "sine" });
    } else if (stage.material === "void") {
      texture({ start: 0, length: 1.8, gain: 0.12, pan: 0, filter: "bandpass", from: 420, to: 5200, q: 0.46, color: "air", curve: 0.9 });
      [0.2, 0.48, 0.82].forEach((start, index) => {
        tone({ start, length: 0.72, frequency: 68 + index * 18, endFrequency: 34, gain: 0.072, type: "sawtooth", pan: -0.2 + index * 0.2, attack: 0.05 });
      });
    } else if (stage.material === "gunfire") {
      [0.18, 0.38].forEach((start, index) => {
        texture({ start, length: 0.34, gain: 0.15, pan: index ? 0.48 : -0.48, filter: "bandpass", from: 5200, to: 520, q: 0.72, color: "metal", curve: 1.8 });
        tone({ start, length: 0.46, frequency: index ? 58 : 64, endFrequency: 20, gain: 0.09, type: "sine", pan: index ? 0.32 : -0.32 });
      });
      texture({ start: 0.48, length: 1.1, gain: 0.085, pan: 0, filter: "lowpass", from: 1200, to: 160, q: 0.45, color: "air", curve: 1.05 });
    } else if (stage.material === "arcane") {
      texture({ start: 0.04, length: 1.4, gain: 0.1, pan: 0.08, filter: "bandpass", from: 900, to: 8800, q: 0.8, color: "glass", curve: 1.1 });
      [0.08, 0.26, 0.48, 0.78].forEach((start, index) => {
        tone({ start, length: 0.36, frequency: 520 + index * 180, endFrequency: 940 + index * 230, gain: 0.036, type: "sine", pan: -0.36 + index * 0.22 });
      });
    } else if (stage.material === "stage") {
      texture({ start: 0, length: 1.6, gain: 0.08, pan: 0, filter: "bandpass", from: 520, to: 1800, q: 0.74, color: "air", curve: 1.0 });
      [0.12, 0.42, 0.78, 1.08].forEach((start, index) => tone({ start, length: index === 3 ? 0.82 : 0.38, frequency: 196 + index * 49, endFrequency: index === 3 ? 98 : 160 + index * 34, gain: index === 3 ? 0.068 : 0.035, type: "triangle", pan: -0.14 + index * 0.09 }));
    } else if (stage.material === "ice") {
      texture({ start: 0.04, length: 1.3, gain: 0.11, pan: -0.08, filter: "bandpass", from: 9200, to: 820, q: 1.2, color: "ice", curve: 1.2 });
      [0.32, 0.62, 0.94].forEach((start, index) => tone({ start, length: 0.48, frequency: 880 + index * 330, endFrequency: 520 + index * 160, gain: 0.038, type: "sine", pan: -0.2 + index * 0.2 }));
    } else if (stage.material === "quake") {
      texture({ start: 0, length: 2.2, gain: 0.17, pan: 0, filter: "lowpass", from: 760, to: 54, q: 0.38, color: "stone", curve: 0.9 });
      [0.16, 0.42, 0.76, 1.12].forEach((start, index) => tone({ start, length: 0.64, frequency: 34 + index * 4, endFrequency: 16, gain: 0.09, type: "sine", pan: index % 2 ? 0.18 : -0.18, attack: 0.045 }));
    }
  } catch {
    // Visual-synced foley should never block the music or selection sound.
  }
}

function playSelectSound(profileId = "default") {
  const soundId = soundProfileId(profileId);
  const stingerUrl = stingerUrls[soundId];
  if (!stingerUrl || !window.Audio) {
    playSynthSelectSound(soundId);
    return;
  }

  try {
    if (activeStinger) {
      activeStinger.pause();
      activeStinger.currentTime = 0;
    }
    const audio = new window.Audio(stingerUrl);
    audio.volume = 0.92;
    activeStinger = audio;
    const playback = audio.play();
    if (playback?.catch) {
      playback.catch(() => {
        if (activeStinger === audio) activeStinger = undefined;
        playSynthSelectSound(soundId);
      });
    }
    playChampionFoley(profileId);
    playPremiumMaterialFoley(profileId);
  } catch {
    playSynthSelectSound(soundId);
  }
}

function playSelectionBurst(button, profileId = "default") {
  if (motionQuery.matches || !page) return;
  const profile = fxProfileFor(profileId);
  applyFxProfileVars(page, profile);
  if (button) {
    const center = fxCenterFor(button);
    page.style.setProperty("--burst-x", `${center.x}px`);
    page.style.setProperty("--burst-y", `${center.y}px`);
  }
  window.clearTimeout(burstTimer);
  page.classList.remove("is-bursting");
  void page.offsetWidth;
  page.classList.add("is-bursting");
  burstTimer = window.setTimeout(() => {
    page.classList.remove("is-bursting");
  }, 2600);
}

function easeOutCubic(value) {
  return 1 - ((1 - value) ** 3);
}

function easeInOutCubic(value) {
  return value < 0.5 ? 4 * value * value * value : 1 - ((-2 * value + 2) ** 3) / 2;
}

function easeInOutSine(value) {
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function easeOutQuint(value) {
  return 1 - ((1 - value) ** 5);
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

function sceneEnvelope(t, outStart = 0.78) {
  return smoothstep(0, 0.08, t) * (1 - smoothstep(outStart, 1, t));
}

function cinematicStageFor(profileId = "default") {
  return {
    ...defaultCinematicStage,
    ...(cinematicStages[profileId] || {})
  };
}

function beatPulse(t, beat, width = 0.055) {
  return Math.max(0, 1 - Math.abs(t - beat) / width) ** 2.4;
}

function stageImpactPulse(t, stage, width = 0.06) {
  return stage.impacts.reduce((sum, beat) => sum + beatPulse(t, beat, width), 0);
}

function drawRadialGlow(ctx, x, y, radius, stops, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  ctx.restore();
}

function drawStreak(ctx, x1, y1, x2, y2, width, color, alpha = 1, blur = 16) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function drawCurveStreak(ctx, points, width, color, alpha = 1, blur = 16) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  if (points.length === 4) {
    ctx.bezierCurveTo(points[1][0], points[1][1], points[2][0], points[2][1], points[3][0], points[3][1]);
  } else if (points.length === 3) {
    ctx.quadraticCurveTo(points[1][0], points[1][1], points[2][0], points[2][1]);
  } else {
    points.slice(1).forEach(([x, y]) => ctx.lineTo(x, y));
  }
  ctx.stroke();
  ctx.restore();
}

function drawCinematicBackdrop(ctx, width, height, t, profile) {
  const alpha = sceneEnvelope(t, 0.86);
  const cx = width * (0.5 + Math.sin(t * 2.8) * 0.025);
  const cy = height * (0.48 + Math.cos(t * 2.1) * 0.025);
  ctx.save();
  ctx.fillStyle = `rgba(${profile.dark}, ${0.04 + alpha * 0.09})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  drawRadialGlow(ctx, cx, cy, Math.max(width, height) * 0.58, [
    [0, `rgba(${profile.main}, .22)`],
    [0.34, `rgba(${profile.secondary}, .11)`],
    [0.72, `rgba(${profile.third}, .06)`],
    [1, `rgba(${profile.main}, 0)`]
  ], alpha);
  const sweep = ctx.createLinearGradient(-width * 0.2, 0, width * 1.2, height);
  sweep.addColorStop(0, `rgba(${profile.main}, 0)`);
  sweep.addColorStop(0.44, `rgba(255, 252, 235, ${0.08 * alpha})`);
  sweep.addColorStop(0.5, `rgba(${profile.main}, ${0.2 * alpha})`);
  sweep.addColorStop(0.58, `rgba(${profile.secondary}, ${0.09 * alpha})`);
  sweep.addColorStop(1, `rgba(${profile.third}, 0)`);
  ctx.fillStyle = sweep;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawDepthDust(ctx, width, height, t, profile, count = 82, speed = 1) {
  const alpha = sceneEnvelope(t, 0.9);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const depth = 0.25 + seededUnit(index, 7.7) * 0.95;
    const drift = ((t * speed * (0.16 + depth * 0.22) + seededUnit(index, 8.1)) % 1);
    const side = seededUnit(index, 9.6) > 0.5 ? 1 : -1;
    const x = width * (seededUnit(index, 2.4) + side * (drift - 0.5) * 0.22 * depth);
    const y = height * ((seededUnit(index, 3.6) + drift * 0.42) % 1);
    const radius = (1.1 + depth * 3.7) * (width < 700 ? 0.78 : 1);
    const rgb = profile.sparkColors[index % profile.sparkColors.length] || profile.main;
    ctx.globalAlpha = alpha * (0.035 + depth * 0.08);
    ctx.shadowColor = `rgba(${rgb}, .6)`;
    ctx.shadowBlur = 10 + depth * 12;
    ctx.fillStyle = `rgba(${rgb}, .58)`;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * (1 + depth * 0.8), radius, t * 4 + index, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCameraShudder(ctx, width, height, t, profile) {
  const pulse = smoothstep(0.16, 0.34, t) * (1 - smoothstep(0.72, 1, t));
  if (!pulse) return;
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = pulse * 0.04;
  const lineCount = 3;
  for (let index = 0; index < lineCount; index += 1) {
    const y = height * (0.2 + index * 0.14 + Math.sin(t * 10 + index) * 0.02);
    const gradient = ctx.createLinearGradient(0, y, width, y);
    gradient.addColorStop(0, `rgba(${profile.main}, 0)`);
    gradient.addColorStop(0.5, `rgba(255, 252, 235, .8)`);
    gradient.addColorStop(1, `rgba(${profile.secondary}, 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, width, 1.2 + index * 0.2);
  }
  ctx.restore();
}

const ultimateVertexShader = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const ultimateFragmentShader = `
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_progress;
uniform int u_scene;
uniform vec3 u_main;
uniform vec3 u_secondary;
uniform vec3 u_third;
uniform vec3 u_dark;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.05 + 3.17;
    a *= 0.5;
  }
  return v;
}

float sdSegment(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

mat2 rotate2d(float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c);
}

float ring(float d, float r, float w) {
  return 1.0 - smoothstep(w, w * 2.5, abs(d - r));
}

vec3 baseField(vec2 p, float fade) {
  float mist = fbm(p * 2.0 + vec2(u_time * 0.045, -u_time * 0.026));
  float largeMist = fbm(p * 0.92 + vec2(-u_time * 0.018, u_time * 0.014));
  float fineMist = fbm(p * 6.4 + vec2(u_time * 0.16, -u_time * 0.1));
  float aura = exp(-dot(p, p) * 2.0);
  float edge = 1.0 - smoothstep(0.14, 1.38, length(p));
  float sweep = exp(-abs(p.y + sin(p.x * 2.2 + u_time * 0.42) * 0.04) * 5.2);
  float glass = pow(max(0.0, 1.0 - length(p * vec2(0.78, 1.08))), 2.4);
  vec3 col = u_dark * (0.22 + largeMist * 0.18) * edge;
  col += mix(u_main, vec3(1.0), 0.14) * aura * (0.24 + mist * 0.22);
  col += u_secondary * exp(-length(p - vec2(0.22, -0.06)) * 2.8) * 0.18;
  col += u_third * exp(-length(p + vec2(0.26, 0.12)) * 3.0) * 0.14;
  col += mix(u_main, u_third, 0.42) * sweep * (0.035 + fineMist * 0.06) * edge;
  col += vec3(1.0, 0.96, 0.82) * glass * 0.035;
  return col * fade;
}

vec3 particleField(vec2 p, float fade, float speed) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < 58; i++) {
    float fi = float(i);
    vec2 seed = vec2(hash21(vec2(fi, 1.7)), hash21(vec2(fi, 7.3)));
    float depth = 0.3 + hash21(vec2(fi, 13.4)) * 1.4;
    vec2 pos = vec2(seed.x * 2.4 - 1.2, seed.y * 1.8 - 0.9);
    pos += vec2(sin(u_time * (0.24 + depth * 0.1) + fi), cos(u_time * (0.18 + depth * 0.08) + fi * 0.7)) * 0.08 * depth;
    pos.y += mod(u_time * speed * (0.05 + depth * 0.05) + seed.x, 1.8) - 0.9;
    float d = length(p - pos);
    float spark = exp(-d * d * (190.0 / depth));
    vec3 sparkColor = mix(u_main, mix(u_secondary, u_third, seed.y), seed.x);
    col += sparkColor * spark * (0.05 + depth * 0.04);
  }
  return col * fade;
}

vec3 samiraFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  float r = length(p);
  float a = atan(p.y, p.x);
  float heat = fbm(p * 4.8 + vec2(u_time * 0.28, -u_time * 0.12));
  col += mix(u_secondary, u_main, heat) * exp(-r * 1.85) * (0.12 + 0.12 * sin(a * 3.0 + u_time * 1.4));
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float ang = u_time * 1.6 + fi * 0.9;
    vec2 axis = vec2(cos(ang), sin(ang) * 0.55);
    float d = sdSegment(p, axis * -0.72, axis * 0.72);
    float slash = exp(-d * 34.0) * smoothstep(0.72, 0.0, abs(dot(p, normalize(axis.yx * vec2(-1.0, 1.0)))));
    col += mix(u_main, u_secondary, mod(fi, 2.0)) * slash * (0.08 + 0.035 * sin(u_time * 7.0 + fi));
  }
  col += u_third * pow(max(0.0, 1.0 - r), 3.0) * 0.4;
  return col * fade;
}

vec3 caitlynFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  float r = length(p);
  float a = atan(p.y, p.x);
  float glass = exp(-r * r * 1.7);
  float iris = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    iris += ring(r, 0.2 + fi * 0.12 + sin(u_time * 0.6 + fi) * 0.004, 0.012 + fi * 0.002);
  }
  float aperture = 0.0;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 q = rotate2d(fi * 0.785 + sin(u_time * 0.26) * 0.02) * p;
    aperture += smoothstep(0.018, 0.0, abs(q.x)) * smoothstep(0.66, 0.08, abs(q.y)) * 0.22;
  }
  float ticks = smoothstep(0.985, 1.0, sin(a * 72.0 + u_time * 0.35));
  col += mix(u_main, vec3(1.0, 0.95, 0.76), 0.36) * iris * (0.2 + ticks * 0.12);
  col += u_third * aperture * glass * 0.24;
  float cross = exp(-abs(p.x) * 75.0) + exp(-abs(p.y) * 75.0);
  col += vec3(1.0, 0.94, 0.72) * cross * 0.045;
  float shot = smoothstep(0.33, 0.47, u_progress) * (1.0 - smoothstep(0.72, 0.95, u_progress));
  float beam = exp(-sdSegment(p, vec2(-1.15, -0.46), vec2(0.0, 0.0)) * 58.0);
  float muzzleMist = fbm(p * 6.0 + vec2(-u_time * 0.36, u_time * 0.1));
  col += vec3(1.0, 0.93, 0.72) * beam * shot * (0.62 + muzzleMist * 0.22);
  col += u_third * exp(-r * r * 10.0) * shot * 0.8;
  col += vec3(0.82, 0.95, 1.0) * glass * fbm(p * 8.0 + u_time * 0.1) * 0.05;
  return col * fade;
}

vec3 fizzFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  float water = fbm(p * vec2(3.0, 5.0) + vec2(u_time * 0.12, u_time * 0.04));
  float deep = fbm(p * vec2(1.2, 2.2) + vec2(-u_time * 0.04, u_time * 0.03));
  float caustic = pow(abs(sin((p.x + water * 0.18) * 18.0 + u_time * 1.6) * sin((p.y - water * 0.1) * 14.0 - u_time)), 6.0);
  float foam = pow(abs(sin((p.x * 9.0 + p.y * 3.2) + water * 4.0 - u_time * 2.2)), 12.0);
  col += u_dark * deep * 0.16;
  col += u_main * caustic * 0.46;
  col += vec3(0.82, 1.0, 0.96) * foam * smoothstep(-0.12, 0.52, p.y) * 0.18;
  vec2 q = p - vec2(0.02, 0.14 - u_progress * 0.12);
  q = rotate2d(-0.18 + sin(u_time * 0.5) * 0.05) * q;
  float bodyD = length(q / vec2(0.82, 0.22));
  float tailD = length((q + vec2(0.64, -0.01)) / vec2(0.34, 0.2));
  float finD = length((q + vec2(0.1, -0.22)) / vec2(0.15, 0.28));
  float body = smoothstep(0.5, 0.0, bodyD);
  float tail = smoothstep(0.34, 0.0, tailD);
  float fin = smoothstep(0.26, 0.0, finD);
  float shadow = max(body, max(tail * 0.7, fin * 0.6));
  float bodyEdge = 1.0 - smoothstep(0.0, 0.05, abs(bodyD - 0.5));
  float tailEdge = 1.0 - smoothstep(0.0, 0.05, abs(tailD - 0.34));
  float finEdge = 1.0 - smoothstep(0.0, 0.045, abs(finD - 0.26));
  float outline = max(bodyEdge, max(tailEdge * 0.7, finEdge * 0.74));
  float eye = exp(-length(q - vec2(0.42, -0.02)) * 58.0);
  col += mix(u_dark * 0.58, u_main * 0.34, body) * shadow * 1.18;
  col += vec3(0.78, 1.0, 0.95) * outline * (0.18 + caustic * 0.12);
  col += vec3(1.0, 0.28, 0.16) * eye * 0.36;
  col += u_main * exp(-abs(q.y + 0.02) * 15.0) * smoothstep(-0.1, 0.64, q.x) * smoothstep(0.82, 0.15, q.x) * 0.26;
  col += u_secondary * caustic * exp(-length(p - vec2(0.0, 0.12)) * 1.8) * 0.24;
  for (int i = 0; i < 22; i++) {
    float fi = float(i);
    vec2 seed = vec2(hash21(vec2(fi, 4.1)), hash21(vec2(fi, 8.4)));
    vec2 bubble = vec2(seed.x * 2.2 - 1.1 + sin(u_time + fi) * 0.035, 0.82 - fract(seed.y + u_time * (0.05 + seed.x * 0.08)) * 1.55);
    float b = ring(length(p - bubble), 0.01 + seed.x * 0.018, 0.006 + seed.y * 0.004);
    col += vec3(0.8, 1.0, 0.96) * b * (0.045 + seed.y * 0.045);
  }
  return col * fade;
}

vec3 kaisaFx(vec2 p, float fade) {
  vec2 q = rotate2d(u_time * 0.12) * p;
  float r = length(q);
  float a = atan(q.y, q.x);
  vec3 col = vec3(0.0);
  float vortex = sin(a * 9.0 - r * 13.0 + u_time * 2.1);
  float membrane = fbm(q * 5.2 + vec2(cos(a + u_time), sin(a - u_time)) * 0.12);
  col += mix(u_secondary, u_main, vortex * 0.5 + 0.5) * exp(-r * 2.25) * (0.28 + membrane * 0.18);
  col += u_third * pow(max(0.0, 1.0 - r), 2.8) * 0.34;
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float y = -0.52 + fi * 0.16;
    float wing = exp(-sdSegment(p, vec2(0.0, 0.0), vec2(0.78, y + sin(u_time + fi) * 0.04)) * (18.0 - fi * 1.2));
    wing += exp(-sdSegment(p, vec2(0.0, 0.0), vec2(-0.78, y - sin(u_time + fi) * 0.04)) * (18.0 - fi * 1.2));
    col += mix(u_main, u_third, fi / 7.0) * wing * (0.08 + membrane * 0.05);
  }
  col += vec3(0.85, 0.95, 1.0) * ring(r, 0.18 + sin(u_time * 0.9) * 0.015, 0.018) * 0.34;
  return col * fade;
}

vec3 missFortuneFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  float left = exp(-sdSegment(p, vec2(-0.48, 0.65), vec2(-1.18, -0.34)) * 18.0);
  float right = exp(-sdSegment(p, vec2(0.48, 0.65), vec2(1.18, -0.34)) * 18.0);
  float smoke = fbm(p * 3.4 + vec2(0.0, -u_time * 0.28));
  col += u_main * left * (0.28 + smoke * 0.18);
  col += u_secondary * right * (0.3 + smoke * 0.16);
  col += vec3(1.0, 0.78, 0.38) * exp(-length(p - vec2(-0.45, 0.48)) * 7.0) * 0.5;
  col += vec3(1.0, 0.58, 0.58) * exp(-length(p - vec2(0.45, 0.48)) * 7.0) * 0.5;
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    vec2 dir = vec2(sign(mod(fi, 2.0) - 0.5), -1.0);
    vec2 start = vec2(dir.x * 0.45, 0.55);
    vec2 end = start + normalize(vec2(dir.x * (0.55 + hash21(vec2(fi, 3.0)) * 0.4), -0.7)) * 1.3;
    float tracer = exp(-sdSegment(p, start, end) * 55.0) * (0.4 + hash21(vec2(fi, 9.0)));
    col += mix(u_main, u_secondary, mod(fi, 2.0)) * tracer * 0.08;
  }
  return col * fade;
}

vec3 ezrealFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  vec2 start = vec2(-1.05, 0.68);
  vec2 end = vec2(1.1, -0.62);
  vec2 missile = mix(start, end, smoothstep(0.04, 0.82, u_progress));
  float trail = exp(-sdSegment(p, start, missile) * 12.0);
  float core = exp(-length(p - missile) * 9.0);
  col += u_main * trail * 0.38 + u_secondary * trail * 0.16;
  col += vec3(1.0, 0.96, 0.74) * core * 1.05;
  col += u_third * exp(-length(p - missile) * 3.2) * 0.34;
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    vec2 rune = mix(start, end, fract(u_progress * 1.6 - fi * 0.11));
    float d = abs(abs((p.x - rune.x)) + abs((p.y - rune.y)) - 0.055);
    col += mix(u_secondary, u_main, mod(fi, 2.0)) * (1.0 - smoothstep(0.0, 0.012, d)) * 0.16;
  }
  return col * fade;
}

vec3 jhinFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  float spotlight = smoothstep(0.84, 0.08, abs(p.x * 0.34) + max(0.0, p.y + 0.08));
  col += u_main * spotlight * 0.18;
  vec2 q = p * rotate2d(u_time * 0.12);
  float r = length(q);
  float a = atan(q.y, q.x);
  float aperture = smoothstep(0.88, 1.0, cos(a * 4.0 - u_time * 0.8)) * exp(-r * 1.6);
  col += mix(u_secondary, u_main, smoothstep(0.0, 0.8, r)) * aperture * 0.45;
  for (int i = 0; i < 38; i++) {
    float fi = float(i);
    vec2 seed = vec2(hash21(vec2(fi, 2.1)), hash21(vec2(fi, 6.4)));
    vec2 pos = vec2(seed.x * 2.0 - 1.0, seed.y * 1.3 - 0.64);
    pos += vec2(sin(u_time * 0.22 + fi), cos(u_time * 0.18 + fi)) * 0.06;
    float petal = exp(-length(rotate2d(fi) * (p - pos)) * 18.0);
    col += mix(u_secondary, u_main, seed.x) * petal * 0.045;
  }
  float shot = smoothstep(0.28, 0.38, u_progress) * (1.0 - smoothstep(0.72, 0.96, u_progress));
  col += vec3(1.0, 0.9, 0.72) * exp(-abs(p.y) * 80.0) * shot * 0.26;
  return col * fade;
}

vec3 asheFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  vec2 start = vec2(-1.02, 0.22);
  vec2 end = vec2(1.08, -0.2);
  vec2 arrow = mix(start, end, smoothstep(0.03, 0.8, u_progress));
  float path = exp(-sdSegment(p, start, arrow) * 18.0);
  float head = exp(-length((p - arrow) / vec2(0.16, 0.08)) * 7.0);
  col += u_main * path * 0.34 + vec3(1.0, 1.0, 1.0) * head * 0.82;
  float frost = fbm(p * 7.0 - u_time * 0.08);
  col += u_secondary * pow(frost, 5.0) * 0.34;
  for (int i = 0; i < 10; i++) {
    float fi = float(i);
    float crack = exp(-sdSegment(p, arrow - vec2(fi * 0.05, 0.0), arrow - vec2(0.35 + fi * 0.06, (hash21(vec2(fi, 5.0)) - 0.5) * 0.32)) * 70.0);
    col += vec3(0.82, 0.96, 1.0) * crack * 0.07;
  }
  return col * fade;
}

vec3 rammusFx(vec2 p, float fade) {
  vec3 col = vec3(0.0);
  vec2 center = vec2(-0.82 + u_progress * 1.7, 0.44 + sin(u_time * 0.6) * 0.04);
  float d = length((p - center) / vec2(1.0, 0.45));
  float wake = exp(-abs(d - (0.36 + u_progress * 0.34)) * 9.0) * smoothstep(0.95, 0.2, p.x - center.x);
  col += mix(u_secondary, u_main, 0.42) * wake * 0.18;
  float shell = exp(-length(p - center) * 6.0);
  col += mix(u_main, u_third, 0.5) * shell * 0.58;
  float dust = fbm((p - center) * 5.0 + vec2(-u_time * 0.4, u_time * 0.12));
  col += u_secondary * dust * smoothstep(0.7, 0.1, abs(p.y - 0.58)) * 0.16;
  return col * fade;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float fade = smoothstep(0.0, 0.05, u_progress) * (1.0 - smoothstep(0.9, 1.0, u_progress));
  vec3 col = baseField(p, fade);
  col += particleField(p, fade, 1.0) * 0.08;
  if (u_scene == 1) col += samiraFx(p, fade);
  else if (u_scene == 2) col += caitlynFx(p, fade);
  else if (u_scene == 3) col += fizzFx(p, fade);
  else if (u_scene == 4) col += kaisaFx(p, fade);
  else if (u_scene == 5) col += missFortuneFx(p, fade);
  else if (u_scene == 6) col += ezrealFx(p, fade);
  else if (u_scene == 7) col += jhinFx(p, fade);
  else if (u_scene == 8) col += asheFx(p, fade);
  else if (u_scene == 9) col += rammusFx(p, fade);
  float vignette = 1.0 - smoothstep(0.2, 1.28, length(p));
  float letter = 1.0 - smoothstep(0.36, 0.5, abs(p.y));
  float centerBloom = exp(-dot(p, p) * 1.25);
  col += mix(u_dark, u_main, 0.18) * centerBloom * 0.08 * fade;
  col *= 0.86 + vignette * 0.28 + letter * 0.06;
  float grain = hash21(gl_FragCoord.xy + floor(u_time * 60.0)) - 0.5;
  col = col * 1.34 + grain * 0.018 * fade;
  float alpha = clamp(max(max(col.r, col.g), col.b) * 1.08 + fade * 0.24, 0.0, 0.96);
  gl_FragColor = vec4(col, alpha);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createUltimateShaderState(canvas) {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: true,
    depth: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  });
  if (!gl) return null;
  const vertex = compileShader(gl, gl.VERTEX_SHADER, ultimateVertexShader);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, ultimateFragmentShader);
  if (!vertex || !fragment) return null;
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn(gl.getProgramInfoLog(program));
    return null;
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,
    1, -1,
    -1, 1,
    -1, 1,
    1, -1,
    1, 1
  ]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "a_position");
  return {
    gl,
    program,
    buffer,
    position,
    resolution: gl.getUniformLocation(program, "u_resolution"),
    time: gl.getUniformLocation(program, "u_time"),
    progress: gl.getUniformLocation(program, "u_progress"),
    scene: gl.getUniformLocation(program, "u_scene"),
    main: gl.getUniformLocation(program, "u_main"),
    secondary: gl.getUniformLocation(program, "u_secondary"),
    third: gl.getUniformLocation(program, "u_third"),
    dark: gl.getUniformLocation(program, "u_dark")
  };
}

function colorVector(value) {
  return value.split(",").map((part) => Number(part.trim()) / 255);
}

function renderUltimateShader(state, profile, width, height, elapsed, duration, dpr) {
  if (!state) return;
  const { gl, program, buffer, position } = state;
  const pixelWidth = Math.round(width * dpr);
  const pixelHeight = Math.round(height * dpr);
  if (gl.canvas.width !== pixelWidth || gl.canvas.height !== pixelHeight) {
    gl.canvas.width = pixelWidth;
    gl.canvas.height = pixelHeight;
    gl.canvas.style.width = `${width}px`;
    gl.canvas.style.height = `${height}px`;
  }
  const main = colorVector(profile.main);
  const secondary = colorVector(profile.secondary);
  const third = colorVector(profile.third);
  const dark = colorVector(profile.dark);
  gl.viewport(0, 0, pixelWidth, pixelHeight);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(state.resolution, pixelWidth, pixelHeight);
  gl.uniform1f(state.time, elapsed / 1000);
  gl.uniform1f(state.progress, clamp(elapsed / duration, 0, 1));
  gl.uniform1i(state.scene, shaderSceneIds[profile.id] || 0);
  gl.uniform3f(state.main, main[0], main[1], main[2]);
  gl.uniform3f(state.secondary, secondary[0], secondary[1], secondary[2]);
  gl.uniform3f(state.third, third[0], third[1], third[2]);
  gl.uniform3f(state.dark, dark[0], dark[1], dark[2]);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function coverImageBox(image, width, height, scale = 1, xOffset = 0, yOffset = 0) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  return {
    x: (width - drawWidth) / 2 + xOffset,
    y: (height - drawHeight) / 2 + yOffset,
    width: drawWidth,
    height: drawHeight
  };
}

function coverImageBoxFocused(image, width, height, scale = 1, focusX = 0.5, focusY = 0.5, xOffset = 0, yOffset = 0) {
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  let x = width * 0.5 - drawWidth * focusX + xOffset;
  let y = height * 0.5 - drawHeight * focusY + yOffset;
  if (drawWidth > width) x = clamp(x, width - drawWidth, 0);
  if (drawHeight > height) y = clamp(y, height - drawHeight, 0);
  return {
    x,
    y,
    width: drawWidth,
    height: drawHeight
  };
}

function drawFocusedImage(ctx, image, width, height, options = {}) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const {
    alpha = 1,
    composite = "source-over",
    filter = "none",
    focusX = 0.5,
    focusY = 0.5,
    scale = 1,
    xOffset = 0,
    yOffset = 0,
    rotation = 0
  } = options;
  const box = coverImageBoxFocused(image, width, height, scale, focusX, focusY, xOffset, yOffset);
  ctx.save();
  ctx.globalCompositeOperation = composite;
  ctx.globalAlpha = alpha;
  ctx.filter = filter;
  if (rotation) {
    ctx.translate(width * 0.5, height * 0.5);
    ctx.rotate(rotation);
    ctx.translate(-width * 0.5, -height * 0.5);
  }
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  ctx.restore();
}

function drawCoverImage(ctx, image, width, height, opacity, scale = 1, xOffset = 0, yOffset = 0) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const box = coverImageBox(image, width, height, scale, xOffset, yOffset);
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.filter = "blur(14px) saturate(1.5) contrast(1.1) brightness(.54)";
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  ctx.restore();
}

function drawPortraitProjection(ctx, image, width, height, t, profile) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const alpha = sceneEnvelope(t, 0.9);
  const drift = Math.sin(t * 2.6) * width * 0.026;
  const box = coverImageBox(
    image,
    width,
    height,
    1.03 + Math.sin(t * 1.8) * 0.012,
    drift,
    Math.cos(t * 2.2) * height * 0.016
  );
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha * 0.24;
  ctx.filter = "blur(26px) saturate(1.44) contrast(1.2) brightness(.34)";
  ctx.drawImage(image, box.x - box.width * 0.12, box.y - box.height * 0.08, box.width * 1.24, box.height * 1.16);
  ctx.globalAlpha = alpha * 0.84;
  ctx.filter = "blur(.4px) saturate(1.4) contrast(1.25) brightness(.76)";
  ctx.drawImage(image, box.x, box.y, box.width, box.height);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * 0.1;
  ctx.filter = "blur(0px) saturate(1.72) contrast(1.22)";
  ctx.drawImage(image, box.x + width * 0.014, box.y - height * 0.006, box.width, box.height);
  ctx.globalAlpha = alpha * 0.16;
  ctx.fillStyle = `rgba(${profile.main}, .18)`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawArtworkParallaxRifts(ctx, image, width, height, t, profile) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const alpha = sceneEnvelope(t, 0.88);
  const box = coverImageBox(image, width, height, 1.08 + Math.sin(t * 1.4) * 0.01, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < 7; index += 1) {
    const start = index / 7;
    const end = (index + 0.72) / 7;
    const center = (start + end) * 0.5;
    const skew = Math.sin(t * 4.2 + index * 1.7) * width * 0.014;
    const sliceX = width * start;
    const sliceWidth = width * (end - start);
    ctx.save();
    ctx.beginPath();
    ctx.rect(sliceX, 0, sliceWidth, height);
    ctx.clip();
    ctx.globalAlpha = alpha * (0.035 + index * 0.006);
    ctx.filter = "blur(.2px) saturate(1.78) contrast(1.18) brightness(1.05)";
    ctx.drawImage(
      image,
      box.x + skew + Math.cos(t * 2.5 + index) * width * 0.01,
      box.y + Math.sin(t * 2.2 + index) * height * 0.006,
      box.width,
      box.height
    );
    const sweep = ctx.createLinearGradient(sliceX, 0, sliceX + sliceWidth, height);
    sweep.addColorStop(0, `rgba(${profile.main}, 0)`);
    sweep.addColorStop(0.52, `rgba(255, 252, 232, ${0.12 * alpha * (1 - Math.abs(center - 0.5))})`);
    sweep.addColorStop(1, `rgba(${profile.secondary}, 0)`);
    ctx.fillStyle = sweep;
    ctx.fillRect(sliceX, 0, sliceWidth, height);
    ctx.restore();
  }
  ctx.restore();
}

function drawArtworkDepthPanels(ctx, image, width, height, t, profile, stage, alpha) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const sweep = easeInOutSine(smoothstep(0.04, 0.9, t));
  const baseZoom = stage.zoomStart + (stage.zoomEnd - stage.zoomStart) * sweep;
  ctx.save();
  const side = Math.sin(t * Math.PI * 1.7) > 0 ? 1 : -1;
  drawFocusedImage(ctx, image, width, height, {
    alpha: alpha * 0.09,
    composite: "screen",
    filter: "blur(1.4px) saturate(1.82) contrast(1.26) brightness(1.02)",
    focusX: stage.focusX,
    focusY: stage.focusY,
    scale: baseZoom + 0.055,
    xOffset: width * (stage.panX * sweep + side * 0.018 * (1 - sweep)),
    yOffset: height * (stage.panY * sweep - 0.01 * Math.sin(t * Math.PI)),
    rotation: stage.roll * 1.2
  });

  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < 5; index += 1) {
    const p = (sweep + index * 0.19) % 1;
    const x = width * (-0.12 + p * 1.24);
    const angle = -0.34 + stage.roll * 1.8 + Math.sin(t * 2.6 + index) * 0.04;
    const band = ctx.createLinearGradient(x - width * 0.18, height * 0.16, x + width * 0.18, height * 0.86);
    band.addColorStop(0, `rgba(${profile.main}, 0)`);
    band.addColorStop(0.46, `rgba(255, 252, 232, ${0.038 * alpha * (1 - index * 0.08)})`);
    band.addColorStop(0.54, `rgba(${profile.secondary}, ${0.028 * alpha})`);
    band.addColorStop(1, `rgba(${profile.third}, 0)`);
    ctx.save();
    ctx.translate(x, height * 0.5);
    ctx.rotate(angle);
    ctx.fillStyle = band;
    ctx.filter = `blur(${1.6 + index * 0.45}px)`;
    ctx.fillRect(-width * 0.19, -height * 0.72, width * (0.04 + index * 0.007), height * 1.44);
    ctx.restore();
  }
  ctx.restore();
}

function drawImpactArtEcho(ctx, image, width, height, t, profile, stage, alpha) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  stage.impacts.forEach((beat, index) => {
    const pulse = beatPulse(t, beat, 0.07);
    if (!pulse) return;
    const side = index % 2 ? 1 : -1;
    const offset = easeOutQuint(pulse) * width * 0.024 * side;
    drawFocusedImage(ctx, image, width, height, {
      alpha: alpha * pulse * 0.075,
      composite: "screen",
      filter: "blur(3.2px) saturate(1.9) contrast(1.24) brightness(1.08)",
      focusX: stage.focusX,
      focusY: stage.focusY,
      scale: stage.zoomEnd + pulse * 0.08,
      xOffset: width * stage.panX + offset,
      yOffset: height * stage.panY - pulse * height * 0.012,
      rotation: stage.roll + side * pulse * 0.012
    });
    const cx = width * (0.5 + stage.panX * 0.4 + side * 0.04);
    const cy = height * (0.5 + stage.panY * 0.34);
    drawRadialGlow(ctx, cx, cy, Math.max(width, height) * (0.34 + pulse * 0.18), [
      [0, `rgba(255, 252, 232, ${0.26 * pulse})`],
      [0.28, `rgba(${profile.main}, ${0.18 * pulse})`],
      [0.62, `rgba(${profile.secondary}, ${0.08 * pulse})`],
      [1, `rgba(${profile.third}, 0)`]
    ], alpha);
  });
}

function drawMaterialVeil(ctx, width, height, t, profile, stage, alpha) {
  const material = stage.material;
  const sweep = easeInOutSine(smoothstep(0.04, 0.88, t));
  const impact = Math.min(1, stageImpactPulse(t, stage, 0.08));
  ctx.save();
  ctx.globalCompositeOperation = "screen";

  if (material === "water") {
    for (let i = 0; i < 9; i += 1) {
      const y = height * (0.52 + i * 0.03) + Math.sin(t * 18 + i) * (8 + i * 0.6);
      const waveAlpha = alpha * (0.045 + i * 0.006);
      drawCurveStreak(ctx, [
        [-width * 0.12, y],
        [width * (0.22 + sweep * 0.08), y - height * 0.04],
        [width * 0.72, y + height * 0.035],
        [width * 1.12, y - height * 0.02]
      ], 1.2 + i * 0.16, i % 2 ? "rgba(232,255,253,.42)" : `rgba(${profile.main}, .34)`, waveAlpha, 10);
    }
  } else if (material === "scope") {
    const cx = width * 0.5;
    const cy = height * 0.49;
    for (let ring = 0; ring < 5; ring += 1) {
      drawArcRibbon(ctx, cx, cy, Math.min(width, height) * (0.18 + ring * 0.09 + sweep * 0.025), 0, Math.PI * 2, 1.2 + ring * 0.2, ring % 2 ? `rgba(${profile.third}, .64)` : "rgba(255,250,225,.72)", alpha * (0.28 - ring * 0.034));
    }
    drawStreak(ctx, width * (-0.12 + sweep * 0.56), height * 0.24, cx, cy, 3 + impact * 8, "rgba(255,252,232,.86)", alpha * (0.26 + impact * 0.36), 24);
  } else if (material === "blade") {
    for (let i = 0; i < 9; i += 1) {
      const angle = -0.95 + i * 0.23 + Math.sin(t * 4.5) * 0.05;
      const cx = width * (0.46 + Math.cos(angle) * 0.09);
      const cy = height * (0.5 + Math.sin(angle) * 0.06);
      drawStreak(ctx, cx - Math.cos(angle) * width * 0.18, cy - Math.sin(angle) * height * 0.12, cx + Math.cos(angle) * width * 0.22, cy + Math.sin(angle) * height * 0.16, 2.2 + i * 0.42, i % 2 ? `rgba(${profile.secondary}, .72)` : "rgba(255,245,214,.78)", alpha * (0.09 + impact * 0.07), 18);
    }
  } else if (material === "void") {
    const cx = width * 0.5;
    const cy = height * 0.48;
    for (let ring = 0; ring < 6; ring += 1) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * (0.8 + ring * 0.12) + ring * 0.54);
      ctx.globalAlpha = alpha * (0.12 + impact * 0.04);
      ctx.strokeStyle = ring % 2 ? `rgba(${profile.secondary}, .7)` : `rgba(${profile.third}, .54)`;
      ctx.lineWidth = 1.4 + ring * 0.32;
      ctx.beginPath();
      ctx.moveTo(0, -height * (0.12 + ring * 0.025));
      ctx.lineTo(width * (0.08 + ring * 0.017), 0);
      ctx.lineTo(0, height * (0.12 + ring * 0.025));
      ctx.lineTo(-width * (0.08 + ring * 0.017), 0);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
  } else if (material === "gunfire") {
    [[0.28, -1], [0.72, 1]].forEach(([xRatio, side], index) => {
      const x = width * xRatio;
      const fire = ctx.createLinearGradient(x, height * 0.74, width * (xRatio + side * 0.42), height * 0.18);
      fire.addColorStop(0, `rgba(255, 252, 220, ${0.42 * alpha})`);
      fire.addColorStop(0.26, index ? `rgba(${profile.secondary}, ${0.34 * alpha})` : `rgba(${profile.main}, ${0.36 * alpha})`);
      fire.addColorStop(1, "rgba(255, 252, 220, 0)");
      ctx.fillStyle = fire;
      ctx.beginPath();
      ctx.moveTo(x, height * 0.78);
      ctx.lineTo(width * (xRatio + side * (0.5 + impact * 0.08)), height * (0.16 - impact * 0.03));
      ctx.lineTo(width * (0.5 + side * 0.04), height * 0.48);
      ctx.closePath();
      ctx.fill();
    });
  } else if (material === "arcane") {
    for (let i = 0; i < 10; i += 1) {
      const p = (sweep + i * 0.08) % 1;
      const x = width * (-0.14 + p * 1.28);
      const y = height * (0.92 - p * 1.05 + Math.sin(t * 8 + i) * 0.028);
      drawStreak(ctx, x - width * 0.18, y + height * 0.16, x + width * 0.08, y - height * 0.05, 2 + i * 0.3, i % 2 ? `rgba(${profile.secondary}, .62)` : `rgba(${profile.main}, .68)`, alpha * (0.08 + impact * 0.05), 16);
    }
  } else if (material === "stage") {
    const cx = width * 0.5;
    const top = height * 0.02;
    for (let i = 0; i < 4; i += 1) {
      const targetX = width * (0.28 + i * 0.15);
      const beam = ctx.createLinearGradient(cx, top, targetX, height * 0.74);
      beam.addColorStop(0, `rgba(255, 239, 196, ${0.2 * alpha})`);
      beam.addColorStop(0.58, `rgba(${profile.secondary}, ${0.09 * alpha})`);
      beam.addColorStop(1, "rgba(255,239,196,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.02, top);
      ctx.lineTo(targetX + width * 0.07, height * 0.78);
      ctx.lineTo(targetX - width * 0.07, height * 0.78);
      ctx.closePath();
      ctx.fill();
    }
  } else if (material === "ice") {
    for (let i = 0; i < 12; i += 1) {
      const x = width * (-0.12 + sweep * 1.18 - i * 0.035);
      const y = height * (0.58 - sweep * 0.18 + Math.sin(i * 0.7 + t * 6) * 0.03);
      drawStreak(ctx, x - width * 0.26, y + height * 0.04, x + width * 0.1, y - height * 0.02, 1.8 + i * 0.2, i % 2 ? "rgba(250,255,255,.72)" : `rgba(${profile.main}, .68)`, alpha * (0.1 + impact * 0.05), 16);
    }
  } else if (material === "quake") {
    const cx = width * (0.12 + sweep * 0.72);
    const cy = height * 0.72;
    for (let ring = 0; ring < 7; ring += 1) {
      drawArcRibbon(ctx, cx, cy, Math.min(width, height) * (0.06 + ring * 0.055 + impact * 0.08), Math.PI * 0.05, Math.PI * 1.2, 2.4 - ring * 0.18, ring % 2 ? `rgba(${profile.secondary}, .56)` : `rgba(${profile.third}, .48)`, alpha * (0.22 - ring * 0.018));
    }
  }

  ctx.restore();
}

function drawPremiumMaterialWorld(ctx, width, height, t, profile, stage) {
  const alpha = sceneEnvelope(t, 0.95);
  if (!alpha) return;

  const material = stage.material;
  const sweep = easeInOutSine(smoothstep(0.02, 0.9, t));
  const impact = Math.min(1, stageImpactPulse(t, stage, 0.082));
  const minSide = Math.min(width, height);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const base = ctx.createLinearGradient(0, 0, width, height);
  base.addColorStop(0, `rgba(${profile.dark}, ${0.34 * alpha})`);
  base.addColorStop(0.42, `rgba(${profile.main}, ${0.055 * alpha})`);
  base.addColorStop(1, `rgba(2, 5, 9, ${0.58 * alpha})`);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  if (material === "water") {
    const waterline = height * (0.57 - sweep * 0.04 + Math.sin(t * 8.2) * 0.008);
    const sharkX = width * (0.5 + Math.sin(t * 3.2) * 0.05);
    const sharkY = waterline + height * (0.09 - smoothstep(0.16, 0.58, t) * 0.14);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const deep = ctx.createLinearGradient(0, 0, 0, height);
    deep.addColorStop(0, `rgba(4, 12, 18, ${0.72 * alpha})`);
    deep.addColorStop(0.43, `rgba(9, 52, 65, ${0.76 * alpha})`);
    deep.addColorStop(0.68, `rgba(${profile.main}, ${0.22 * alpha})`);
    deep.addColorStop(1, `rgba(0, 9, 15, ${0.96 * alpha})`);
    ctx.fillStyle = deep;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 12; i += 1) {
      const y = height * (0.14 + i * 0.04) + Math.sin(t * (10 + i * 0.18) + i) * height * 0.012;
      const p = (t * (0.22 + i * 0.008) + seededUnit(i, 2.1)) % 1;
      drawCurveStreak(ctx, [
        [-width * 0.08, y + p * height * 0.04],
        [width * (0.24 + p * 0.08), y - height * (0.028 + impact * 0.015)],
        [width * 0.68, y + height * 0.025],
        [width * 1.08, y - height * 0.018]
      ], 1 + seededUnit(i, 8.6) * 2.8, i % 3 ? "rgba(221,255,251,.32)" : `rgba(${profile.main}, .3)`, alpha * (0.035 + impact * 0.028), 18);
    }
    for (let i = 0; i < 24; i += 1) {
      const rise = (t * (0.34 + seededUnit(i, 6.7) * 0.42) + seededUnit(i, 1.9)) % 1;
      const x = width * (0.08 + seededUnit(i, 2.6) * 0.84) + Math.sin(t * 6 + i) * width * 0.018;
      const y = height * (0.95 - rise * 0.48);
      const size = minSide * (0.0025 + seededUnit(i, 9.1) * 0.007);
      drawSoftParticle(ctx, x, y, size, i % 4 ? "rgba(229,255,251,.74)" : `rgba(${profile.main}, .68)`, alpha * (0.06 + rise * 0.15), 18);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "blur(8px) saturate(1.08)";
    ctx.globalAlpha = alpha * (0.56 + impact * 0.22);
    ctx.fillStyle = "rgba(0, 8, 14, .92)";
    ctx.beginPath();
    ctx.ellipse(sharkX, sharkY, width * 0.26, height * 0.064, -0.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sharkX - width * 0.2, sharkY - height * 0.018);
    ctx.lineTo(sharkX - width * 0.34, sharkY - height * 0.12);
    ctx.lineTo(sharkX - width * 0.27, sharkY + height * 0.012);
    ctx.closePath();
    ctx.fill();
    ctx.filter = "blur(1px)";
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = alpha * (0.2 + impact * 0.14);
    ctx.strokeStyle = "rgba(229,255,252,.86)";
    ctx.lineWidth = Math.max(1.2, width * 0.0014);
    ctx.beginPath();
    ctx.moveTo(sharkX - width * 0.12, sharkY - height * 0.03);
    ctx.quadraticCurveTo(sharkX + width * 0.08, sharkY - height * 0.075, sharkX + width * 0.22, sharkY - height * 0.005);
    ctx.stroke();
    drawSoftParticle(ctx, sharkX + width * 0.17, sharkY - height * 0.04, minSide * 0.006, "rgba(235,255,252,.92)", alpha * (0.26 + impact * 0.12), 8);
    ctx.filter = "blur(2px)";
    ctx.globalAlpha = alpha * (0.38 + impact * 0.3);
    const foam = ctx.createLinearGradient(0, waterline - height * 0.04, 0, waterline + height * 0.08);
    foam.addColorStop(0, "rgba(234,255,252,0)");
    foam.addColorStop(0.48, "rgba(234,255,252,.48)");
    foam.addColorStop(1, `rgba(${profile.main}, 0)`);
    ctx.fillStyle = foam;
    ctx.fillRect(0, waterline - height * 0.05, width, height * 0.16);
    ctx.restore();
  } else if (material === "scope") {
    const cx = width * (0.5 + stage.panX * 0.28);
    const cy = height * (0.49 + stage.panY * 0.24);
    const radius = minSide * (0.28 + sweep * 0.06);
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = `rgba(3, 4, 9, ${0.2 * alpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    drawRadialGlow(ctx, cx, cy, radius * 1.4, [
      [0, "rgba(255,250,226,.2)"],
      [0.36, `rgba(${profile.third}, .18)`],
      [0.7, `rgba(${profile.main}, .08)`],
      [1, `rgba(${profile.main}, 0)`]
    ], alpha);
    for (let i = 0; i < 9; i += 1) {
      const r = radius * (0.42 + i * 0.12);
      drawArcRibbon(ctx, cx, cy, r, -Math.PI * (0.86 - i * 0.012), Math.PI * (0.86 - i * 0.012), 0.8 + i * 0.18, i % 2 ? `rgba(${profile.third}, .48)` : "rgba(255,250,226,.52)", alpha * (0.22 - i * 0.018 + impact * 0.02));
    }
    for (let i = 0; i < 5; i += 1) {
      const x = width * (-0.16 + ((sweep + i * 0.19) % 1) * 1.32);
      drawStreak(ctx, x, height * 0.14, x + width * 0.16, height * 0.86, 1.2 + i * 0.22, "rgba(255,250,226,.54)", alpha * 0.08, 18);
    }
    ctx.restore();
  } else if (material === "blade") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 16; i += 1) {
      const p = (sweep + i * 0.07) % 1;
      const side = i % 2 ? 1 : -1;
      const x = width * (0.5 + side * (0.42 - p * 0.58));
      const y = height * (0.52 + Math.sin(i + t * 9) * 0.12);
      drawStreak(ctx, x - side * width * 0.22, y + height * 0.12, x + side * width * 0.28, y - height * 0.17, 1.4 + seededUnit(i, 9.1) * 4.4, i % 3 ? `rgba(${profile.secondary}, .64)` : "rgba(255,245,214,.74)", alpha * (0.08 + impact * 0.08), 22);
    }
    drawRadialGlow(ctx, width * 0.5, height * 0.52, minSide * 0.5, [
      [0, `rgba(${profile.secondary}, .2)`],
      [0.38, `rgba(${profile.main}, .1)`],
      [1, `rgba(${profile.main}, 0)`]
    ], alpha);
    ctx.restore();
  } else if (material === "void") {
    const cx = width * 0.5;
    const cy = height * 0.48;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let layer = 0; layer < 7; layer += 1) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * (0.8 + layer * 0.12) + layer * 0.74);
      ctx.globalAlpha = alpha * (0.12 + layer * 0.018);
      const gradient = ctx.createRadialGradient(0, 0, minSide * 0.04, 0, 0, minSide * (0.22 + layer * 0.052));
      gradient.addColorStop(0, `rgba(${profile.third}, .26)`);
      gradient.addColorStop(0.42, `rgba(${profile.secondary}, .16)`);
      gradient.addColorStop(1, `rgba(${profile.main}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(0, 0, minSide * (0.16 + layer * 0.045), minSide * (0.08 + layer * 0.028), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawShardField(ctx, width, height, t, `rgba(${profile.third}, .38)`, 24, 1);
    ctx.restore();
  } else if (material === "gunfire") {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "blur(20px)";
    for (let i = 0; i < 10; i += 1) {
      const side = i % 2 ? 1 : -1;
      const x = width * (0.5 + side * (0.16 + seededUnit(i, 4) * 0.16));
      const y = height * (0.72 - seededUnit(i, 5) * 0.34);
      ctx.globalAlpha = alpha * (0.08 + impact * 0.04);
      ctx.fillStyle = i % 3 ? `rgba(${profile.dark}, .74)` : `rgba(${profile.secondary}, .34)`;
      ctx.beginPath();
      ctx.ellipse(x, y, minSide * (0.1 + seededUnit(i, 6) * 0.12), minSide * (0.04 + seededUnit(i, 7) * 0.06), side * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    [[0.28, -1], [0.72, 1]].forEach(([xRatio, side], index) => {
      const x = width * xRatio;
      const flash = beatPulse(t, index ? 0.34 : 0.12, 0.08);
      drawStreak(ctx, x, height * 0.73, width * (xRatio + side * 0.52), height * 0.2, Math.max(6, width * 0.008 + flash * 12), index ? `rgba(${profile.secondary}, .7)` : `rgba(${profile.main}, .78)`, alpha * (0.18 + flash * 0.6), 34);
    });
    ctx.restore();
  } else if (material === "arcane") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 14; i += 1) {
      const p = (sweep + i * 0.061) % 1;
      const x = width * (-0.1 + p * 1.2);
      const y = height * (0.92 - p * 0.95 + Math.sin(t * 8 + i) * 0.03);
      drawCurveStreak(ctx, [
        [x - width * 0.2, y + height * 0.14],
        [x - width * 0.04, y - height * 0.05],
        [x + width * 0.16, y + height * 0.02]
      ], 2 + seededUnit(i, 1.2) * 3.4, i % 2 ? `rgba(${profile.secondary}, .64)` : `rgba(${profile.main}, .72)`, alpha * (0.08 + impact * 0.06), 20);
    }
    ctx.restore();
  } else if (material === "stage") {
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const curtain = ctx.createLinearGradient(0, 0, width, 0);
    curtain.addColorStop(0, `rgba(${profile.dark}, ${0.42 * alpha})`);
    curtain.addColorStop(0.5, "rgba(0,0,0,0)");
    curtain.addColorStop(1, `rgba(${profile.dark}, ${0.42 * alpha})`);
    ctx.fillStyle = curtain;
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 5; i += 1) {
      const x = width * (0.26 + i * 0.12 + Math.sin(t * 1.4 + i) * 0.02);
      const beam = ctx.createLinearGradient(x, 0, width * 0.5, height * 0.76);
      beam.addColorStop(0, `rgba(255, 239, 196, ${0.22 * alpha})`);
      beam.addColorStop(0.62, `rgba(${profile.secondary}, ${0.08 * alpha})`);
      beam.addColorStop(1, "rgba(255,239,196,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(x - width * 0.03, 0);
      ctx.lineTo(width * (0.42 + i * 0.04), height * 0.82);
      ctx.lineTo(width * (0.3 + i * 0.09), height * 0.82);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (material === "ice") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 26; i += 1) {
      const p = (sweep + i * 0.035) % 1;
      const x = width * (-0.12 + p * 1.24);
      const y = height * (0.16 + seededUnit(i, 3.2) * 0.7 - p * 0.18);
      const size = minSide * (0.018 + seededUnit(i, 4.5) * 0.055);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.7 + seededUnit(i, 5.8) * 1.4);
      ctx.globalAlpha = alpha * (0.08 + seededUnit(i, 6.1) * 0.18);
      ctx.fillStyle = i % 2 ? "rgba(248,254,255,.62)" : `rgba(${profile.main}, .5)`;
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(size * 0.18, 0);
      ctx.lineTo(0, size);
      ctx.lineTo(-size * 0.18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  } else if (material === "quake") {
    const cx = width * (0.08 + sweep * 0.78);
    const cy = height * 0.74;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let ring = 0; ring < 9; ring += 1) {
      drawArcRibbon(ctx, cx, cy, minSide * (0.05 + ring * 0.058 + impact * 0.08), Math.PI * 0.06, Math.PI * 1.22, 2.6 - ring * 0.16, ring % 2 ? `rgba(${profile.secondary}, .48)` : `rgba(${profile.third}, .44)`, alpha * (0.2 - ring * 0.014));
    }
    drawCracks(ctx, cx, cy + minSide * 0.06, minSide * (0.32 + impact * 0.12), 18, sweep, `rgba(${profile.secondary}, .34)`);
    ctx.restore();
  }

  drawMaterialVeil(ctx, width, height, t, profile, stage, alpha * 1.35);
}

function drawSoftParticle(ctx, x, y, radius, color, alpha, blur = 12) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFizzActionCue(ctx, width, height, t, profile, stage, alpha) {
  const swell = easeOutCubic(smoothstep(0.04, 0.6, t));
  const breach = beatPulse(t, 0.34, 0.14);
  const bite = beatPulse(t, 0.54, 0.12);
  const waterline = height * (0.58 - swell * 0.05 + Math.sin(t * 7) * 0.006);
  const cx = width * (0.5 + stage.panX * 0.6 + Math.sin(t * 4.4) * 0.025);
  const cy = height * (0.68 - swell * 0.16);

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const depth = ctx.createLinearGradient(0, waterline - height * 0.18, 0, height);
  depth.addColorStop(0, `rgba(${profile.main}, 0)`);
  depth.addColorStop(0.42, `rgba(${profile.main}, ${0.08 * alpha})`);
  depth.addColorStop(0.62, `rgba(${profile.dark}, ${0.32 * alpha})`);
  depth.addColorStop(1, `rgba(3, 13, 20, ${0.6 * alpha})`);
  ctx.fillStyle = depth;
  ctx.fillRect(0, waterline - height * 0.18, width, height);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const surface = ctx.createLinearGradient(0, waterline - height * 0.08, 0, waterline + height * 0.22);
  surface.addColorStop(0, `rgba(${profile.main}, 0)`);
  surface.addColorStop(0.18, "rgba(156,236,238,.48)");
  surface.addColorStop(0.46, `rgba(${profile.main}, .44)`);
  surface.addColorStop(0.76, "rgba(8,35,42,.4)");
  surface.addColorStop(1, `rgba(${profile.main}, 0)`);
  ctx.save();
  ctx.filter = "blur(5px)";
  ctx.fillStyle = surface;
  ctx.globalAlpha = alpha * (1.1 + breach * 0.9);
  ctx.fillRect(0, waterline - height * 0.08, width, height * 0.32);
  ctx.restore();

  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 22; i += 1) {
    const p = (t * (0.55 + i * 0.012) + seededUnit(i, 14.4)) % 1;
    const y = waterline + height * (0.04 + seededUnit(i, 2.2) * 0.28) - p * height * 0.16;
    const x = width * (0.08 + seededUnit(i, 7.9) * 0.84) + Math.sin(t * 5 + i) * width * 0.018;
    const r = Math.max(2, Math.min(width, height) * (0.002 + seededUnit(i, 5.1) * 0.004));
    drawSoftParticle(ctx, x, y, r * (1.2 + breach), i % 2 ? "rgba(226,255,250,.84)" : `rgba(${profile.main}, .72)`, alpha * (0.12 + breach * 0.24 + bite * 0.12), 16);
  }

  for (let i = 0; i < 8; i += 1) {
    const yy = waterline + Math.sin(t * 9 + i) * height * 0.018 + i * height * 0.018;
    drawCurveStreak(ctx, [
      [-width * 0.12, yy],
      [width * (0.18 + swell * 0.14), yy - height * (0.035 + breach * 0.025)],
      [width * 0.7, yy + height * 0.03],
      [width * 1.14, yy - height * 0.018]
    ], 2 + i * 0.24 + breach * 3.4, i % 2 ? "rgba(222,255,252,.72)" : `rgba(${profile.main}, .58)`, alpha * (0.085 + breach * 0.16 + bite * 0.06), 18);
  }

  drawCurveStreak(ctx, [
    [width * 0.1, waterline + height * 0.1],
    [cx - width * 0.23, waterline - height * (0.1 + breach * 0.04)],
    [cx + width * 0.18, waterline - height * (0.12 + breach * 0.08)],
    [width * 0.94, waterline + height * 0.06]
  ], Math.max(5, width * 0.005 + breach * 7), "rgba(226,255,252,.52)", alpha * (0.08 + breach * 0.2), 24);

  ctx.globalCompositeOperation = "multiply";
  ctx.globalAlpha = alpha * (0.3 + breach * 0.2);
  ctx.filter = "blur(22px)";
  ctx.fillStyle = "rgba(0,12,18,.82)";
  ctx.beginPath();
  ctx.ellipse(cx, cy + height * 0.05, width * (0.24 + breach * 0.06), height * (0.075 + breach * 0.02), -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha * (0.08 + breach * 0.08 + bite * 0.05);
  ctx.filter = `blur(${5.2 - Math.min(1, breach + bite) * 1.4}px) saturate(1.08) contrast(1.04)`;
  ctx.translate(cx - width * 0.02, waterline + height * (0.02 - breach * 0.08));
  ctx.rotate(-0.18 - breach * 0.08);
  const sharkBody = ctx.createLinearGradient(-width * 0.28, -height * 0.08, width * 0.33, height * 0.1);
  sharkBody.addColorStop(0, "rgba(0, 7, 12, .72)");
  sharkBody.addColorStop(0.48, "rgba(6, 42, 50, .58)");
  sharkBody.addColorStop(1, "rgba(0, 8, 14, .66)");
  ctx.fillStyle = sharkBody;
  ctx.beginPath();
  ctx.moveTo(width * 0.42, -height * 0.01);
  ctx.bezierCurveTo(width * 0.22, -height * 0.15, -width * 0.2, -height * 0.14, -width * 0.39, -height * 0.05);
  ctx.bezierCurveTo(-width * 0.54, height * 0.035, -width * 0.4, height * 0.14, -width * 0.1, height * 0.12);
  ctx.bezierCurveTo(width * 0.2, height * 0.11, width * 0.36, height * 0.055, width * 0.42, -height * 0.01);
  ctx.fill();
  ctx.fillStyle = "rgba(2,12,18,.9)";
  ctx.beginPath();
  ctx.moveTo(-width * 0.24, -height * 0.09);
  ctx.lineTo(-width * 0.42, -height * 0.24);
  ctx.lineTo(-width * 0.32, -height * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * (0.08 + bite * 0.12);
  ctx.strokeStyle = "rgba(232,255,250,.82)";
  ctx.lineWidth = Math.max(1.5, width * 0.002);
  ctx.beginPath();
  ctx.moveTo(width * 0.12, height * 0.05);
  ctx.quadraticCurveTo(width * 0.23, height * 0.1, width * 0.32, -height * 0.005);
  ctx.stroke();
  for (let i = 0; i < 10; i += 1) {
    const tx = width * (0.12 + i * 0.02);
    const ty = height * (0.04 + Math.sin(i) * 0.008);
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + width * 0.007, ty + height * 0.026);
    ctx.lineTo(tx - width * 0.006, ty + height * 0.024);
    ctx.closePath();
    ctx.fillStyle = "rgba(232,255,250,.34)";
    ctx.fill();
  }
  ctx.restore();

  if (breach || bite) {
    drawRadialGlow(ctx, cx, cy, Math.min(width, height) * (0.22 + breach * 0.22), [
      [0, `rgba(226,255,252,${0.7 * (breach + bite)})`],
      [0.3, `rgba(${profile.main},${0.24 * (breach + bite)})`],
      [1, `rgba(${profile.main},0)`]
    ], alpha * 1.25);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const surge = smoothstep(0.08, 0.5, t) * (1 - smoothstep(0.82, 0.98, t));
  const spearX = width * (0.22 + surge * 0.18);
  const spearY = waterline - height * (0.16 + breach * 0.05);
  ctx.translate(spearX, spearY);
  ctx.rotate(-0.34 + Math.sin(t * 5) * 0.035);
  drawStreak(ctx, -width * 0.18, 0, width * 0.16, -height * 0.1, Math.max(3, width * 0.0038), "rgba(232,255,250,.66)", alpha * surge * 0.22, 18);
  [-1, 0, 1].forEach((tooth) => {
    const offset = tooth * width * 0.028;
    drawStreak(ctx, width * 0.16, -height * 0.1, width * (0.22 + Math.abs(tooth) * 0.02), -height * (0.16 + Math.abs(tooth) * 0.02) + offset * 0.08, Math.max(1.6, width * 0.002), `rgba(${profile.secondary}, .54)`, alpha * surge * 0.2, 14);
  });
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha * (0.24 + breach * 0.34);
  ctx.fillStyle = "rgba(235,255,252,.86)";
  for (let i = 0; i < 18; i += 1) {
    const a = -Math.PI * 0.92 + i * 0.11;
    const distance = Math.min(width, height) * (0.08 + seededUnit(i, 5.4) * 0.26) * (0.5 + breach + bite * 0.4);
    const sx = cx + Math.cos(a) * distance;
    const sy = waterline + Math.sin(a) * distance * 0.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy, 2 + seededUnit(i, 8.2) * 5, 1.5 + seededUnit(i, 9.1) * 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCaitlynActionCue(ctx, width, height, t, profile, stage, alpha) {
  const lock = smoothstep(0.04, 0.46, t);
  const shot = smoothstep(0.36, 0.52, t) * (1 - smoothstep(0.68, 0.92, t));
  const recoil = beatPulse(t, 0.42, 0.09);
  const cx = width * (0.5 + stage.panX * 0.5);
  const cy = height * (0.48 + stage.panY * 0.4);
  const r = Math.min(width, height) * (0.16 + lock * 0.08);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  for (let i = 0; i < 6; i += 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((i % 2 ? 1 : -1) * (0.015 + recoil * 0.018));
    ctx.globalAlpha = alpha * lock * (0.36 - i * 0.035);
    ctx.strokeStyle = i % 2 ? `rgba(${profile.third}, .72)` : "rgba(255,250,226,.88)";
    ctx.lineWidth = Math.max(1.2, width * 0.0015 + i * 0.28);
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 14 + i * 3;
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.8 + i * 0.24), -Math.PI * (0.9 - i * 0.025), Math.PI * (0.9 - i * 0.025));
    ctx.stroke();
    ctx.restore();
  }
  for (let tick = 0; tick < 32; tick += 1) {
    const angle = (tick / 32) * Math.PI * 2;
    const long = tick % 8 === 0;
    const inner = r * (1.18 + (long ? 0.02 : 0.08));
    const outer = r * (1.34 + (long ? 0.18 : 0.1));
    ctx.globalAlpha = alpha * lock * (long ? 0.42 : 0.18);
    ctx.strokeStyle = long ? "rgba(255,250,226,.92)" : `rgba(${profile.main}, .55)`;
    ctx.lineWidth = long ? Math.max(1.5, width * 0.0018) : 1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  const muzzleX = width * (-0.2 + shot * 0.62);
  const muzzleY = height * (0.18 + recoil * 0.02);
  drawStreak(ctx, muzzleX, muzzleY, cx, cy, Math.max(5, width * 0.006), "rgba(255,252,232,.98)", alpha * (0.28 + shot * 0.86), 26);
  drawStreak(ctx, muzzleX - width * 0.16, muzzleY + height * 0.02, cx + width * 0.02, cy, Math.max(14, width * 0.013), `rgba(${profile.main}, .36)`, alpha * shot * 0.74, 44);
  drawStreak(ctx, cx - r * 1.8, cy, cx + r * 1.8, cy, Math.max(1.5, width * 0.0014), "rgba(255,252,232,.7)", alpha * lock * 0.48, 16);
  drawStreak(ctx, cx, cy - r * 1.8, cx, cy + r * 1.8, Math.max(1.5, width * 0.0014), `rgba(${profile.third}, .52)`, alpha * lock * 0.42, 16);
  drawRadialGlow(ctx, cx, cy, r * (0.8 + shot), [
    [0, "rgba(255,252,232,.86)"],
    [0.22, `rgba(${profile.third},.38)`],
    [1, `rgba(${profile.third},0)`]
  ], alpha * (0.32 + shot));
  ctx.restore();
}

function drawSamiraActionCue(ctx, width, height, t, profile, stage, alpha) {
  const spin = easeInOutSine(smoothstep(0.02, 0.88, t));
  const cx = width * (0.48 + stage.panX * 0.42);
  const cy = height * (0.52 + stage.panY * 0.28);
  const radius = Math.min(width, height) * (0.19 + spin * 0.11);
  const ultBeat = smoothstep(0.42, 0.68, t) * (1 - smoothstep(0.86, 0.98, t));

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 3; ring += 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(spin * Math.PI * (2.1 + ring * 0.18) + ring * 1.1);
    ctx.globalAlpha = alpha * (0.18 + ultBeat * 0.16 - ring * 0.035);
    ctx.strokeStyle = ring % 2 ? `rgba(${profile.secondary}, .92)` : `rgba(${profile.main}, .9)`;
    ctx.lineWidth = Math.max(2.2, width * (0.0025 + ring * 0.0008));
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 24 + ring * 8;
    ctx.beginPath();
    ctx.ellipse(0, 0, radius * (1.1 + ring * 0.25), radius * (0.34 + ring * 0.04), 0, -Math.PI * 0.08, Math.PI * (1.16 + ultBeat * 0.34));
    ctx.stroke();
    ctx.restore();
  }

  stage.impacts.forEach((beat, index) => {
    const hit = beatPulse(t, beat, 0.085);
    if (!hit) return;
    const angle = -0.9 + index * 0.42;
    const sx = cx + Math.cos(angle + Math.PI) * radius * 0.54;
    const sy = cy + Math.sin(angle + Math.PI) * radius * 0.32;
    const ex = cx + Math.cos(angle) * width * (0.34 + hit * 0.08);
    const ey = cy + Math.sin(angle) * height * (0.24 + hit * 0.05);
    drawCurveStreak(ctx, [
      [sx, sy],
      [cx + Math.cos(angle) * radius * 0.18, cy - height * (0.08 + hit * 0.03)],
      [ex, ey]
    ], Math.max(5, width * 0.005) + hit * 16, index % 2 ? `rgba(${profile.secondary}, .9)` : "rgba(255,246,220,.92)", alpha * hit * 1.02, 36);
    drawStreak(ctx, sx, sy, sx - Math.cos(angle) * width * 0.22, sy - Math.sin(angle) * height * 0.18, Math.max(3, width * 0.0035), "rgba(255,246,220,.86)", alpha * hit * 0.55, 24);
    drawRadialGlow(ctx, sx, sy, Math.min(width, height) * (0.09 + hit * 0.08), [
      [0, "rgba(255,246,220,.86)"],
      [0.3, `rgba(${profile.main},.42)`],
      [1, `rgba(${profile.secondary},0)`]
    ], alpha * hit * 0.86);
  });

  [[-1, 0.16], [1, 0.34], [-1, 0.58]].forEach(([side, beat], index) => {
    const flash = beatPulse(t, beat, 0.075);
    const mx = cx + side * radius * (0.85 + index * 0.08);
    const my = cy - radius * (0.12 - index * 0.04);
    const tx = mx + side * width * 0.28;
    const ty = my - height * (0.08 + index * 0.025);
    drawStreak(ctx, mx, my, tx, ty, Math.max(4, width * 0.004), index % 2 ? `rgba(${profile.third}, .72)` : "rgba(255,244,210,.88)", alpha * (0.18 + flash * 0.74), 28);
    if (flash) {
      drawRadialGlow(ctx, mx, my, Math.min(width, height) * (0.1 + flash * 0.1), [
        [0, "rgba(255,244,210,.98)"],
        [0.22, `rgba(${profile.secondary},.54)`],
        [1, `rgba(${profile.main},0)`]
      ], alpha * flash);
    }
  });

  if (ultBeat) {
    for (let i = 0; i < 18; i += 1) {
      const a = spin * Math.PI * 5 + i * 0.38;
      const inner = radius * (0.38 + seededUnit(i, 3.8) * 0.18);
      const outer = radius * (1.24 + seededUnit(i, 7.2) * 0.48);
      drawStreak(
        ctx,
        cx + Math.cos(a) * inner,
        cy + Math.sin(a) * inner * 0.52,
        cx + Math.cos(a) * outer,
        cy + Math.sin(a) * outer * 0.52,
        1.5 + seededUnit(i, 5.3) * 3.8,
        i % 3 ? `rgba(${profile.main}, .62)` : `rgba(${profile.third}, .56)`,
        alpha * ultBeat * (0.12 + seededUnit(i, 8.6) * 0.22),
        18
      );
    }
  }
  ctx.restore();
}

function drawEzrealActionCue(ctx, width, height, t, profile, stage, alpha) {
  const travel = smoothstep(0.04, 0.82, t);
  const start = { x: width * -0.08, y: height * 0.84 };
  const end = { x: width * 1.04, y: height * 0.12 };
  const x = start.x + (end.x - start.x) * travel;
  const y = start.y + (end.y - start.y) * travel;
  drawStreak(ctx, start.x, start.y, x, y, Math.max(9, width * 0.012), `rgba(${profile.main}, .42)`, alpha * 0.72, 42);
  drawStreak(ctx, start.x + width * 0.08, start.y - height * 0.04, x, y, Math.max(4, width * 0.005), `rgba(${profile.secondary}, .68)`, alpha * 0.62, 26);
  drawStreak(ctx, x - width * 0.16, y + height * 0.1, x + width * 0.06, y - height * 0.03, Math.max(5, width * 0.007), "rgba(255,252,232,.96)", alpha * 0.88, 30);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 8; i += 1) {
    const p = Math.max(0, travel - i * 0.035);
    const rx = start.x + (end.x - start.x) * p + Math.sin(t * 9 + i) * width * 0.015;
    const ry = start.y + (end.y - start.y) * p + Math.cos(t * 7 + i) * height * 0.012;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(-0.72 + t * 3 + i * 0.42);
    ctx.globalAlpha = alpha * (0.14 + (8 - i) * 0.025);
    ctx.strokeStyle = i % 2 ? `rgba(${profile.secondary}, .82)` : `rgba(${profile.main}, .8)`;
    ctx.lineWidth = Math.max(1.5, width * 0.0016);
    ctx.shadowColor = ctx.strokeStyle;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.018);
    ctx.lineTo(width * 0.026, 0);
    ctx.lineTo(0, height * 0.018);
    ctx.lineTo(-width * 0.026, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
  drawRadialGlow(ctx, x, y, Math.min(width, height) * 0.18, [
    [0, "rgba(255,252,232,.92)"],
    [0.26, `rgba(${profile.main},.48)`],
    [1, `rgba(${profile.secondary},0)`]
  ], alpha);
}

function drawChampionActionCues(ctx, width, height, t, profile, stage, alpha) {
  if (profile.id === "fizz") drawFizzActionCue(ctx, width, height, t, profile, stage, alpha);
  else if (profile.id === "caitlyn") drawCaitlynActionCue(ctx, width, height, t, profile, stage, alpha);
  else if (profile.id === "samira") drawSamiraActionCue(ctx, width, height, t, profile, stage, alpha);
  else if (profile.id === "ezreal") drawEzrealActionCue(ctx, width, height, t, profile, stage, alpha);
  else if (profile.id === "ashe") {
    const travel = smoothstep(0.04, 0.76, t);
    const x = width * (-0.08 + travel * 1.16);
    const y = height * (0.34 - travel * 0.18);
    drawStreak(ctx, width * -0.14, height * 0.42, x, y, Math.max(11, width * 0.013), `rgba(${profile.main}, .42)`, alpha * 0.72, 40);
    drawStreak(ctx, width * -0.08, height * 0.38, x + width * 0.04, y - height * 0.01, Math.max(5, width * 0.006), "rgba(236,252,255,.95)", alpha * 0.92, 30);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.translate(x, y);
    ctx.rotate(-0.08);
    ctx.globalAlpha = alpha * 0.9;
    ctx.shadowColor = "rgba(236,252,255,.8)";
    ctx.shadowBlur = 24;
    ctx.fillStyle = "rgba(236,252,255,.92)";
    ctx.beginPath();
    ctx.moveTo(width * 0.12, 0);
    ctx.lineTo(-width * 0.06, -height * 0.05);
    ctx.lineTo(-width * 0.025, 0);
    ctx.lineTo(-width * 0.06, height * 0.05);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    for (let i = 0; i < 12; i += 1) {
      drawStreak(ctx, x - width * 0.02, y, x - width * (0.1 + i * 0.026), y + height * ((i % 2 ? 1 : -1) * (0.025 + i * 0.008)), 1.5 + i * 0.22, i % 2 ? "rgba(255,255,255,.7)" : `rgba(${profile.main}, .5)`, alpha * (0.18 + i * 0.006), 14);
    }
  } else if (profile.id === "missfortune") {
    [[0.32, -1], [0.68, 1]].forEach(([ratio, side], index) => {
      const hit = beatPulse(t, index ? 0.42 : 0.2, 0.09);
      const x = width * ratio;
      const y = height * 0.66;
      drawStreak(ctx, x, y, width * (ratio + side * 0.54), height * 0.2, Math.max(12, width * 0.014), index ? `rgba(${profile.secondary}, .44)` : `rgba(${profile.main}, .48)`, alpha * (0.26 + hit * 0.58), 42);
      drawStreak(ctx, x, y, width * (ratio + side * 0.48), height * 0.24, Math.max(4, width * 0.0048), "rgba(255,246,210,.9)", alpha * (0.34 + hit * 0.74), 24);
      for (let i = 0; i < 7; i += 1) {
        const spread = (i - 3) * 0.025;
        drawStreak(ctx, x, y, width * (ratio + side * (0.32 + i * 0.035)), height * (0.26 + spread), 1.4 + hit * 3, i % 2 ? `rgba(${profile.secondary}, .52)` : `rgba(${profile.main}, .56)`, alpha * (0.1 + hit * 0.16), 14);
      }
      drawRadialGlow(ctx, x, y, Math.min(width, height) * (0.16 + hit * 0.14), [
        [0, "rgba(255,236,180,.82)"],
        [0.36, `rgba(${profile.main},.34)`],
        [1, `rgba(${profile.main},0)`]
      ], alpha * (0.32 + hit));
    });
  } else if (profile.id === "kaisa") {
    const pulse = stageImpactPulse(t, stage, 0.1);
    const cx = width * 0.5;
    const cy = height * 0.5;
    drawRadialGlow(ctx, cx, cy, Math.min(width, height) * (0.24 + pulse * 0.12), [
      [0, `rgba(${profile.third},.38)`],
      [0.34, `rgba(${profile.main},.22)`],
      [1, `rgba(${profile.secondary},0)`]
    ], alpha * (0.5 + pulse * 0.28));
    for (let i = 0; i < 8; i += 1) {
      const angle = -1.1 + i * 0.32 + t * 0.95;
      drawCurveStreak(ctx, [
        [cx, cy],
        [cx + Math.cos(angle) * width * 0.16, cy + Math.sin(angle) * height * 0.12],
        [cx + Math.cos(angle) * width * 0.42, cy + Math.sin(angle) * height * 0.34]
      ], 3.2 + pulse * 7, i % 2 ? `rgba(${profile.third}, .72)` : `rgba(${profile.secondary}, .66)`, alpha * (0.18 + pulse * 0.13), 30);
    }
  } else if (profile.id === "jhin") {
    const cue = beatPulse(t, 0.46, 0.18);
    const cx = width * 0.5;
    const top = height * 0.04;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 4; i += 1) {
      const targetX = width * (0.28 + i * 0.15);
      const beam = ctx.createLinearGradient(cx, top, targetX, height * 0.74);
      beam.addColorStop(0, `rgba(255,239,196,${0.18 * alpha})`);
      beam.addColorStop(0.62, `rgba(${profile.secondary},${0.09 * alpha})`);
      beam.addColorStop(1, "rgba(255,239,196,0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(cx - width * 0.018, top);
      ctx.lineTo(targetX + width * (0.07 + cue * 0.04), height * 0.8);
      ctx.lineTo(targetX - width * (0.07 + cue * 0.04), height * 0.8);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.translate(cx, height * 0.5);
      ctx.rotate(i * Math.PI * 0.5 + t * 0.9);
      ctx.globalAlpha = alpha * (0.18 + cue * 0.24);
      ctx.fillStyle = i === 3 ? "rgba(255,239,196,.74)" : `rgba(${profile.secondary}, .56)`;
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.ellipse(0, -Math.min(width, height) * 0.18, Math.min(width, height) * (0.045 + cue * 0.012), Math.min(width, height) * (0.18 + cue * 0.05), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    drawStreak(ctx, width * 0.08, height * 0.52, width * 0.92, height * 0.52, Math.max(5, width * 0.005), "rgba(255,239,196,.9)", alpha * cue, 28);
    ctx.restore();
  } else if (profile.id === "rammus") {
    const p = smoothstep(0.05, 0.82, t);
    const cx = width * (-0.12 + p * 1.18);
    const cy = height * 0.72;
    const hit = stageImpactPulse(t, stage, 0.08);
    for (let i = 0; i < 6; i += 1) {
      drawArcRibbon(ctx, cx, cy, Math.min(width, height) * (0.08 + i * 0.06 + hit * 0.06), Math.PI * 0.04, Math.PI * 1.14, 3.4 - i * 0.2, i % 2 ? `rgba(${profile.secondary}, .58)` : `rgba(${profile.third}, .5)`, alpha * (0.22 - i * 0.016));
    }
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = alpha * 0.78;
    const shell = ctx.createRadialGradient(cx - width * 0.025, cy - height * 0.04, 0, cx, cy, Math.min(width, height) * 0.16);
    shell.addColorStop(0, "rgba(255,244,150,.95)");
    shell.addColorStop(0.45, `rgba(${profile.main},.86)`);
    shell.addColorStop(1, `rgba(${profile.dark},.95)`);
    ctx.fillStyle = shell;
    ctx.shadowColor = `rgba(${profile.secondary},.42)`;
    ctx.shadowBlur = 26;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(width, height) * (0.08 + hit * 0.02), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawCinematicFilmFinish(ctx, width, height, t, profile, stage) {
  const alpha = sceneEnvelope(t, 0.94);
  const impact = Math.min(1, stageImpactPulse(t, stage, 0.075));
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const matte = ctx.createLinearGradient(0, 0, 0, height);
  matte.addColorStop(0, `rgba(8, 6, 8, ${0.5 * alpha})`);
  matte.addColorStop(0.22, "rgba(8,6,8,0)");
  matte.addColorStop(0.78, "rgba(8,6,8,0)");
  matte.addColorStop(1, `rgba(8, 6, 8, ${0.62 * alpha})`);
  ctx.fillStyle = matte;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha * (0.035 + impact * 0.045);
  for (let index = 0; index < 4; index += 1) {
    const y = height * (0.24 + index * 0.16 + Math.sin(t * 2.4 + index) * 0.024);
    const line = ctx.createLinearGradient(width * 0.16, y, width * 0.84, y);
    line.addColorStop(0, `rgba(${profile.main}, 0)`);
    line.addColorStop(0.46, `rgba(255, 252, 232, ${0.42})`);
    line.addColorStop(0.54, `rgba(${profile.secondary}, ${0.24})`);
    line.addColorStop(1, `rgba(${profile.secondary}, 0)`);
    ctx.fillStyle = line;
    ctx.fillRect(width * 0.08, y, width * 0.84, 1.2 + seededUnit(index, 7.3));
  }
  if (impact > 0) {
    ctx.globalAlpha = impact * 0.08;
    ctx.fillStyle = "rgba(255,252,232,.72)";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawSourceArtCinematicStage(ctx, image, width, height, t, profile) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) {
    drawCinematicBackdrop(ctx, width, height, t, profile);
    return;
  }
  const stage = cinematicStageFor(profile.id);
  const alpha = sceneEnvelope(t, 0.94);
  const camera = easeInOutSine(smoothstep(0.02, 0.92, t));
  const impact = Math.min(1, stageImpactPulse(t, stage, 0.07));
  const shakeX = Math.sin(t * 170 + profile.id.length) * width * 0.006 * impact;
  const shakeY = Math.cos(t * 137 + profile.id.length) * height * 0.004 * impact;
  const zoom = stage.zoomStart + (stage.zoomEnd - stage.zoomStart) * camera + impact * 0.036;
  const panX = width * (stage.panX * camera) + shakeX;
  const panY = height * (stage.panY * camera) + shakeY;

  ctx.save();
  ctx.fillStyle = `rgba(${profile.dark}, ${0.82 * alpha})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  drawFocusedImage(ctx, image, width, height, {
    alpha: alpha * 0.5,
    filter: "blur(30px) saturate(1.65) contrast(1.16) brightness(.35)",
    focusX: stage.focusX,
    focusY: stage.focusY,
    scale: zoom + 0.18,
    xOffset: panX * 0.42,
    yOffset: panY * 0.32,
    rotation: stage.roll * 0.35
  });
  drawFocusedImage(ctx, image, width, height, {
    alpha: alpha * 0.76,
    filter: "blur(.2px) saturate(1.38) contrast(1.18) brightness(.74)",
    focusX: stage.focusX,
    focusY: stage.focusY,
    scale: zoom,
    xOffset: panX,
    yOffset: panY,
    rotation: stage.roll * camera
  });
  drawFocusedImage(ctx, image, width, height, {
    alpha: alpha * 0.16,
    composite: "screen",
    filter: "blur(1.6px) saturate(2.1) contrast(1.25) brightness(1.08)",
    focusX: stage.focusX,
    focusY: stage.focusY,
    scale: zoom + 0.035,
    xOffset: panX + width * 0.01,
    yOffset: panY - height * 0.006,
    rotation: stage.roll * camera
  });

  drawArtworkDepthPanels(ctx, image, width, height, t, profile, stage, alpha);
  drawImpactArtEcho(ctx, image, width, height, t, profile, stage, alpha);
  drawMaterialVeil(ctx, width, height, t, profile, stage, alpha);
  drawCinematicFilmFinish(ctx, width, height, t, profile, stage);
}

function drawCinematicLensPass(ctx, width, height, t, profile) {
  const alpha = sceneEnvelope(t, 0.9);
  const sweep = smoothstep(0.06, 0.74, t);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const flareX = width * (-0.18 + sweep * 1.32);
  const flareY = height * (0.28 + Math.sin(t * 2.4) * 0.08);
  const flare = ctx.createLinearGradient(flareX - width * 0.28, flareY, flareX + width * 0.28, flareY);
  flare.addColorStop(0, `rgba(${profile.main}, 0)`);
  flare.addColorStop(0.46, `rgba(${profile.main}, ${0.14 * alpha})`);
  flare.addColorStop(0.5, `rgba(255, 252, 232, ${0.4 * alpha})`);
  flare.addColorStop(0.55, `rgba(${profile.secondary}, ${0.12 * alpha})`);
  flare.addColorStop(1, `rgba(${profile.third}, 0)`);
  ctx.fillStyle = flare;
  ctx.filter = "blur(.4px)";
  ctx.translate(0, flareY);
  ctx.rotate(-0.08);
  ctx.fillRect(flareX - width * 0.38, -height * 0.015, width * 0.76, height * 0.03);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  const glaze = ctx.createLinearGradient(0, 0, width, height);
  glaze.addColorStop(0, `rgba(255, 252, 232, ${0.03 * alpha})`);
  glaze.addColorStop(0.48, "rgba(255,255,255,0)");
  glaze.addColorStop(1, `rgba(${profile.dark}, ${0.18 * alpha})`);
  ctx.fillStyle = glaze;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function fillRadial(ctx, x, y, inner, outer, stops) {
  const gradient = ctx.createRadialGradient(x, y, inner, x, y, outer);
  stops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

function drawVignette(ctx, width, height, strength = 0.58) {
  ctx.save();
  fillRadial(ctx, width * 0.5, height * 0.48, Math.min(width, height) * 0.12, Math.max(width, height) * 0.72, [
    [0, "rgba(255,255,255,0)"],
    [0.48, "rgba(38,28,28,0)"],
    [1, `rgba(18,12,14,${strength})`]
  ]);
  ctx.restore();
}

function drawLetterbox(ctx, width, height, opacity) {
  ctx.save();
  ctx.fillStyle = `rgba(18, 12, 14, ${opacity})`;
  ctx.fillRect(0, 0, width, height * 0.075);
  ctx.fillRect(0, height * 0.925, width, height * 0.075);
  ctx.restore();
}

function drawCracks(ctx, x, y, radius, count, progress, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, radius * 0.008);
  ctx.lineCap = "round";
  for (let index = 0; index < count; index += 1) {
    const angle = (Math.PI * 2 * index) / count + (index % 2 ? 0.25 : -0.12);
    const length = radius * (0.24 + ((index * 37) % 60) / 100) * progress;
    const kink = angle + (index % 3 - 1) * 0.32;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * radius * 0.08, y + Math.sin(angle) * radius * 0.08);
    ctx.lineTo(x + Math.cos(angle) * length * 0.55, y + Math.sin(angle) * length * 0.55);
    ctx.lineTo(x + Math.cos(kink) * length, y + Math.sin(kink) * length);
    ctx.stroke();
  }
  ctx.restore();
}

function seededUnit(index, salt = 0) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function drawAtmosphericDust(ctx, width, height, t, color, count = 36, intensity = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const baseX = seededUnit(index, 1.4) * width;
    const baseY = seededUnit(index, 2.7) * height;
    const drift = (t * (70 + seededUnit(index, 4.1) * 90)) % (height * 0.32);
    const x = baseX + Math.sin(t * 5 + index) * 18;
    const y = (baseY - drift + height * 0.16) % (height * 1.08);
    const radius = 1.2 + seededUnit(index, 5.8) * 3.4;
    ctx.globalAlpha = (0.08 + seededUnit(index, 6.2) * 0.16) * intensity;
    fillRadial(ctx, x, y, 0, radius * 7, [
      [0, color],
      [0.35, color.replace(/,\s*[\d.]+\)$/, ", .18)")],
      [1, color.replace(/,\s*[\d.]+\)$/, ", 0)")]
    ]);
  }
  ctx.restore();
}

function drawArcRibbon(ctx, cx, cy, radius, startAngle, endAngle, width, color, alpha) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.stroke();
  ctx.restore();
}

function drawShardField(ctx, width, height, t, color, count = 12, direction = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < count; index += 1) {
    const p = (t * (0.55 + seededUnit(index, 3.9) * 0.5) + seededUnit(index, 2.1)) % 1;
    const x = width * (direction > 0 ? -0.1 + p * 1.22 : 1.1 - p * 1.22);
    const y = height * (0.18 + seededUnit(index, 4.6) * 0.66);
    const size = 10 + seededUnit(index, 6.8) * 38;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((direction > 0 ? -0.8 : 0.8) + seededUnit(index, 9.2) * 0.9);
    ctx.globalAlpha = 0.08 + seededUnit(index, 10.3) * 0.28;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.22, 0);
    ctx.lineTo(0, size);
    ctx.lineTo(-size * 0.2, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawSharkScene(ctx, width, height, t, profile) {
  const alpha = sceneEnvelope(t, 0.9);
  const rise = easeOutCubic(clamp((t - 0.06) / 0.54, 0, 1));
  const recoil = smoothstep(0.62, 0.88, t);
  const x = width * (0.52 + Math.sin(t * 7.2) * 0.026);
  const y = height * (0.94 - rise * 0.52 + recoil * 0.035);
  const size = Math.min(width, height) * (0.38 + rise * 0.17);

  ctx.save();
  const water = ctx.createLinearGradient(0, height * 0.42, 0, height);
  water.addColorStop(0, "rgba(21, 103, 120, 0)");
  water.addColorStop(0.5, `rgba(${profile.main}, ${0.18 * alpha})`);
  water.addColorStop(1, `rgba(${profile.dark}, ${0.44 * alpha})`);
  ctx.fillStyle = water;
  ctx.fillRect(0, height * 0.48, width, height * 0.52);
  ctx.globalCompositeOperation = "screen";

  for (let i = 0; i < 13; i += 1) {
    const yy = height * (0.57 + i * 0.038) + Math.sin(t * 15 + i) * (5 + i * 0.45);
    const phase = t * (0.7 + i * 0.04);
    ctx.globalAlpha = alpha * (0.11 + i * 0.014);
    ctx.strokeStyle = i % 2 ? "rgba(222,255,251,.48)" : `rgba(${profile.main}, .35)`;
    ctx.lineWidth = 1.2 + i * 0.26;
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, yy);
    ctx.bezierCurveTo(width * (0.18 + phase * 0.05), yy - 38, width * 0.64, yy + 34, width * 1.12, yy - 10);
    ctx.stroke();
  }

  for (let i = 0; i < 24; i += 1) {
    const p = smoothstep(0.1, 0.72, t);
    const angle = -Math.PI * 0.92 + i * 0.08 + Math.sin(i) * 0.06;
    const length = size * (0.34 + seededUnit(i, 2.3) * 0.38) * p;
    const sx = x + Math.cos(angle) * size * 0.1;
    const sy = y + Math.sin(angle) * size * 0.08;
    drawCurveStreak(ctx, [
      [sx, sy],
      [sx + Math.cos(angle) * length * 0.35, sy + Math.sin(angle) * length * 0.2 - size * 0.18],
      [sx + Math.cos(angle) * length, sy + Math.sin(angle) * length]
    ], 1.4 + seededUnit(i, 3.1) * 3.8, i % 2 ? "rgba(224,255,250,.62)" : `rgba(${profile.main}, .42)`, alpha * (0.16 + seededUnit(i, 4.2) * 0.26), 9);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = alpha * (0.62 + rise * 0.26);
  ctx.filter = "blur(1px) saturate(1.18) contrast(1.14)";
  ctx.translate(x - size * 0.12, y - size * 0.03);
  ctx.rotate(-0.2 - rise * 0.2 + Math.sin(t * 5) * 0.025);
  const shark = ctx.createLinearGradient(-size * 1.2, -size * 0.36, size * 1.16, size * 0.34);
  shark.addColorStop(0, "rgba(0, 7, 14, .98)");
  shark.addColorStop(0.38, "rgba(3, 28, 42, .94)");
  shark.addColorStop(0.62, "rgba(46, 132, 146, .42)");
  shark.addColorStop(1, "rgba(1, 12, 22, .98)");
  ctx.fillStyle = shark;
  ctx.shadowColor = "rgba(102, 242, 255, .38)";
  ctx.shadowBlur = 30;
  ctx.beginPath();
  ctx.moveTo(size * 1.12, -size * 0.02);
  ctx.bezierCurveTo(size * 0.68, -size * 0.46, -size * 0.22, -size * 0.45, -size * 0.98, -size * 0.2);
  ctx.bezierCurveTo(-size * 1.22, -size * 0.1, -size * 1.22, size * 0.12, -size * 0.96, size * 0.2);
  ctx.bezierCurveTo(-size * 0.22, size * 0.46, size * 0.76, size * 0.3, size * 1.12, -size * 0.02);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = alpha * 0.44;
  ctx.fillStyle = "rgba(2, 12, 20, .72)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.94, -size * 0.08);
  ctx.lineTo(-size * 1.45, -size * 0.48);
  ctx.lineTo(-size * 1.28, -size * 0.04);
  ctx.lineTo(-size * 1.45, size * 0.36);
  ctx.lineTo(-size * 0.94, size * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.35);
  ctx.lineTo(size * 0.12, -size * 0.82);
  ctx.lineTo(size * 0.2, -size * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.08, size * 0.24);
  ctx.lineTo(size * 0.46, size * 0.62);
  ctx.lineTo(size * 0.23, size * 0.11);
  ctx.closePath();
  ctx.fill();

  ctx.filter = "blur(1.8px)";
  ctx.globalAlpha = alpha * 0.58;
  ctx.fillStyle = "rgba(0, 6, 12, .94)";
  ctx.beginPath();
  ctx.moveTo(size * 0.7, size * 0.04);
  ctx.quadraticCurveTo(size * 0.94, size * 0.14, size * 1.08, -size * 0.01);
  ctx.quadraticCurveTo(size * 0.86, size * 0.25, size * 0.55, size * 0.21);
  ctx.closePath();
  ctx.fill();
  ctx.filter = "blur(.4px)";
  ctx.globalAlpha = alpha * 0.7;
  ctx.strokeStyle = "rgba(234,255,250,.9)";
  ctx.lineWidth = Math.max(1.2, size * 0.008);
  ctx.beginPath();
  ctx.moveTo(size * 0.56, size * 0.13);
  ctx.quadraticCurveTo(size * 0.78, size * 0.24, size * 1.0, size * 0.02);
  ctx.stroke();
  ctx.fillStyle = "rgba(225,255,250,.95)";
  ctx.beginPath();
  ctx.arc(size * 0.61, -size * 0.14, size * 0.025, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "screen";
  for (let tooth = 0; tooth < 9; tooth += 1) {
    const tx = size * (0.54 + tooth * 0.047);
    const ty = size * (0.1 + Math.sin(tooth) * 0.018);
    ctx.globalAlpha = alpha * (0.11 + rise * 0.09);
    ctx.fillStyle = "rgba(238,255,250,.82)";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(tx + size * 0.018, ty + size * 0.055);
    ctx.lineTo(tx - size * 0.012, ty + size * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  drawRadialGlow(ctx, x, y - size * 0.1, size * 0.82, [
    [0, "rgba(151,250,255,.7)"],
    [0.34, `rgba(${profile.main}, .24)`],
    [1, `rgba(${profile.main}, 0)`]
  ], alpha * 0.38);
}

function drawCaitlynScene(ctx, width, height, t, profile) {
  const lock = easeInOutCubic(clamp(t / 0.5, 0, 1));
  const shot = easeOutCubic(clamp((t - 0.44) / 0.22, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * (0.3 + lock * 0.12);

  drawDepthDust(ctx, width, height, t, profile, 46, 0.7);
  ctx.save();
  ctx.fillStyle = `rgba(5, 5, 8, ${0.22 * lock * fade})`;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx, cy);
  ctx.rotate((1 - lock) * -0.3 + t * 0.08);
  for (let i = 0; i < 5; i += 1) {
    const ring = radius * (0.72 + i * 0.2 + Math.sin(t * 4 + i) * 0.012);
    ctx.globalAlpha = fade * lock * (0.48 - i * 0.055);
    ctx.strokeStyle = i % 2 ? `rgba(${profile.third}, .76)` : `rgba(${profile.main}, .86)`;
    ctx.lineWidth = 1.2 + i * 0.32;
    ctx.beginPath();
    ctx.arc(0, 0, ring, 0.18 + i * 0.2, Math.PI * 2 - 0.18);
    ctx.stroke();
  }
  for (let index = 0; index < 64; index += 1) {
    const angle = (index / 64) * Math.PI * 2;
    const long = index % 8 === 0;
    const inner = radius * (0.82 + (long ? 0.06 : 0.02));
    const outer = radius * (0.96 + (long ? 0.22 : 0.08));
    ctx.globalAlpha = fade * lock * (long ? 0.5 : 0.16);
    ctx.strokeStyle = long ? "rgba(255,249,226,.9)" : `rgba(${profile.main}, .58)`;
    ctx.lineWidth = long ? 2 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
    ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
    ctx.stroke();
  }
  ctx.globalAlpha = fade * lock * 0.94;
  ctx.strokeStyle = "rgba(255,251,230,.92)";
  ctx.lineWidth = Math.max(1.4, width * 0.0018);
  ctx.beginPath();
  ctx.moveTo(-radius * 1.35, 0);
  ctx.lineTo(-radius * 0.16, 0);
  ctx.moveTo(radius * 0.16, 0);
  ctx.lineTo(radius * 1.35, 0);
  ctx.moveTo(0, -radius * 1.35);
  ctx.lineTo(0, -radius * 0.16);
  ctx.moveTo(0, radius * 0.16);
  ctx.lineTo(0, radius * 1.35);
  ctx.stroke();
  ctx.restore();

  if (shot > 0) {
    const tail = 1 - smoothstep(0.7, 0.98, t);
    drawStreak(ctx, width * (-0.22 + shot * 0.58), height * 0.18, cx, cy, Math.max(5, width * 0.006), "rgba(255,252,232,.98)", tail, 22);
    drawStreak(ctx, width * (-0.3 + shot * 0.62), height * 0.2, cx, cy, Math.max(12, width * 0.012), `rgba(${profile.main}, .42)`, tail * 0.75, 34);
    drawRadialGlow(ctx, cx, cy, radius * (0.2 + shot * 0.54), [
      [0, "rgba(255,252,232,.98)"],
      [0.22, `rgba(${profile.main}, .62)`],
      [0.64, `rgba(${profile.third}, .18)`],
      [1, `rgba(${profile.main}, 0)`]
    ], tail);
    drawCracks(ctx, cx, cy, radius * 1.22, 16, shot, "rgba(255,246,218,.52)");
    drawCracks(ctx, cx, cy, radius * 0.76, 9, shot, `rgba(${profile.third}, .36)`);
  }
}

function drawEzrealScene(ctx, width, height, t, profile) {
  const travel = easeInOutCubic(clamp((t - 0.02) / 0.82, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const x = width * (-0.18 + travel * 1.52);
  const y = height * (1.08 - travel * 1.17);
  const angle = -0.72;
  drawDepthDust(ctx, width, height, t, profile, 68, 1.4);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 11; i += 1) {
    const back = i * (36 + width * 0.012);
    const wobble = Math.sin(t * 11 + i) * (8 + i * 1.4);
    const sx = x - back;
    const sy = y + back * 0.68 + wobble;
    drawCurveStreak(ctx, [
      [sx, sy],
      [sx - width * 0.1, sy + height * 0.03],
      [sx - width * 0.24, sy + height * 0.18],
      [sx - width * 0.4, sy + height * 0.32]
    ], 5 + i * 2.5, i % 2 ? `rgba(${profile.main}, .74)` : `rgba(${profile.secondary}, .66)`, fade * (0.11 + (11 - i) * 0.036), 20 + i * 2);
  }
  drawRadialGlow(ctx, x, y, Math.min(width, height) * 0.27, [
    [0, "rgba(255,252,232,1)"],
    [0.2, `rgba(${profile.main}, .86)`],
    [0.52, `rgba(${profile.third}, .28)`],
    [1, `rgba(${profile.main}, 0)`]
  ], fade);
  ctx.translate(x, y);
  ctx.rotate(angle);
  const headGradient = ctx.createLinearGradient(-110, 0, 130, 0);
  headGradient.addColorStop(0, `rgba(${profile.main}, 0)`);
  headGradient.addColorStop(0.44, `rgba(${profile.main}, .7)`);
  headGradient.addColorStop(0.7, "rgba(255, 248, 203, .98)");
  headGradient.addColorStop(1, "rgba(255, 255, 255, .9)");
  ctx.fillStyle = headGradient;
  ctx.globalAlpha = fade * 0.95;
  ctx.shadowColor = `rgba(${profile.main}, .72)`;
  ctx.shadowBlur = 28;
  ctx.beginPath();
  ctx.moveTo(136, 0);
  ctx.bezierCurveTo(52, -42, -68, -34, -108, 0);
  ctx.bezierCurveTo(-62, 36, 52, 42, 136, 0);
  ctx.fill();
  ctx.shadowBlur = 0;
  for (let index = 0; index < 6; index += 1) {
    const offset = index * 52;
    ctx.save();
    ctx.translate(-offset * 0.52, offset * 0.1);
    ctx.rotate(index * 0.2 + t * 3);
    ctx.globalAlpha = fade * (0.2 + index * 0.04);
    ctx.strokeStyle = index % 2 ? `rgba(${profile.secondary}, .78)` : "rgba(255,245,185,.78)";
    ctx.lineWidth = 1.4 + index * 0.2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(24, 0);
    ctx.lineTo(0, 24);
    ctx.lineTo(-24, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawSamiraScene(ctx, width, height, t, profile) {
  const p = easeOutCubic(clamp(t / 0.76, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const cx = width * 0.5;
  const cy = height * 0.52;
  const r = Math.min(width, height) * (0.21 + p * 0.19);
  drawDepthDust(ctx, width, height, t, profile, 54, 1.55);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let ring = 0; ring < 2; ring += 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * (4.2 + ring * 0.8) + ring * 1.4);
    ctx.globalAlpha = fade * (0.045 - ring * 0.012);
    ctx.strokeStyle = ring % 2 ? `rgba(${profile.main}, .82)` : `rgba(${profile.secondary}, .82)`;
    ctx.lineWidth = 1.4 + ring * 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * (1.05 + ring * 0.16), r * (0.38 + ring * 0.06), 0, 0.08, Math.PI * 1.28);
    ctx.stroke();
    ctx.restore();
  }
  for (let i = 0; i < 11; i += 1) {
    const a = t * 12 + i * 0.42;
    const radius = r * (0.62 + seededUnit(i, 2) * 0.64);
    const x = cx + Math.cos(a) * radius;
    const y = cy + Math.sin(a) * radius * 0.56;
    drawStreak(
      ctx,
      x - Math.cos(a) * (70 + i * 4),
      y - Math.sin(a) * (38 + i * 2),
      x + Math.cos(a) * (120 + i * 5),
      y + Math.sin(a) * (60 + i * 3),
      1.4 + seededUnit(i, 6) * 3.4,
      i % 2 ? `rgba(${profile.main}, .88)` : `rgba(${profile.secondary}, .82)`,
      fade * (0.075 + seededUnit(i, 7) * 0.11),
      15
    );
  }
  for (let i = 0; i < 4; i += 1) {
    const a = -0.7 + i * 0.28 + Math.sin(t * 5) * 0.05;
    const mx = cx + Math.cos(a) * r * 0.8;
    const my = cy + Math.sin(a) * r * 0.3;
    drawStreak(ctx, mx, my, mx + Math.cos(a) * width * 0.34, my + Math.sin(a) * height * 0.22, 5 + i * 0.7, "rgba(255,246,212,.64)", fade * (0.05 + i * 0.012), 20);
  }
  drawRadialGlow(ctx, cx, cy, r * 1.1, [
    [0, "rgba(255, 252, 232, .32)"],
    [0.28, `rgba(${profile.secondary}, .18)`],
    [0.68, `rgba(${profile.main}, .08)`],
    [1, `rgba(${profile.main}, 0)`]
  ], fade * 0.58);
  ctx.restore();
}

function drawKaisaScene(ctx, width, height, t, profile) {
  const open = easeInOutCubic(clamp(t / 0.68, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const cx = width * 0.5;
  const cy = height * 0.48;
  const size = Math.min(width, height) * (0.14 + open * 0.42);
  drawDepthDust(ctx, width, height, t, profile, 92, 1.3);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let wing = -1; wing <= 1; wing += 2) {
    for (let index = 0; index < 5; index += 1) {
      const spread = 0.28 + index * 0.16;
      const y1 = cy + (index - 2) * size * 0.08;
      drawCurveStreak(ctx, [
        [cx + wing * size * 0.06, y1],
        [cx + wing * size * (0.34 + open * 0.2), cy - size * spread],
        [cx + wing * size * (0.86 + open * 0.32), cy + size * (0.08 + spread * 0.5)]
      ], 3 + index * 1.1, index % 2 ? `rgba(${profile.secondary}, .74)` : `rgba(${profile.third}, .68)`, fade * (0.2 + index * 0.035), 18);
    }
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((t * 1.1 + 0.16) * Math.PI);
  for (let layer = 0; layer < 3; layer += 1) {
    const s = size * (1 - layer * 0.18);
    const gradient = ctx.createLinearGradient(-s, -s, s, s);
    gradient.addColorStop(0, `rgba(${profile.main}, ${0.74 - layer * 0.12})`);
    gradient.addColorStop(0.48, `rgba(${profile.secondary}, ${0.5 - layer * 0.08})`);
    gradient.addColorStop(1, `rgba(${profile.third}, ${0.62 - layer * 0.1})`);
    ctx.globalAlpha = fade * (0.84 - layer * 0.18);
    ctx.fillStyle = gradient;
    ctx.shadowColor = `rgba(${profile.main}, .4)`;
    ctx.shadowBlur = 20 - layer * 4;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.42, -s * 0.18);
    ctx.lineTo(s, 0);
    ctx.lineTo(s * 0.42, s * 0.18);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.42, s * 0.18);
    ctx.lineTo(-s, 0);
    ctx.lineTo(-s * 0.42, -s * 0.18);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (let index = 0; index < 6; index += 1) {
    drawArcRibbon(ctx, cx, cy, size * (0.8 + index * 0.16), t * 6 + index, t * 6 + index + Math.PI * 1.2, 2 + index * 0.6, index % 2 ? `rgba(${profile.main}, .72)` : `rgba(${profile.third}, .62)`, fade * (0.22 + index * 0.025));
  }
  drawShardField(ctx, width, height, t, `rgba(${profile.main}, .34)`, 18, 1);
  ctx.restore();
}

function drawMissFortuneScene(ctx, width, height, t, profile) {
  const fire = easeOutCubic(clamp((t - 0.08) / 0.62, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  drawDepthDust(ctx, width, height, t, profile, 70, 1.2);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  [[width * 0.28, -1], [width * 0.72, 1]].forEach(([x, dir], index) => {
    const color = index ? `rgba(${profile.secondary}, .72)` : `rgba(${profile.main}, .78)`;
    const cone = ctx.createLinearGradient(x, height * 0.92, width * (dir > 0 ? 1.04 : -0.04), height * 0.28);
    cone.addColorStop(0, color);
    cone.addColorStop(0.62, "rgba(255,245,204,.26)");
    cone.addColorStop(1, "rgba(255,245,204,0)");
    ctx.globalAlpha = fade * (0.3 + fire * 0.35);
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(x, height * 0.9);
    ctx.lineTo(width * (dir > 0 ? 1.08 : -0.08), height * (0.32 - fire * 0.1));
    ctx.lineTo(width * (dir > 0 ? 0.52 : 0.48), height * (0.45 - fire * 0.06));
    ctx.closePath();
    ctx.fill();
    drawRadialGlow(ctx, x, height * 0.8, Math.min(width, height) * 0.24, [
      [0, "rgba(255,248,218,.8)"],
      [0.28, color],
      [1, `rgba(${profile.main}, 0)`]
    ], fade * fire);
  });
  for (let i = 0; i < 36; i += 1) {
    const side = i % 2 ? 1 : -1;
    const startX = width * (side > 0 ? 0.72 : 0.28);
    const startY = height * (0.76 + seededUnit(i, 1.7) * 0.1);
    const endX = startX + side * width * (0.36 + seededUnit(i, 2.8) * 0.42);
    const endY = height * (0.16 + seededUnit(i, 3.2) * 0.54);
    drawStreak(ctx, startX, startY, endX, endY, 1.2 + seededUnit(i, 4.4) * 3.2, i % 3 ? "rgba(255,244,204,.66)" : `rgba(${profile.secondary}, .58)`, fade * fire * (0.12 + seededUnit(i, 5.2) * 0.28), 13);
  }
  for (let index = 0; index < 18; index += 1) {
    const x = width * (0.16 + seededUnit(index, 2) * 0.68);
    const y = height * (0.2 + seededUnit(index, 3) * 0.5 + fire * 0.08);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.8 + seededUnit(index, 5) * 1.1);
    ctx.globalAlpha = fade * (0.16 + seededUnit(index, 6) * 0.22);
    ctx.fillStyle = "rgba(255, 231, 168, .78)";
    ctx.fillRect(-3.5, -18, 7, 36);
    ctx.restore();
  }
  ctx.restore();
}

function drawJhinScene(ctx, width, height, t, profile) {
  const p = easeInOutCubic(clamp(t / 0.74, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const cx = width * 0.5;
  const cy = height * 0.5;
  ctx.save();
  ctx.fillStyle = `rgba(22, 10, 18, ${0.28 * fade + p * 0.16})`;
  ctx.fillRect(0, 0, width, height);
  drawDepthDust(ctx, width, height, t, profile, 52, 0.65);
  ctx.globalCompositeOperation = "screen";
  const spot = ctx.createRadialGradient(cx, height * 0.05, 0, cx, cy, Math.min(width, height) * 0.68);
  spot.addColorStop(0, `rgba(${profile.main}, ${0.22 * fade})`);
  spot.addColorStop(0.5, `rgba(${profile.secondary}, ${0.08 * fade})`);
  spot.addColorStop(1, `rgba(${profile.secondary}, 0)`);
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 4; i += 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * Math.PI * 0.5 + p * 0.82);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(width, height) * 0.36);
    grd.addColorStop(0, "rgba(255,236,190,.5)");
    grd.addColorStop(0.56, `rgba(${profile.secondary}, .18)`);
    grd.addColorStop(1, `rgba(${profile.secondary}, 0)`);
    ctx.fillStyle = grd;
    ctx.globalAlpha = fade * (0.74 - i * 0.06);
    ctx.beginPath();
    ctx.ellipse(0, -Math.min(width, height) * 0.18, Math.min(width, height) * 0.075, Math.min(width, height) * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  for (let index = 0; index < 34; index += 1) {
    const a = index * 0.54 + p * 3.2;
    const dist = Math.min(width, height) * (0.14 + seededUnit(index, 2) * 0.46);
    const px = cx + Math.cos(a) * dist;
    const py = cy + Math.sin(a) * dist * 0.62 + Math.sin(t * 5 + index) * 12;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a + Math.PI * 0.2);
    ctx.globalAlpha = fade * (0.12 + seededUnit(index, 8) * 0.32);
    ctx.fillStyle = index % 2 ? `rgba(${profile.secondary}, .68)` : `rgba(${profile.main}, .56)`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7 + seededUnit(index, 7) * 11, 20 + seededUnit(index, 9) * 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (t > 0.43) {
    const shot = 1 - smoothstep(0.74, 0.98, t);
    drawStreak(ctx, width * 0.07, cy, width * 0.93, cy, Math.max(4, width * 0.0048), "rgba(255,248,218,.96)", fade * shot, 26);
    drawRadialGlow(ctx, cx, cy, Math.min(width, height) * 0.34, [
      [0, "rgba(255,248,218,.84)"],
      [0.34, `rgba(${profile.secondary}, .3)`],
      [1, `rgba(${profile.secondary}, 0)`]
    ], fade * shot);
  }
  ctx.restore();
}

function drawAsheScene(ctx, width, height, t, profile) {
  const travel = easeInOutCubic(clamp((t - 0.04) / 0.78, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const x = width * (-0.18 + travel * 1.44);
  const y = height * (0.62 - travel * 0.2);
  drawDepthDust(ctx, width, height, t, profile, 84, 0.9);
  drawShardField(ctx, width, height, t, `rgba(${profile.main}, .32)`, 22, -1);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  drawStreak(ctx, x - width * 0.62, y + 54, x, y, Math.max(22, width * 0.021), `rgba(${profile.main}, .48)`, fade, 26);
  drawStreak(ctx, x - width * 0.52, y + 34, x + 42, y, Math.max(8, width * 0.008), "rgba(248,254,255,.86)", fade, 20);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.08 + Math.sin(t * 5) * 0.015);
  ctx.shadowColor = `rgba(${profile.main}, .7)`;
  ctx.shadowBlur = 22;
  const arrow = ctx.createLinearGradient(-70, 0, 118, 0);
  arrow.addColorStop(0, `rgba(${profile.secondary}, .34)`);
  arrow.addColorStop(0.48, `rgba(${profile.main}, .82)`);
  arrow.addColorStop(1, "rgba(250,254,255,.98)");
  ctx.fillStyle = arrow;
  ctx.globalAlpha = fade * 0.95;
  ctx.beginPath();
  ctx.moveTo(124, 0);
  ctx.lineTo(-48, -54);
  ctx.lineTo(-20, 0);
  ctx.lineTo(-48, 54);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(255,255,255,.76)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 16; i += 1) {
    const px = x - i * (34 + width * 0.01);
    const py = y + Math.sin(i * 0.7 + t * 7) * 46;
    const shard = 12 + seededUnit(i, 6) * 28;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(-0.62 + seededUnit(i, 8) * 1.2);
    ctx.globalAlpha = fade * (0.15 + seededUnit(i, 9) * 0.22);
    ctx.fillStyle = i % 2 ? `rgba(${profile.main}, .62)` : "rgba(255,255,255,.58)";
    ctx.beginPath();
    ctx.moveTo(0, -shard);
    ctx.lineTo(shard * 0.22, 0);
    ctx.lineTo(0, shard);
    ctx.lineTo(-shard * 0.18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  if (travel > 0.72) {
    const impact = smoothstep(0.72, 0.94, travel);
    for (let index = 0; index < 6; index += 1) {
      drawArcRibbon(ctx, x, y, 28 + index * 26 * impact, -0.9, 0.9, 1.2 + index * 0.4, "rgba(255,255,255,.72)", fade * impact * (0.28 - index * 0.03));
    }
  }
  ctx.restore();
}

function drawRammusScene(ctx, width, height, t, profile) {
  const roll = easeInOutCubic(clamp(t / 0.78, 0, 1));
  const fade = sceneEnvelope(t, 0.9);
  const x = width * (-0.08 + roll * 1.12);
  const y = height * 0.72;
  const r = Math.min(width, height) * 0.14;
  drawDepthDust(ctx, width, height, t, profile, 76, 1.7);
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = fade * (0.34 - i * 0.032);
    ctx.strokeStyle = i % 2 ? `rgba(${profile.secondary}, .74)` : `rgba(${profile.main}, .72)`;
    ctx.lineWidth = 3.4 - i * 0.42;
    ctx.beginPath();
    ctx.ellipse(x - r * (0.8 + i * 0.5), y + r * 0.7, r * (0.7 + i * 0.46 + roll * 0.46), r * 0.26 * (1 + i * 0.34 + roll * 0.4), -0.08, Math.PI * 0.08, Math.PI * 1.3);
    ctx.stroke();
  }
  for (let index = 0; index < 18; index += 1) {
    const startX = x - width * 0.32 - index * 10;
    const yy = y - r * 0.35 + (seededUnit(index, 5) - 0.5) * r * 2.1;
    drawStreak(ctx, startX, yy, startX - width * (0.14 + seededUnit(index, 6) * 0.2), yy + 10 + seededUnit(index, 7) * 34, 1.4 + seededUnit(index, 9) * 4, `rgba(${profile.secondary}, .56)`, fade * roll * (0.14 + seededUnit(index, 10) * 0.22), 12);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = fade * 0.96;
  const shell = ctx.createRadialGradient(x - r * 0.34, y - r * 0.45, r * 0.1, x, y - r * 0.16, r * 1.35);
  shell.addColorStop(0, "rgba(255,242,148,.98)");
  shell.addColorStop(0.42, `rgba(${profile.main}, .9)`);
  shell.addColorStop(0.78, `rgba(${profile.third}, .88)`);
  shell.addColorStop(1, "rgba(28,45,24,.96)");
  ctx.fillStyle = shell;
  ctx.shadowColor = `rgba(${profile.secondary}, .48)`;
  ctx.shadowBlur = 22;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.18, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(255, 245, 172, .72)";
  ctx.lineWidth = 2.4;
  for (let index = 0; index < 10; index += 1) {
    const a = t * 14 + index * 0.72;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.18, y - r * 0.18 + Math.sin(a) * r * 0.18);
    ctx.lineTo(x + Math.cos(a) * r * 0.92, y - r * 0.18 + Math.sin(a) * r * 0.92);
    ctx.stroke();
  }
  drawCracks(ctx, x, y + r * 0.72, r * 2.8, 14, roll, `rgba(${profile.secondary}, .36)`);
  drawCracks(ctx, x, y + r * 0.72, r * 1.7, 9, roll, "rgba(255,245,172,.34)");
  ctx.restore();
}

function drawChampionSignatureScene(ctx, profile, width, height, t) {
  const profileId = profile.id;
  if (profileId === "fizz") drawSharkScene(ctx, width, height, t, profile);
  else if (profileId === "caitlyn") drawCaitlynScene(ctx, width, height, t, profile);
  else if (profileId === "ezreal") drawEzrealScene(ctx, width, height, t, profile);
  else if (profileId === "samira") drawSamiraScene(ctx, width, height, t, profile);
  else if (profileId === "kaisa") drawKaisaScene(ctx, width, height, t, profile);
  else if (profileId === "missfortune") drawMissFortuneScene(ctx, width, height, t, profile);
  else if (profileId === "jhin") drawJhinScene(ctx, width, height, t, profile);
  else if (profileId === "ashe") drawAsheScene(ctx, width, height, t, profile);
  else if (profileId === "rammus") drawRammusScene(ctx, width, height, t, profile);
  else drawEzrealScene(ctx, width, height, t, profile);
}

const vfxAccentLayer = {
  canvas: null,
  context: null
};

const vfxLayerOpacities = {
  samira: { signature: 0.5, action: 0.54 },
  caitlyn: { signature: 0.36, action: 0.42 },
  fizz: { signature: 0.58, action: 0.48 },
  kaisa: { signature: 0.44, action: 0.5 },
  missfortune: { signature: 0.46, action: 0.52 },
  ezreal: { signature: 0.48, action: 0.54 },
  jhin: { signature: 0.5, action: 0.54 },
  ashe: { signature: 0.48, action: 0.52 },
  rammus: { signature: 0.48, action: 0.52 },
  default: { signature: 0.46, action: 0.52 }
};

function vfxLayerOpacity(profileId, layer, width) {
  const table = vfxLayerOpacities[profileId] || vfxLayerOpacities.default;
  const mobileLift = width < 760 ? 0.1 : 0;
  return Math.min(0.72, (table[layer] || vfxLayerOpacities.default[layer]) + mobileLift);
}

function drawVfxAccentLayer(ctx, width, height, opacity, renderer) {
  if (opacity >= 0.98) {
    renderer(ctx);
    return;
  }
  if (!vfxAccentLayer.canvas) {
    vfxAccentLayer.canvas = document.createElement("canvas");
    vfxAccentLayer.context = vfxAccentLayer.canvas.getContext("2d", { alpha: true, desynchronized: true });
  }
  const layerContext = vfxAccentLayer.context;
  const layerCanvas = vfxAccentLayer.canvas;
  if (!layerContext || !layerCanvas) {
    renderer(ctx);
    return;
  }
  if (layerCanvas.width !== width || layerCanvas.height !== height) {
    layerCanvas.width = width;
    layerCanvas.height = height;
  }
  layerContext.setTransform(1, 0, 0, 1, 0, 0);
  layerContext.clearRect(0, 0, width, height);
  renderer(layerContext);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = opacity;
  ctx.drawImage(layerCanvas, 0, 0);
  ctx.restore();
}

function drawChampionAtmosphereFrame(ctx, profile, width, height, seconds, burst = 0) {
  const stage = cinematicStageFor(profile.id);
  const cycle = (seconds * 0.08) % 1;
  const t = 0.16 + cycle * 0.68;
  const reveal = Math.max(0, Math.min(1, burst));
  const impact = 0.18 + reveal * 0.82;

  ctx.save();
  ctx.globalAlpha = 0.86;
  drawPremiumMaterialWorld(ctx, width, height, t, profile, stage);
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.42 + reveal * 0.34;
  drawChampionSignatureScene(ctx, profile, width, height, 0.22 + cycle * 0.5);
  drawChampionActionCues(ctx, width, height, t, profile, stage, impact);
  ctx.restore();

  if (reveal > 0.01) {
    const pulseT = 0.2 + (1 - reveal) * 0.56;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = reveal * 0.64;
    drawChampionSignatureScene(ctx, profile, width, height, pulseT);
    drawCinematicLensPass(ctx, width, height, pulseT, profile);
    ctx.restore();
  }

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const shade = ctx.createLinearGradient(0, 0, width, height);
  shade.addColorStop(0, "rgba(0,0,0,.18)");
  shade.addColorStop(0.45, "rgba(0,0,0,.03)");
  shade.addColorStop(1, "rgba(0,0,0,.42)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawUltimateFrame(ctx, profile, width, height, elapsed, duration) {
  const t = clamp(elapsed / duration, 0, 1);
  const stage = cinematicStageFor(profile.id);
  ctx.clearRect(0, 0, width, height);
  drawCinematicBackdrop(ctx, width, height, t, profile);
  drawPremiumMaterialWorld(ctx, width, height, t, profile, stage);
  drawVfxAccentLayer(ctx, width, height, vfxLayerOpacity(profile.id, "signature", width), (layerContext) => {
    drawChampionSignatureScene(layerContext, profile, width, height, t);
  });
  drawCinematicLensPass(ctx, width, height, t, profile);
  drawVfxAccentLayer(ctx, width, height, vfxLayerOpacity(profile.id, "action", width), (layerContext) => {
    drawChampionActionCues(layerContext, width, height, t, profile, stage, sceneEnvelope(t, 0.94));
  });
  drawCinematicFilmFinish(ctx, width, height, t, profile, stage);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(12, 8, 10, ${0.1 * (1 - sceneEnvelope(t, 0.92))})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  drawCameraShudder(ctx, width, height, t, profile);
  drawLetterbox(ctx, width, height, 0.14 * Math.sin(Math.PI * clamp(t / 0.98, 0, 1)));
}

function warmCinematicCanvases() {
  if (motionQuery.matches || vfx2dWarmPromise) return vfx2dWarmPromise || Promise.resolve();
  vfx2dWarmPromise = Promise.resolve().then(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(390, Math.min(720, Math.ceil(window.innerWidth || 960)));
    canvas.height = Math.max(360, Math.min(540, Math.ceil(window.innerHeight || 540)));
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    for (const champion of pageChampions) {
      const duration = visualDurations[champion.id] || 3800;
      const profile = fxProfileFor(champion.id);
      drawUltimateFrame(context, profile, canvas.width, canvas.height, duration * 0.38, duration);
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }).catch(() => {});
  return vfx2dWarmPromise;
}

function spawnSelectionFx(button, profileId = "default") {
  if (motionQuery.matches || !page || !button) return;
  const profile = fxProfileFor(profileId);
  window.clearTimeout(fxTimer);
  document.querySelectorAll(".selection-fx").forEach((node) => {
    if (node._raf) cancelAnimationFrame(node._raf);
    if (node._threeStartTimer) window.clearTimeout(node._threeStartTimer);
    if (node._threeDispose) node._threeDispose();
    node.remove();
  });

  const fx = document.createElement("div");
  const shaderCanvas = document.createElement("canvas");
  const threeCanvas = document.createElement("canvas");
  const canvas = document.createElement("canvas");
  fx.className = "selection-fx ultimate-scene";
  fx.dataset.championFx = profile.id;
  fx.dataset.vfxTier = "panel-atmosphere-vfx24";
  fx.setAttribute("aria-hidden", "true");
  shaderCanvas.className = "fx-shader-canvas";
  threeCanvas.className = "fx-three-canvas";
  canvas.className = "fx-2d-canvas";
  applyFxProfileVars(fx, profile);
  fx.append(shaderCanvas, threeCanvas, canvas);
  document.body.append(fx);

  const shaderState = createUltimateShaderState(shaderCanvas);
  const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
  const startedAt = performance.now();
  const duration = visualDurations[profile.id] || 3800;
  let lastFrameAt = startedAt;
  let frameCount = 0;
  let frameTotal = 0;
  let frameMax = 0;
  let slowFrames = 0;
  let last2dDrawAt = -Infinity;
  let stage = applySelectionStage(fx, button);
  let stageWidth = Math.ceil(stage.width);
  let stageHeight = Math.ceil(stage.height);
  let stageDpr = effectPixelRatioFor();
  let threeScene;
  let threeStartTimer = 0;
  const updateStageSize = () => {
    stage = applySelectionStage(fx, button);
    stageWidth = Math.ceil(stage.width);
    stageHeight = Math.ceil(stage.height);
    stageDpr = effectPixelRatioFor();
  };
  window.addEventListener("resize", updateStageSize, { passive: true });
  threeStartTimer = window.setTimeout(() => {
    void loadVfx3dModule().then((module) => {
      if (!module || !fx.isConnected) return;
      threeScene = module.createChampionVfx3D({
        canvas: threeCanvas,
        championId: profile.id,
        profile,
        duration
      });
      fx._threeDispose = () => {
        threeScene?.dispose();
        threeScene = undefined;
      };
    });
  }, 90);
  fx._threeStartTimer = threeStartTimer;
  const render = (now) => {
    const width = stageWidth;
    const height = stageHeight;
    const dpr = stageDpr;
    const twoDDpr = effect2dPixelRatioFor(profile.id, width, dpr);
    const pixelWidth = Math.round(width * twoDDpr);
    const pixelHeight = Math.round(height * twoDDpr);
    const elapsed = now - startedAt;
    const frameDelta = now - lastFrameAt;
    lastFrameAt = now;
    if (frameCount > 0) {
      frameTotal += frameDelta;
      frameMax = Math.max(frameMax, frameDelta);
      if (frameDelta > 24) slowFrames += 1;
      window.__leagueVfxStats = {
        champion: profile.id,
        frameCount,
        avgMs: Math.round((frameTotal / frameCount) * 10) / 10,
        maxMs: Math.round(frameMax * 10) / 10,
        slowFrames,
        dpr,
        twoDDpr,
        width,
        height,
        three: Boolean(threeScene)
      };
      fx.dataset.frameStats = JSON.stringify(window.__leagueVfxStats);
    }
    frameCount += 1;
    if (shaderState) {
      renderUltimateShader(shaderState, profile, width, height, elapsed, duration, dpr);
    }
    if (threeScene) {
      threeScene.resize(width, height, dpr);
      threeScene.render(elapsed, duration);
    }
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      last2dDrawAt = -Infinity;
    }
    const needsFirst2dDraw = last2dDrawAt < 0 && elapsed > 32;
    const twoDFrameInterval = 16;
    const needs2dDraw = last2dDrawAt >= 0 && elapsed - last2dDrawAt >= twoDFrameInterval;
    if (needsFirst2dDraw || needs2dDraw || elapsed > duration - 140) {
      context.setTransform(1, 0, 0, 1, 0, 0);
      drawUltimateFrame(context, profile, pixelWidth, pixelHeight, elapsed, duration);
      last2dDrawAt = elapsed;
    }
    if (elapsed < duration + 60) {
      fx._raf = requestAnimationFrame(render);
    }
  };
  fx._raf = requestAnimationFrame(render);
  fxTimer = window.setTimeout(() => {
    if (fx._raf) cancelAnimationFrame(fx._raf);
    window.clearTimeout(threeStartTimer);
    window.removeEventListener("resize", updateStageSize);
    if (fx._threeDispose) fx._threeDispose();
    fx.remove();
  }, duration + 90);
}

function animateChampionSwap(champion) {
  window.clearTimeout(swapTimer);
  window.clearTimeout(settleTimer);

  const panels = [championPanel, recordingsSection].filter(Boolean);
  panels.forEach((panel) => {
    panel.setAttribute("aria-busy", "true");
    panel.classList.remove("is-entering");
    panel.classList.add("is-leaving");
  });

  const delay = motionQuery.matches ? 0 : 85;
  swapTimer = window.setTimeout(() => {
    writeChampion(champion);
    currentChampionId = champion.id;
    renderRecordings(recordingReviewData, champion.id);

    void championPanel.offsetWidth;
    panels.forEach((panel) => {
      panel.classList.remove("is-leaving");
      panel.classList.add("is-entering");
    });
    settleTimer = window.setTimeout(() => {
      panels.forEach((panel) => {
        panel.classList.remove("is-entering", "is-leaving");
        panel.removeAttribute("aria-busy");
      });
    }, motionQuery.matches ? 0 : 420);
  }, delay);
}

function championIdFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const value = String(params.get("champion") || window.location.hash.replace(/^#/, "") || "samira").trim().toLowerCase();
  return pageChampionIds.includes(value) ? value : "samira";
}

function setChampionRoute(championId, replace = false) {
  const url = new URL(window.location.href);
  url.searchParams.set("champion", championId);
  url.hash = "";
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ championId }, "", url);
}

function renderChampion(championId, options = {}) {
  const champion = pageChampionById(championId);
  if (options.updateRoute) setChampionRoute(champion.id, Boolean(options.replaceRoute));
  applyFxProfileVars(page, fxProfileFor(champion.id));
  setPressedChampion(champion.id);

  if (!options.animate || !currentChampionId || champion.id === currentChampionId) {
    writeChampion(champion);
    currentChampionId = champion.id;
    renderRecordings(recordingReviewData, champion.id);
    return;
  }

  animateChampionSwap(champion);
}

function renderPicker() {
  championPicker.replaceChildren(...pageChampions.map((champion, index) => {
    const button = document.createElement("button");
    button.className = "portrait-button";
    button.type = "button";
    button.dataset.champion = champion.id;
    applyFxProfileVars(button, fxProfileFor(champion.id));
    button.setAttribute("aria-label", `${champion.name}, ${champion.skin}`);
    button.setAttribute("aria-pressed", String(index === 0));
    const img = document.createElement("img");
    img.src = champion.image;
    img.alt = "";
    img.loading = "eager";
    img.decoding = "async";
    const ambient = document.createElement("span");
    ambient.className = "portrait-ambient";
    ambient.setAttribute("aria-hidden", "true");
    for (let ambientIndex = 0; ambientIndex < 5; ambientIndex += 1) {
      ambient.append(document.createElement("i"));
    }
    button.append(img, ambient);
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      button.style.setProperty("--rx", `${(-y * 7).toFixed(2)}deg`);
      button.style.setProperty("--ry", `${(x * 9).toFixed(2)}deg`);
      button.style.setProperty("--mx", `${((x + 0.5) * 100).toFixed(1)}%`);
      button.style.setProperty("--my", `${((y + 0.5) * 100).toFixed(1)}%`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--rx", "0deg");
      button.style.setProperty("--ry", "0deg");
      button.style.setProperty("--mx", "50%");
      button.style.setProperty("--my", "42%");
    });
    button.addEventListener("pointerenter", () => {
      void warmVfx3dRenderer(champion.id);
    });
    button.addEventListener("focus", () => {
      void warmVfx3dRenderer(champion.id);
    });
    button.addEventListener("click", () => {
      button.classList.remove("is-flashing");
      void button.offsetWidth;
      button.classList.add("is-flashing");
      playSelectSound(champion.id);
      spawnSelectionFx(button, champion.id);
      window.setTimeout(() => button.classList.remove("is-flashing"), (visualDurations[champion.id] || 760) + 280);
      renderChampion(champion.id, { animate: true, updateRoute: true });
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
renderChampion(championIdFromLocation(), { animate: false, updateRoute: true, replaceRoute: true });
hydrateRecordings();
hydratePublicNotes();
window.addEventListener("popstate", () => {
  renderChampion(championIdFromLocation(), { animate: true });
});
if (!motionQuery.matches) {
  window.setTimeout(primeCinematicAssets, 220);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(primeCinematicAssets, { timeout: 1600 });
  } else {
    window.setTimeout(primeCinematicAssets, 650);
  }
}
