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
    thump: { frequency: 68, endFrequency: 38, length: 0.18, gain: 0.52 },
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
    thump: { frequency: 76, endFrequency: 52, length: 0.22, gain: 0.3 },
    noise: { start: 0.02, length: 0.42, startFrequency: 5800, endFrequency: 1600, gain: 0.12 },
    tail: { frequency: 62, center: 0.62, width: 0.42, gain: 0.015 },
    tones: [
      { type: "sine", frequency: 392, start: 0, length: 0.22, gain: 0.18, pan: -0.35 },
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
    { kind: "noise", filter: "highpass", start: 0.04, length: 0.16, startFrequency: 14800, endFrequency: 3200, gain: 0.36, pan: -0.74 },
    { kind: "noise", filter: "highpass", start: 0.18, length: 0.16, startFrequency: 14200, endFrequency: 3000, gain: 0.34, pan: 0.7 },
    { kind: "brass", notes: [73.42, 110, 146.83], start: 0.1, length: 1.1, gain: 0.3, pan: -0.08 },
    { kind: "string", notes: [220, 277.18, 370], start: 0.34, length: 0.95, gain: 0.16, pan: 0.18 },
    { kind: "hit", frequency: 112, endFrequency: 36, start: 0.62, length: 0.34, gain: 0.62 }
  ],
  caitlyn: [
    { kind: "cinematic", flavor: "sniper", start: 0, length: 1.65, gain: 0.74 },
    { kind: "noise", filter: "lowpass", start: 0, length: 0.8, startFrequency: 900, endFrequency: 110, gain: 0.22 },
    { kind: "bell", notes: [1244.51, 1864.66], start: 0.06, length: 1.15, gain: 0.12 },
    { kind: "hit", frequency: 92, endFrequency: 32, start: 0.28, length: 0.22, gain: 0.72 },
    { kind: "drum", frequency: 34, endFrequency: 16, start: 0.3, length: 0.7, gain: 0.58 },
    { kind: "brass", notes: [46.25, 69.3, 92.5], start: 0.38, length: 1.22, gain: 0.24 },
    { kind: "noise", filter: "highpass", start: 0.32, length: 0.08, startFrequency: 16400, endFrequency: 8200, gain: 0.58, pan: 0.34 }
  ],
  fizz: [
    { kind: "cinematic", flavor: "monster", start: 0, length: 1.7, gain: 0.82 },
    { kind: "water", start: 0, length: 1.25, gain: 0.4, pan: -0.12 },
    { kind: "drum", frequency: 66, endFrequency: 24, start: 0.05, length: 0.48, gain: 0.56 },
    { kind: "bell", notes: [392, 587.33, 783.99], start: 0.14, length: 0.8, gain: 0.12, pan: 0.18 },
    { kind: "water", start: 0.48, length: 1.0, gain: 0.32, pan: 0.34 },
    { kind: "string", notes: [261.63, 392, 523.25], start: 0.58, length: 0.95, gain: 0.13 },
    { kind: "noise", filter: "highpass", start: 0.88, length: 0.38, startFrequency: 7600, endFrequency: 2600, gain: 0.18 }
  ],
  kaisa: [
    { kind: "cinematic", flavor: "void", start: 0, length: 1.65, gain: 0.78 },
    { kind: "choir", notes: [55, 82.41, 164.81], start: 0, length: 1.62, gain: 0.22 },
    { kind: "pulse", notes: [110, 220, 440], start: 0.08, length: 1.22, gain: 0.22, pan: -0.18 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 1.15, startFrequency: 9200, endFrequency: 180, gain: 0.28, q: 0.34 },
    { kind: "brass", notes: [65.41, 98, 130.81], start: 0.42, length: 1.06, gain: 0.22 },
    { kind: "hit", frequency: 78, endFrequency: 22, start: 0.72, length: 0.42, gain: 0.5 },
    { kind: "string", notes: [329.63, 493.88, 987.77], start: 0.9, length: 0.95, gain: 0.11, pan: 0.24 }
  ],
  missfortune: [
    { kind: "cinematic", flavor: "sax", start: 0, length: 1.62, gain: 0.76 },
    { kind: "drum", frequency: 40, endFrequency: 18, start: 0, length: 0.78, gain: 0.86 },
    { kind: "brass", notes: [65.41, 98, 130.81, 196], start: 0.04, length: 1.18, gain: 0.3 },
    { kind: "noise", filter: "highpass", start: 0.18, length: 0.08, startFrequency: 15600, endFrequency: 6200, gain: 0.48, pan: -0.62 },
    { kind: "hit", frequency: 98, endFrequency: 30, start: 0.18, length: 0.26, gain: 0.56, pan: -0.24 },
    { kind: "noise", filter: "highpass", start: 0.38, length: 0.08, startFrequency: 15600, endFrequency: 6200, gain: 0.5, pan: 0.62 },
    { kind: "hit", frequency: 92, endFrequency: 28, start: 0.38, length: 0.28, gain: 0.58, pan: 0.24 },
    { kind: "string", notes: [293.66, 440, 587.33], start: 0.56, length: 1.04, gain: 0.13 }
  ],
  ezreal: [
    { kind: "cinematic", flavor: "arcane", start: 0, length: 1.45, gain: 0.72 },
    { kind: "spark", notes: [392, 587.33, 783.99], start: 0, length: 0.62, gain: 0.16, pan: -0.42 },
    { kind: "spark", notes: [523.25, 783.99, 1174.66], start: 0.18, length: 0.68, gain: 0.15, pan: 0.42 },
    { kind: "string", notes: [196, 293.66, 392], start: 0.32, length: 1.0, gain: 0.14 },
    { kind: "hit", frequency: 84, endFrequency: 30, start: 0.5, length: 0.3, gain: 0.46 },
    { kind: "drum", frequency: 46, endFrequency: 22, start: 0.54, length: 0.5, gain: 0.42 },
    { kind: "noise", filter: "bandpass", start: 0.64, length: 0.82, startFrequency: 11200, endFrequency: 2200, gain: 0.18 }
  ],
  jhin: [
    { kind: "cinematic", flavor: "curtain", start: 0, length: 1.9, gain: 0.82 },
    { kind: "string", notes: [196], start: 0, length: 0.52, gain: 0.18 },
    { kind: "string", notes: [246.94], start: 0.24, length: 0.54, gain: 0.17 },
    { kind: "string", notes: [293.66], start: 0.5, length: 0.56, gain: 0.16 },
    { kind: "bell", notes: [392, 783.99], start: 0.8, length: 1.1, gain: 0.14 },
    { kind: "hit", frequency: 58, endFrequency: 14, start: 0.82, length: 0.82, gain: 0.86 },
    { kind: "brass", notes: [49, 73.42, 98], start: 0.92, length: 1.1, gain: 0.28 },
    { kind: "choir", notes: [146.83, 220, 293.66], start: 1.06, length: 1.2, gain: 0.12 }
  ],
  ashe: [
    { kind: "cinematic", flavor: "ice", start: 0, length: 1.6, gain: 0.7 },
    { kind: "string", notes: [261.63, 392, 523.25], start: 0, length: 1.12, gain: 0.16, pan: -0.2 },
    { kind: "bell", notes: [1046.5, 1567.98, 2093], start: 0.12, length: 1.18, gain: 0.12, pan: 0.2 },
    { kind: "noise", filter: "highpass", start: 0.16, length: 0.72, startFrequency: 14800, endFrequency: 3200, gain: 0.18 },
    { kind: "hit", frequency: 72, endFrequency: 28, start: 0.46, length: 0.28, gain: 0.38 },
    { kind: "choir", notes: [174.61, 261.63, 349.23], start: 0.62, length: 1.18, gain: 0.11 }
  ],
  rammus: [
    { kind: "cinematic", flavor: "quake", start: 0, length: 1.58, gain: 0.84 },
    { kind: "roll", frequency: 30, endFrequency: 12, start: 0, length: 1.52, gain: 0.86 },
    { kind: "drum", frequency: 28, endFrequency: 12, start: 0.02, length: 0.92, gain: 0.92 },
    { kind: "noise", filter: "lowpass", start: 0.08, length: 1.38, startFrequency: 1600, endFrequency: 80, gain: 0.36, q: 0.35 },
    { kind: "hit", frequency: 52, endFrequency: 18, start: 0.5, length: 0.42, gain: 0.58 },
    { kind: "hit", frequency: 42, endFrequency: 14, start: 0.92, length: 0.42, gain: 0.46 },
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
        title: "You do not recognize which CC can stop the dash.",
        response: "If you cannot name the stun, root, hook, charm, engage, or point-and-click lockdown that can stop you, do not E in first. Play Q-only: Q, safe auto, move, Q, and watch one danger spell. Sidestep or W flying threats like Lux Q, Morgana Q, Xerath E, Ahri charm, Ashe R, Anivia Q, and hooks; assume Annie walking near you has stun loaded; back up when Leona, Nautilus, Rell, Alistar, Rakan, or Pantheon walks at you; do not dive Malzahar, Lissandra, Warwick, Skarner-style grab, or Vi alone. When the scary spell misses, is used on someone else, or the fight is already messy, E is allowed only if the target is low and reachable."
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
        title: "You are near a team fight, R is not ready, and waiting there starts costing HP.",
        response: "If you do not have S yet, standing near the group is not preparation; it is leaking health while your hands wait for permission to ult. Move to the edge first. Build style from safety with Q, auto, and one real W block if a projectile is coming. Do not E just to finish the style bar unless the target is already losing, reachable, and the scary CC is gone. The pre-ult job is edge, poke, breathe, check S; only when S exists and the fight is already committed do you enter for R."
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
const championPanel = document.querySelector("#champion-panel");
const championName = document.querySelector("#champion-name");
const championFocus = document.querySelector("#champion-focus");
const championNote = document.querySelector("#champion-note");
const situationsSection = document.querySelector(".situations");
const situationCount = document.querySelector("#situation-count");
const situationList = document.querySelector("#situation-list");
const page = document.querySelector(".page");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

let currentChampionId = "";
let swapTimer = 0;
let settleTimer = 0;
let audioContext;
let activeStinger;
const fallbackAudioUrls = {};
let burstTimer = 0;
let fxTimer = 0;
const stingerVersion = "20260518-phrase23";
const stingerUrls = Object.fromEntries(champions.map((champion) => [
  champion.id,
  `/audio/${champion.id}.mp3?v=${stingerVersion}`
]));

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

function writeChampion(champion) {
  championName.textContent = champion.name;
  championFocus.textContent = champion.focus;
  championNote.textContent = champion.note;
  situationCount.textContent = `${champion.situations.length} situations`;
  situationList.replaceChildren(...champion.situations.map(situationCard));
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
      const length = Math.max(0.03, event.length || 0.24);
      const start = event.start || 0;
      const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * length), audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i += 1) {
        const progress = i / noiseData.length;
        const fade = Math.sin(Math.PI * progress) ** (event.curve || 0.7);
        noiseData[i] = (Math.random() * 2 - 1) * fade;
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
      noiseGain.gain.exponentialRampToValueAtTime(event.gain || 0.12, now + start + 0.018);
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
        bell: { type: "sine", attack: 0.006, filter: "highpass", startFrequency: 520, endFilterFrequency: 780, q: 0.38, wet: 1 },
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

    const playHit = (event) => {
      playThump(event);
      playNoise({
        ...event,
        start: (event.start || 0) + 0.012,
        length: Math.min(0.16, event.length || 0.18),
        filter: "highpass",
        startFrequency: 9400,
        endFrequency: 2600,
        gain: (event.gain || 0.4) * 0.38,
        wet: 0
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
        playHit({
          ...event,
          start: (event.start || 0) + progress * (event.length || 1.2) * 0.72,
          length: 0.2,
          frequency: (event.frequency || 34) + index * 3,
          endFrequency: (event.endFrequency || 14) + index,
          gain: (event.gain || 0.5) * (0.38 + progress * 0.18),
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
        playHit({ start: start + 0.6, length: 0.22, frequency: flavor === "sniper" ? 94 : 58, endFrequency: 18, gain: gain * 0.56, wet: 0 });
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
        case "hit":
          playHit(event);
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

function playSelectSound(profileId = "default") {
  const stingerUrl = stingerUrls[profileId];
  if (!stingerUrl || !window.Audio) {
    playSynthSelectSound(profileId);
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
        playSynthSelectSound(profileId);
      });
    }
  } catch {
    playSynthSelectSound(profileId);
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

function drawCoverImage(ctx, image, width, height, opacity, scale = 1, xOffset = 0, yOffset = 0) {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return;
  const ratio = Math.max(width / image.naturalWidth, height / image.naturalHeight) * scale;
  const drawWidth = image.naturalWidth * ratio;
  const drawHeight = image.naturalHeight * ratio;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.filter = "blur(7px) saturate(1.28) contrast(1.05) brightness(.8)";
  ctx.drawImage(image, (width - drawWidth) / 2 + xOffset, (height - drawHeight) / 2 + yOffset, drawWidth, drawHeight);
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

function drawSharkScene(ctx, width, height, t) {
  const rise = easeOutCubic(clamp((t - 0.12) / 0.58, 0, 1));
  const settle = clamp((t - 0.68) / 0.28, 0, 1);
  const x = width * (0.52 + Math.sin(t * 5.2) * 0.025);
  const y = height * (1.16 - rise * 0.38 + settle * 0.04);
  const size = Math.min(width, height) * (0.28 + rise * 0.1);

  ctx.save();
  const water = ctx.createLinearGradient(0, height * 0.48, 0, height);
  water.addColorStop(0, "rgba(25, 110, 126, 0)");
  water.addColorStop(0.62, "rgba(33, 153, 170, .22)");
  water.addColorStop(1, "rgba(6, 48, 66, .42)");
  ctx.fillStyle = water;
  ctx.fillRect(0, height * 0.54, width, height * 0.46);

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.2 + rise * 0.26;
  for (let i = 0; i < 10; i += 1) {
    const yy = height * (0.61 + i * 0.042) + Math.sin(t * 13 + i) * 7;
    ctx.strokeStyle = i % 2 ? "rgba(184, 255, 250, .26)" : "rgba(255, 250, 220, .16)";
    ctx.lineWidth = 1.4 + i * 0.32;
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, yy);
    ctx.bezierCurveTo(width * 0.28, yy - 28, width * 0.58, yy + 28, width * 1.1, yy - 8);
    ctx.stroke();
  }

  for (let i = 0; i < 12; i += 1) {
    const angle = -Math.PI * 0.74 + i * 0.14;
    const length = size * (0.26 + (i % 3) * 0.08);
    ctx.globalAlpha = rise * (0.18 + i * 0.012);
    ctx.strokeStyle = i % 2 ? "rgba(218,255,250,.38)" : "rgba(95,201,218,.22)";
    ctx.lineWidth = 2 + (i % 4);
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * size * 0.28, y + Math.sin(angle) * size * 0.18);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * size * 0.42,
      y + Math.sin(angle) * size * 0.1 - size * 0.12,
      x + Math.cos(angle) * (size * 0.3 + length),
      y + Math.sin(angle) * (size * 0.15 + length)
    );
    ctx.stroke();
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.68 * rise;
  ctx.translate(x - size * 0.16, y - size * 0.02);
  ctx.rotate(-0.22 - rise * 0.18);
  const shark = ctx.createLinearGradient(-size * 1.12, -size * 0.35, size * 1.12, size * 0.35);
  shark.addColorStop(0, "rgba(7, 26, 35, .94)");
  shark.addColorStop(0.45, "rgba(29, 82, 97, .92)");
  shark.addColorStop(0.72, "rgba(95, 151, 159, .84)");
  shark.addColorStop(1, "rgba(11, 42, 54, .95)");
  ctx.fillStyle = shark;
  ctx.beginPath();
  ctx.moveTo(size * 1.08, -size * 0.03);
  ctx.bezierCurveTo(size * 0.72, -size * 0.38, -size * 0.18, -size * 0.4, -size * 0.92, -size * 0.18);
  ctx.bezierCurveTo(-size * 1.14, -size * 0.12, -size * 1.18, size * 0.1, -size * 0.94, size * 0.18);
  ctx.bezierCurveTo(-size * 0.12, size * 0.42, size * 0.72, size * 0.26, size * 1.08, -size * 0.03);
  ctx.fill();

  ctx.fillStyle = "rgba(5, 22, 30, .86)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.96, -size * 0.08);
  ctx.lineTo(-size * 1.42, -size * 0.46);
  ctx.lineTo(-size * 1.26, -size * 0.04);
  ctx.lineTo(-size * 1.42, size * 0.34);
  ctx.lineTo(-size * 0.96, size * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "rgba(9, 38, 49, .9)";
  ctx.beginPath();
  ctx.moveTo(-size * 0.18, -size * 0.34);
  ctx.lineTo(size * 0.08, -size * 0.74);
  ctx.lineTo(size * 0.18, -size * 0.26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(size * 0.1, size * 0.24);
  ctx.lineTo(size * 0.42, size * 0.56);
  ctx.lineTo(size * 0.22, size * 0.12);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.7 * rise;
  ctx.fillStyle = "rgba(2, 14, 20, .82)";
  ctx.beginPath();
  ctx.moveTo(size * 0.72, size * 0.06);
  ctx.quadraticCurveTo(size * 0.9, size * 0.14, size * 1.05, -size * 0.01);
  ctx.quadraticCurveTo(size * 0.86, size * 0.22, size * 0.58, size * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.78 * rise;
  ctx.fillStyle = "rgba(255,255,245,.78)";
  for (let i = 0; i < 6; i += 1) {
    const tx = size * (0.64 + i * 0.054);
    ctx.beginPath();
    ctx.moveTo(tx, size * 0.09);
    ctx.lineTo(tx + size * 0.025, size * 0.18);
    ctx.lineTo(tx - size * 0.02, size * 0.17);
    ctx.closePath();
    ctx.fill();
  }

  ctx.globalAlpha = 0.55 * rise;
  ctx.strokeStyle = "rgba(201, 244, 241, .42)";
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(size * (0.38 + i * 0.045), -size * 0.15);
    ctx.lineTo(size * (0.34 + i * 0.045), size * 0.1);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(222,255,248,.8)";
  ctx.beginPath();
  ctx.arc(size * 0.62, -size * 0.14, size * 0.026, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.28 * rise;
  fillRadial(ctx, x, y - size * 0.08, size * 0.04, size * 0.72, [
    [0, "rgba(151,250,255,.56)"],
    [0.46, "rgba(63,187,205,.16)"],
    [1, "rgba(63,187,205,0)"]
  ]);
  ctx.restore();
}

function drawCaitlynScene(ctx, width, height, t) {
  const lock = easeInOutCubic(clamp(t / 0.48, 0, 1));
  const shot = easeOutCubic(clamp((t - 0.42) / 0.18, 0, 1));
  const cx = width * 0.5;
  const cy = height * 0.5;
  const radius = Math.min(width, height) * (0.34 + lock * 0.08);

  ctx.save();
  ctx.fillStyle = `rgba(9, 8, 11, ${0.16 + lock * 0.24})`;
  ctx.fillRect(0, 0, width, height);
  drawAtmosphericDust(ctx, width, height, t, "rgba(255, 226, 151, .38)", 28, lock);
  ctx.strokeStyle = "rgba(255, 229, 150, .82)";
  ctx.lineWidth = Math.max(1.5, width * 0.002);
  for (let i = 0; i < 3; i += 1) {
    ctx.globalAlpha = (0.62 - i * 0.14) * lock;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * (1 + i * 0.24), 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let index = 0; index < 48; index += 1) {
    const angle = (index / 48) * Math.PI * 2;
    const inner = radius * (0.94 + (index % 4 === 0 ? 0.08 : 0.02));
    const outer = radius * (1.02 + (index % 4 === 0 ? 0.16 : 0.08));
    ctx.globalAlpha = lock * (index % 4 === 0 ? 0.5 : 0.22);
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
    ctx.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
    ctx.stroke();
  }
  drawArcRibbon(ctx, cx, cy, radius * 1.42, Math.PI * 1.1, Math.PI * 1.86, 2, "rgba(255, 248, 205, .74)", lock * 0.5);
  drawArcRibbon(ctx, cx, cy, radius * 0.62, Math.PI * -0.12, Math.PI * 0.62, 3, "rgba(129, 226, 214, .44)", lock * 0.38);
  ctx.globalAlpha = lock;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 1.35, cy);
  ctx.lineTo(cx - radius * 0.18, cy);
  ctx.moveTo(cx + radius * 0.18, cy);
  ctx.lineTo(cx + radius * 1.35, cy);
  ctx.moveTo(cx, cy - radius * 1.35);
  ctx.lineTo(cx, cy - radius * 0.18);
  ctx.moveTo(cx, cy + radius * 0.18);
  ctx.lineTo(cx, cy + radius * 1.35);
  ctx.stroke();

  if (shot > 0) {
    ctx.globalAlpha = 0.96 * (1 - clamp((t - 0.62) / 0.4, 0, 1));
    ctx.strokeStyle = "rgba(255, 251, 230, .98)";
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.beginPath();
    ctx.moveTo(width * (-0.15 + shot * 0.38), height * 0.18);
    ctx.lineTo(cx, cy);
    ctx.stroke();
    fillRadial(ctx, cx, cy, 0, radius * (0.12 + shot * 0.36), [
      [0, "rgba(255,252,232,.95)"],
      [0.25, "rgba(255,211,113,.55)"],
      [1, "rgba(255,211,113,0)"]
    ]);
    drawCracks(ctx, cx, cy, radius * 1.2, 12, shot, "rgba(255,246,218,.48)");
    drawCracks(ctx, cx, cy, radius * 0.7, 7, shot, "rgba(104,221,212,.34)");
  }
  ctx.restore();
}

function drawEzrealScene(ctx, width, height, t) {
  const travel = easeInOutCubic(clamp((t - 0.04) / 0.78, 0, 1));
  const x = width * (-0.18 + travel * 1.48);
  const y = height * (1.08 - travel * 1.16);
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(96, 214, 255, .42)", 44, 0.9);
  ctx.globalCompositeOperation = "screen";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawArcRibbon(ctx, width * 0.08, height * 0.88, Math.min(width, height) * 0.18, -0.8, 1.2, 2.5, "rgba(255, 230, 132, .44)", 0.55);
  drawArcRibbon(ctx, width * 0.08, height * 0.88, Math.min(width, height) * 0.25, -0.6, 1.0, 1.8, "rgba(83, 225, 255, .42)", 0.48);
  for (let i = 0; i < 9; i += 1) {
    const back = i * 44 * (width / 1280 + 0.55);
    ctx.globalAlpha = 0.12 + (9 - i) * 0.045;
    ctx.strokeStyle = i % 2 ? "rgba(93,214,255,.75)" : "rgba(255,224,117,.62)";
    ctx.lineWidth = 6 + i * 3.8;
    ctx.shadowColor = i % 2 ? "rgba(95, 224, 255, .48)" : "rgba(255, 229, 130, .4)";
    ctx.shadowBlur = 16 + i * 3;
    ctx.beginPath();
    ctx.moveTo(x - back, y + back * 0.7);
    ctx.bezierCurveTo(
      x - back - width * 0.14,
      y + back * 0.7 + height * 0.05 + Math.sin(i + t * 8) * 16,
      x - back - width * 0.28,
      y + back * 0.7 + height * 0.2,
      x - back - width * 0.42,
      y + back * 0.7 + height * 0.34
    );
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  fillRadial(ctx, x, y, 0, Math.min(width, height) * 0.22, [
    [0, "rgba(255,252,232,1)"],
    [0.18, "rgba(111,225,255,.82)"],
    [0.56, "rgba(96,106,255,.26)"],
    [1, "rgba(96,106,255,0)"]
  ]);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.7);
  const headGradient = ctx.createLinearGradient(-72, 0, 96, 0);
  headGradient.addColorStop(0, "rgba(86, 195, 255, 0)");
  headGradient.addColorStop(0.46, "rgba(88, 222, 255, .62)");
  headGradient.addColorStop(0.72, "rgba(255, 247, 203, .98)");
  headGradient.addColorStop(1, "rgba(255, 255, 255, .88)");
  ctx.fillStyle = headGradient;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.moveTo(106, 0);
  ctx.bezierCurveTo(42, -36, -44, -30, -84, 0);
  ctx.bezierCurveTo(-42, 30, 42, 36, 106, 0);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 0.58;
  ctx.strokeStyle = "rgba(255, 245, 185, .72)";
  ctx.lineWidth = 1.6;
  for (let index = 0; index < 5; index += 1) {
    const offset = index * 42;
    ctx.save();
    ctx.translate(x - offset * 0.45, y + offset * 0.34);
    ctx.rotate(-0.72);
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(22, 0);
    ctx.lineTo(0, 22);
    ctx.lineTo(-22, 0);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function drawSamiraScene(ctx, width, height, t) {
  const p = easeOutCubic(clamp(t / 0.72, 0, 1));
  const cx = width * 0.5;
  const cy = height * 0.52;
  const r = Math.min(width, height) * (0.24 + p * 0.16);
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(255, 102, 146, .36)", 42, 0.95);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 10; i += 1) {
    const a = t * 10 + i * 0.63;
    const x = cx + Math.cos(a) * r * (1 + i * 0.018);
    const y = cy + Math.sin(a) * r * 0.62;
    ctx.strokeStyle = i % 2 ? "rgba(255,200,104,.76)" : "rgba(255,92,151,.7)";
    ctx.lineWidth = 2.2 + i * 0.16;
    ctx.beginPath();
    ctx.moveTo(x - Math.cos(a) * 80, y - Math.sin(a) * 44);
    ctx.lineTo(x + Math.cos(a) * 120, y + Math.sin(a) * 60);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.82 * p;
  ctx.strokeStyle = "rgba(255,249,226,.9)";
  ctx.lineWidth = Math.max(4, width * 0.006);
  ctx.beginPath();
  ctx.moveTo(width * 0.16, height * 0.3);
  ctx.bezierCurveTo(width * 0.34, height * 0.2, width * 0.66, height * 0.82, width * 0.86, height * 0.68);
  ctx.stroke();
  for (let index = 0; index < 14; index += 1) {
    const a = t * 8 + index * 0.45;
    const bx = cx + Math.cos(a) * r * 0.9;
    const by = cy + Math.sin(a) * r * 0.52;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(a + Math.PI * 0.5);
    ctx.globalAlpha = 0.28 + (index % 3) * 0.08;
    ctx.fillStyle = index % 2 ? "rgba(255, 232, 160, .66)" : "rgba(255, 72, 132, .52)";
    ctx.fillRect(-3, -18, 6, 36);
    ctx.restore();
  }
  ctx.restore();
}

function drawKaisaScene(ctx, width, height, t) {
  const open = easeInOutCubic(clamp(t / 0.68, 0, 1));
  const cx = width * 0.5;
  const cy = height * 0.48;
  const size = Math.min(width, height) * (0.18 + open * 0.38);
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(241, 112, 232, .4)", 40, 0.9);
  ctx.globalCompositeOperation = "screen";
  ctx.translate(cx, cy);
  ctx.rotate((t * 2.4 + 0.4) * Math.PI);
  const gradient = ctx.createLinearGradient(-size, -size, size, size);
  gradient.addColorStop(0, "rgba(255,123,230,.84)");
  gradient.addColorStop(0.5, "rgba(118,129,255,.58)");
  gradient.addColorStop(1, "rgba(104,242,224,.64)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.42, -size * 0.16);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.42, size * 0.16);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.42, size * 0.16);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.42, -size * 0.16);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let index = 0; index < 4; index += 1) {
    ctx.globalAlpha = 0.22 + index * 0.06;
    ctx.strokeStyle = index % 2 ? "rgba(255,132,235,.54)" : "rgba(95,244,224,.44)";
    ctx.lineWidth = 3 + index * 1.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy, size * (0.8 + index * 0.2), size * (0.24 + index * 0.09), t * 3 + index * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  drawShardField(ctx, width, height, t, "rgba(255, 140, 241, .34)", 14, 1);
  for (let i = 0; i < 6; i += 1) {
    const a = -0.8 + i * 0.32;
    const x = width * (0.05 + open * 0.7) + i * width * 0.035;
    const y = height * (0.78 - i * 0.1);
    ctx.strokeStyle = i % 2 ? "rgba(245,120,224,.54)" : "rgba(97,233,220,.48)";
    ctx.lineWidth = 8 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(x - 260, y + 180);
    ctx.lineTo(x + Math.cos(a) * width * 0.7, y + Math.sin(a) * height * 0.6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawMissFortuneScene(ctx, width, height, t) {
  const fire = easeOutCubic(clamp((t - 0.1) / 0.62, 0, 1));
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(255, 190, 126, .38)", 34, 0.85);
  ctx.globalCompositeOperation = "screen";
  [["rgba(255,193,87,.72)", width * 0.28], ["rgba(238,79,108,.66)", width * 0.72]].forEach(([color, x], index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, height * 0.92);
    ctx.lineTo(width * (index ? 1.08 : -0.08), height * (0.36 - fire * 0.16));
    ctx.lineTo(width * (index ? 0.58 : 0.42), height * (0.46 - fire * 0.08));
    ctx.closePath();
    ctx.fill();
  });
  for (let i = 0; i < 20; i += 1) {
    const x = width * (0.1 + ((i * 41) % 80) / 100);
    const y = height * (0.2 + ((i * 23) % 70) / 100);
    ctx.strokeStyle = "rgba(255,244,204,.54)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (i % 2 ? 80 : -80), y - 140 * fire);
    ctx.stroke();
  }
  for (let index = 0; index < 12; index += 1) {
    const x = width * (0.18 + seededUnit(index, 2) * 0.64);
    const y = height * (0.24 + seededUnit(index, 3) * 0.44 + fire * 0.08);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.9 + seededUnit(index, 5) * 0.8);
    ctx.globalAlpha = 0.18 + seededUnit(index, 6) * 0.18;
    ctx.fillStyle = "rgba(255, 231, 168, .72)";
    ctx.fillRect(-4, -14, 8, 28);
    ctx.restore();
  }
  ctx.restore();
}

function drawJhinScene(ctx, width, height, t) {
  const p = easeInOutCubic(clamp(t / 0.74, 0, 1));
  const cx = width * 0.5;
  const cy = height * 0.5;
  ctx.save();
  ctx.fillStyle = `rgba(22, 12, 18, ${0.34 + p * 0.32})`;
  ctx.fillRect(0, 0, width, height);
  drawAtmosphericDust(ctx, width, height, t, "rgba(201, 77, 118, .36)", 34, 0.75);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i += 1) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(i * Math.PI * 0.5 + p * 0.7);
    const grd = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(width, height) * 0.32);
    grd.addColorStop(0, "rgba(255,236,190,.46)");
    grd.addColorStop(1, "rgba(187,43,84,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, -Math.min(width, height) * 0.16, Math.min(width, height) * 0.08, Math.min(width, height) * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  if (t > 0.48) {
    ctx.globalAlpha = 0.9 * (1 - clamp((t - 0.76) / 0.24, 0, 1));
    ctx.strokeStyle = "rgba(255,248,218,.95)";
    ctx.lineWidth = Math.max(3, width * 0.004);
    ctx.beginPath();
    ctx.moveTo(width * 0.08, height * 0.5);
    ctx.lineTo(width * 0.92, height * 0.5);
    ctx.stroke();
  }
  for (let index = 0; index < 16; index += 1) {
    const a = index * 0.9 + p * 2;
    const px = cx + Math.cos(a) * Math.min(width, height) * (0.12 + seededUnit(index, 2) * 0.34);
    const py = cy + Math.sin(a) * Math.min(width, height) * (0.08 + seededUnit(index, 3) * 0.22);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(a);
    ctx.globalAlpha = 0.18 + seededUnit(index, 8) * 0.24;
    ctx.fillStyle = index % 2 ? "rgba(188, 47, 91, .6)" : "rgba(255, 218, 171, .5)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 8 + seededUnit(index, 7) * 10, 22 + seededUnit(index, 9) * 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawAsheScene(ctx, width, height, t) {
  const travel = easeInOutCubic(clamp((t - 0.04) / 0.74, 0, 1));
  const x = width * (-0.2 + travel * 1.42);
  const y = height * (0.6 - travel * 0.18);
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(180, 239, 255, .42)", 52, 0.95);
  drawShardField(ctx, width, height, t, "rgba(210, 246, 255, .34)", 18, -1);
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = "rgba(183,240,255,.6)";
  ctx.lineWidth = Math.max(18, width * 0.02);
  ctx.beginPath();
  ctx.moveTo(x - width * 0.56, y + 46);
  ctx.lineTo(x, y);
  ctx.stroke();
  ctx.fillStyle = "rgba(239,252,255,.94)";
  ctx.beginPath();
  ctx.moveTo(x + 90, y);
  ctx.lineTo(x - 44, y - 46);
  ctx.lineTo(x - 18, y);
  ctx.lineTo(x - 44, y + 46);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 8; i += 1) {
    ctx.strokeStyle = "rgba(135,189,255,.42)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(x - i * 45, y + (i % 2 ? 50 : -44));
    ctx.lineTo(x - i * 72 - 60, y + (i % 2 ? 86 : -82));
    ctx.stroke();
  }
  for (let index = 0; index < 7; index += 1) {
    ctx.globalAlpha = 0.18 + index * 0.035;
    ctx.strokeStyle = "rgba(255, 255, 255, .64)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(x - index * 52, y, 20 + index * 12, -0.7, 0.7);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRammusScene(ctx, width, height, t) {
  const roll = easeInOutCubic(clamp(t / 0.76, 0, 1));
  const x = width * (-0.1 + roll * 1.08);
  const y = height * 0.72;
  const r = Math.min(width, height) * 0.13;
  ctx.save();
  drawAtmosphericDust(ctx, width, height, t, "rgba(255, 216, 105, .34)", 42, 0.88);
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i += 1) {
    ctx.globalAlpha = 0.35 * (1 - i * 0.14);
    ctx.strokeStyle = i % 2 ? "rgba(255,216,92,.7)" : "rgba(174,222,88,.72)";
    ctx.lineWidth = 6 - i;
    ctx.beginPath();
    ctx.ellipse(x, y, r * (1 + i * 0.9 + roll), r * 0.42 * (1 + i * 0.7 + roll), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.92;
  const shell = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 1.2);
  shell.addColorStop(0, "rgba(255,236,132,.96)");
  shell.addColorStop(0.45, "rgba(138,183,67,.82)");
  shell.addColorStop(1, "rgba(34,57,28,.88)");
  ctx.fillStyle = shell;
  ctx.beginPath();
  ctx.arc(x, y - r * 0.2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 245, 172, .62)";
  ctx.lineWidth = 2.2;
  for (let index = 0; index < 7; index += 1) {
    const a = t * 8 + index * 0.9;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(a) * r * 0.2, y - r * 0.2 + Math.sin(a) * r * 0.2);
    ctx.lineTo(x + Math.cos(a) * r * 0.88, y - r * 0.2 + Math.sin(a) * r * 0.88);
    ctx.stroke();
  }
  drawCracks(ctx, x, y + r * 0.7, r * 2.3, 9, roll, "rgba(255,239,166,.34)");
  ctx.restore();
}

function drawUltimateFrame(ctx, profileId, image, width, height, elapsed) {
  const t = clamp(elapsed / 2100, 0, 1);
  ctx.clearRect(0, 0, width, height);
  drawCoverImage(ctx, image, width, height, 0.16 * (1 - t * 0.24), 1.12, Math.sin(t * 4) * 16, Math.cos(t * 3) * 8);
  ctx.save();
  ctx.fillStyle = `rgba(250, 246, 236, ${0.035 * (1 - t)})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  if (profileId === "fizz") drawSharkScene(ctx, width, height, t);
  else if (profileId === "caitlyn") drawCaitlynScene(ctx, width, height, t);
  else if (profileId === "ezreal") drawEzrealScene(ctx, width, height, t);
  else if (profileId === "samira") drawSamiraScene(ctx, width, height, t);
  else if (profileId === "kaisa") drawKaisaScene(ctx, width, height, t);
  else if (profileId === "missfortune") drawMissFortuneScene(ctx, width, height, t);
  else if (profileId === "jhin") drawJhinScene(ctx, width, height, t);
  else if (profileId === "ashe") drawAsheScene(ctx, width, height, t);
  else if (profileId === "rammus") drawRammusScene(ctx, width, height, t);
  else drawEzrealScene(ctx, width, height, t);

  drawVignette(ctx, width, height, 0.28);
  drawLetterbox(ctx, width, height, 0.18 * Math.sin(Math.PI * clamp(t / 0.95, 0, 1)));
}

function spawnSelectionFx(button, profileId = "default") {
  if (motionQuery.matches || !page || !button) return;
  const profile = fxProfileFor(profileId);
  window.clearTimeout(fxTimer);
  document.querySelectorAll(".selection-fx").forEach((node) => {
    if (node._raf) cancelAnimationFrame(node._raf);
    node.remove();
  });

  const fx = document.createElement("div");
  const canvas = document.createElement("canvas");
  const image = button.querySelector("img");
  fx.className = "selection-fx ultimate-scene";
  fx.setAttribute("aria-hidden", "true");
  applyFxProfileVars(fx, profile);
  fx.append(canvas);
  document.body.append(fx);

  const context = canvas.getContext("2d");
  const startedAt = performance.now();
  const render = (now) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawUltimateFrame(context, profile.id, image, width, height, now - startedAt);
    if (now - startedAt < 2160) {
      fx._raf = requestAnimationFrame(render);
    }
  };
  fx._raf = requestAnimationFrame(render);
  fxTimer = window.setTimeout(() => {
    if (fx._raf) cancelAnimationFrame(fx._raf);
    fx.remove();
  }, 2320);
}

function animateChampionSwap(champion) {
  window.clearTimeout(swapTimer);
  window.clearTimeout(settleTimer);

  const panels = [championPanel, situationsSection];
  panels.forEach((panel) => {
    panel.setAttribute("aria-busy", "true");
    panel.classList.remove("is-entering");
    panel.classList.add("is-leaving");
  });

  const delay = motionQuery.matches ? 0 : 170;
  swapTimer = window.setTimeout(() => {
    writeChampion(champion);
    currentChampionId = champion.id;

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
    }, motionQuery.matches ? 0 : 560);
  }, delay);
}

function renderChampion(championId, options = {}) {
  const champion = champions.find((item) => item.id === championId) || champions[0];
  applyFxProfileVars(page, fxProfileFor(champion.id));
  setPressedChampion(champion.id);

  if (!options.animate || !currentChampionId || champion.id === currentChampionId) {
    writeChampion(champion);
    currentChampionId = champion.id;
    return;
  }

  animateChampionSwap(champion);
}

function renderPicker() {
  championPicker.replaceChildren(...champions.map((champion, index) => {
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
    button.append(img);
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
    button.addEventListener("click", () => {
      button.classList.remove("is-flashing");
      void button.offsetWidth;
      button.classList.add("is-flashing");
      playSelectSound(champion.id);
      playSelectionBurst(button, champion.id);
      spawnSelectionFx(button, champion.id);
      window.setTimeout(() => button.classList.remove("is-flashing"), 2080);
      renderChampion(champion.id, { animate: true });
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
renderChampion("samira", { animate: false });
hydratePublicNotes();
