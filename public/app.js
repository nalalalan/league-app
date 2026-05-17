const imageBase = "https://ddragon.leagueoflegends.com/cdn/img/champion/loading";

const defaultSoundProfile = {
  duration: 1.58,
  volume: 0.66,
  masterPeak: 0.22,
  masterTail: 0.14,
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
  { kind: "thump", frequency: 42, endFrequency: 24, start: 0, length: 0.32, gain: 0.48 },
  { kind: "noise", filter: "lowpass", start: 0.02, length: 0.58, startFrequency: 1400, endFrequency: 260, gain: 0.18 },
  { kind: "noise", filter: "highpass", start: 0.08, length: 0.24, startFrequency: 5200, endFrequency: 2600, gain: 0.12 }
];

const soundScenes = {
  samira: [
    { kind: "thump", frequency: 52, endFrequency: 28, start: 0, length: 0.22, gain: 0.54 },
    { kind: "noise", filter: "highpass", start: 0.02, length: 0.08, startFrequency: 9200, endFrequency: 3400, gain: 0.42, pan: -0.48 },
    { kind: "noise", filter: "highpass", start: 0.12, length: 0.09, startFrequency: 9600, endFrequency: 3800, gain: 0.38, pan: 0.46 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 0.28, startFrequency: 4800, endFrequency: 1400, gain: 0.22 },
    { kind: "noise", filter: "highpass", start: 0.34, length: 0.14, startFrequency: 8200, endFrequency: 5200, gain: 0.18, pan: -0.2 }
  ],
  caitlyn: [
    { kind: "noise", filter: "highpass", start: 0, length: 0.035, startFrequency: 6400, endFrequency: 6400, gain: 0.16 },
    { kind: "noise", filter: "highpass", start: 0.095, length: 0.045, startFrequency: 9800, endFrequency: 7400, gain: 0.62 },
    { kind: "thump", frequency: 70, endFrequency: 30, start: 0.095, length: 0.18, gain: 0.68 },
    { kind: "noise", filter: "bandpass", start: 0.15, length: 0.38, startFrequency: 5200, endFrequency: 680, gain: 0.16 },
    { kind: "noise", filter: "highpass", start: 0.32, length: 0.16, startFrequency: 8600, endFrequency: 4800, gain: 0.08 }
  ],
  fizz: [
    { kind: "noise", filter: "bandpass", start: 0, length: 0.18, startFrequency: 420, endFrequency: 1800, gain: 0.22, pan: -0.24 },
    { kind: "thump", frequency: 92, endFrequency: 58, start: 0.06, length: 0.16, gain: 0.2 },
    { kind: "noise", filter: "bandpass", start: 0.2, length: 0.22, startFrequency: 760, endFrequency: 3200, gain: 0.24, pan: 0.32 },
    { kind: "noise", filter: "highpass", start: 0.42, length: 0.32, startFrequency: 5200, endFrequency: 2400, gain: 0.12 },
    { kind: "thump", frequency: 78, endFrequency: 48, start: 0.48, length: 0.18, gain: 0.14 }
  ],
  kaisa: [
    { kind: "thump", frequency: 44, endFrequency: 22, start: 0, length: 0.5, gain: 0.58 },
    { kind: "noise", filter: "bandpass", start: 0.04, length: 0.72, startFrequency: 6800, endFrequency: 520, gain: 0.26 },
    { kind: "noise", filter: "highpass", start: 0.18, length: 0.16, startFrequency: 10400, endFrequency: 7600, gain: 0.18, pan: -0.34 },
    { kind: "noise", filter: "highpass", start: 0.38, length: 0.16, startFrequency: 9800, endFrequency: 7200, gain: 0.16, pan: 0.34 },
    { kind: "noise", filter: "lowpass", start: 0.62, length: 0.34, startFrequency: 900, endFrequency: 280, gain: 0.18 }
  ],
  missfortune: [
    { kind: "noise", filter: "highpass", start: 0.02, length: 0.045, startFrequency: 9800, endFrequency: 6200, gain: 0.56, pan: -0.52 },
    { kind: "thump", frequency: 60, endFrequency: 28, start: 0.02, length: 0.18, gain: 0.58, pan: -0.22 },
    { kind: "noise", filter: "highpass", start: 0.19, length: 0.045, startFrequency: 9800, endFrequency: 6200, gain: 0.56, pan: 0.52 },
    { kind: "thump", frequency: 58, endFrequency: 26, start: 0.19, length: 0.18, gain: 0.62, pan: 0.22 },
    { kind: "noise", filter: "bandpass", start: 0.26, length: 0.42, startFrequency: 3200, endFrequency: 420, gain: 0.18 }
  ],
  ezreal: [
    { kind: "noise", filter: "bandpass", start: 0, length: 0.12, startFrequency: 3600, endFrequency: 8200, gain: 0.2, pan: -0.44 },
    { kind: "noise", filter: "bandpass", start: 0.12, length: 0.12, startFrequency: 4200, endFrequency: 9200, gain: 0.2, pan: 0.38 },
    { kind: "noise", filter: "bandpass", start: 0.25, length: 0.14, startFrequency: 5200, endFrequency: 10800, gain: 0.2, pan: -0.18 },
    { kind: "noise", filter: "highpass", start: 0.36, length: 0.3, startFrequency: 9200, endFrequency: 3600, gain: 0.16 },
    { kind: "thump", frequency: 72, endFrequency: 42, start: 0.42, length: 0.18, gain: 0.24 }
  ],
  jhin: [
    { kind: "noise", filter: "bandpass", start: 0, length: 0.04, startFrequency: 2400, endFrequency: 1800, gain: 0.16 },
    { kind: "noise", filter: "bandpass", start: 0.22, length: 0.04, startFrequency: 2400, endFrequency: 1800, gain: 0.16 },
    { kind: "noise", filter: "bandpass", start: 0.44, length: 0.04, startFrequency: 2400, endFrequency: 1800, gain: 0.16 },
    { kind: "noise", filter: "highpass", start: 0.72, length: 0.075, startFrequency: 7200, endFrequency: 4800, gain: 0.58 },
    { kind: "thump", frequency: 44, endFrequency: 20, start: 0.72, length: 0.44, gain: 0.76 },
    { kind: "noise", filter: "lowpass", start: 0.82, length: 0.64, startFrequency: 900, endFrequency: 180, gain: 0.2 }
  ],
  ashe: [
    { kind: "noise", filter: "highpass", start: 0, length: 0.42, startFrequency: 11000, endFrequency: 3600, gain: 0.16 },
    { kind: "noise", filter: "bandpass", start: 0.18, length: 0.22, startFrequency: 7200, endFrequency: 2200, gain: 0.28 },
    { kind: "thump", frequency: 66, endFrequency: 36, start: 0.24, length: 0.18, gain: 0.18 },
    { kind: "noise", filter: "highpass", start: 0.42, length: 0.22, startFrequency: 12200, endFrequency: 6800, gain: 0.22, pan: -0.2 },
    { kind: "noise", filter: "highpass", start: 0.54, length: 0.18, startFrequency: 11800, endFrequency: 6400, gain: 0.16, pan: 0.22 }
  ],
  rammus: [
    { kind: "thump", frequency: 34, endFrequency: 22, start: 0, length: 0.5, gain: 0.7 },
    { kind: "noise", filter: "lowpass", start: 0.04, length: 0.7, startFrequency: 1300, endFrequency: 180, gain: 0.3 },
    { kind: "thump", frequency: 46, endFrequency: 28, start: 0.36, length: 0.26, gain: 0.42 },
    { kind: "noise", filter: "bandpass", start: 0.58, length: 0.3, startFrequency: 900, endFrequency: 320, gain: 0.18 },
    { kind: "thump", frequency: 38, endFrequency: 24, start: 0.72, length: 0.22, gain: 0.3 }
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
const fallbackAudioUrls = {};
let burstTimer = 0;
let fxTimer = 0;

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
    if (event.kind === "noise") {
      const start = event.start || 0;
      const length = event.length || 0.2;
      if (time < start || time > start + length) return 0;
      const progress = (time - start) / length;
      const envelope = Math.sin(Math.PI * progress) ** 0.62;
      const filterTone = event.filter === "lowpass" ? 0.42 : event.filter === "highpass" ? 1 : 0.72;
      return (Math.random() * 2 - 1) * envelope * (event.gain || 0.12) * filterTone;
    }
    if (event.kind === "thump") {
      return toneSample(time, { ...event, type: "sine" });
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

function playSelectSound(profileId = "default") {
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
    const compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, now);
    compressor.knee.setValueAtTime(18, now);
    compressor.ratio.setValueAtTime(6, now);
    compressor.attack.setValueAtTime(0.004, now);
    compressor.release.setValueAtTime(0.16, now);
    compressor.connect(audioContext.destination);

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(profile.masterPeak || defaultSoundProfile.masterPeak, now + 0.014);
    master.gain.exponentialRampToValueAtTime(profile.masterTail || defaultSoundProfile.masterTail, now + Math.min(0.52, profile.duration * 0.42));
    master.gain.exponentialRampToValueAtTime(0.0001, now + profile.duration);
    master.connect(compressor);

    const playTone = (tone) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      let output = gain;
      osc.type = tone.type || "triangle";
      osc.frequency.setValueAtTime(tone.frequency, now + tone.start);
      if (tone.endFrequency) {
        osc.frequency.exponentialRampToValueAtTime(tone.endFrequency, now + tone.start + tone.length);
      }
      if (tone.detune) {
        osc.detune.setValueAtTime(tone.detune, now + tone.start);
      }
      gain.gain.setValueAtTime(0.0001, now + tone.start);
      gain.gain.exponentialRampToValueAtTime(tone.gain, now + tone.start + (tone.attack || 0.018));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.start + tone.length);
      osc.connect(gain);
      if (typeof tone.pan === "number" && audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(tone.pan, now + tone.start);
        output.connect(panner);
        output = panner;
      }
      output.connect(master);
      osc.start(now + tone.start);
      osc.stop(now + tone.start + tone.length + 0.04);
    };

    const playNoise = (event) => {
      const noiseBuffer = audioContext.createBuffer(1, Math.floor(audioContext.sampleRate * event.length), audioContext.sampleRate);
      const noiseData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseData.length; i += 1) {
        const progress = i / noiseData.length;
        const fade = Math.sin(Math.PI * progress) ** 0.7;
        noiseData[i] = (Math.random() * 2 - 1) * fade;
      }
      const noise = audioContext.createBufferSource();
      const noiseFilter = audioContext.createBiquadFilter();
      const noiseGain = audioContext.createGain();
      let output = noiseGain;
      noise.buffer = noiseBuffer;
      noiseFilter.type = event.filter || "bandpass";
      noiseFilter.frequency.setValueAtTime(event.startFrequency || 4800, now + event.start);
      noiseFilter.frequency.exponentialRampToValueAtTime(event.endFrequency || 520, now + event.start + event.length);
      noiseFilter.Q.setValueAtTime(event.q || 0.78, now);
      noiseGain.gain.setValueAtTime(0.0001, now + event.start);
      noiseGain.gain.exponentialRampToValueAtTime(event.gain || 0.12, now + event.start + 0.018);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + event.start + event.length);
      noise.connect(noiseFilter).connect(noiseGain);
      if (typeof event.pan === "number" && audioContext.createStereoPanner) {
        const panner = audioContext.createStereoPanner();
        panner.pan.setValueAtTime(event.pan, now + event.start);
        output.connect(panner);
        output = panner;
      }
      output.connect(master);
      noise.start(now + event.start);
      noise.stop(now + event.start + event.length + 0.04);
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

    scene.forEach((event) => {
      if (event.kind === "noise") {
        playNoise(event);
      } else if (event.kind === "thump") {
        playThump(event);
      } else {
        playTone(event);
      }
    });
  } catch {
    playFallbackSelectSound(profileId);
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
  }, 2080);
}

function spawnSelectionFx(button, profileId = "default") {
  if (motionQuery.matches || !page || !button) return;
  const profile = fxProfileFor(profileId);
  window.clearTimeout(fxTimer);
  document.querySelectorAll(".selection-fx").forEach((node) => node.remove());

  const { x: centerX, y: centerY } = fxCenterFor(button);
  const fx = document.createElement("div");
  fx.className = "selection-fx";
  fx.setAttribute("aria-hidden", "true");
  fx.style.setProperty("--fx-x", `${centerX}px`);
  fx.style.setProperty("--fx-y", `${centerY}px`);
  applyFxProfileVars(fx, profile);

  (profile.glyphs || defaultFxProfile.glyphs).forEach((name, index) => {
    const glyph = document.createElement("span");
    glyph.className = `fx-glyph fx-glyph-${name}`;
    glyph.style.setProperty("--glyph-index", index);
    glyph.style.setProperty("--glyph-delay", `${index * 72}ms`);
    fx.append(glyph);
  });

  document.body.append(fx);
  fxTimer = window.setTimeout(() => fx.remove(), 2260);
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
