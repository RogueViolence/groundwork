import { useState, useEffect } from "react";
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, StatusBar, Modal, Dimensions, Animated
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const SW = Dimensions.get("window").width;

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  bg: "#0d1117", surface: "#111820", surfaceAlt: "#161e28",
  border: "#1e2d3d", accent: "#c8922a", accentDim: "#8a6218",
  accentGlow: "rgba(200,146,42,0.15)", text: "#e8e4dc",
  textMuted: "#7a8290", textDim: "#4a5260",
  safe: "#2e6b4f", safeGlow: "rgba(46,107,79,0.15)", white: "#ffffff",
};

// Write in the Rain notebook palette
const WITR = {
  bg: "#f5f0e0",
  bgDark: "#ede8d4",
  grid: "rgba(100,120,140,0.18)",
  ink: "#1a2030",
  inkMuted: "#4a5568",
  border: "#c8b88a",
  borderFocus: "#8a6218",
  label: "#6b5a3a",
};

// Inject topo background on web
if (typeof document !== "undefined") {
  const topoSvg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><defs><style>.c{fill:none;stroke:rgba(100,160,180,0.07);stroke-width:1}</style></defs><ellipse class='c' cx='200' cy='200' rx='180' ry='120'/><ellipse class='c' cx='200' cy='200' rx='150' ry='95'/><ellipse class='c' cx='200' cy='200' rx='120' ry='72'/><ellipse class='c' cx='200' cy='200' rx='90' ry='52'/><ellipse class='c' cx='200' cy='200' rx='60' ry='34'/><ellipse class='c' cx='60' cy='320' rx='140' ry='90'/><ellipse class='c' cx='60' cy='320' rx='110' ry='68'/><ellipse class='c' cx='60' cy='320' rx='80' ry='48'/><ellipse class='c' cx='340' cy='80' rx='120' ry='80'/><ellipse class='c' cx='340' cy='80' rx='90' ry='58'/><ellipse class='c' cx='340' cy='80' rx='60' ry='36'/><ellipse class='c' cx='100' cy='60' rx='90' ry='55'/><ellipse class='c' cx='100' cy='60' rx='65' ry='38'/><ellipse class='c' cx='320' cy='340' rx='100' ry='65'/><ellipse class='c' cx='320' cy='340' rx='72' ry='46'/></svg>`;
  const encoded = encodeURIComponent(topoSvg);
  const style = document.createElement("style");
  style.textContent = `body,[data-reactroot],#root{background-color:#0d1117!important;background-image:url("data:image/svg+xml,${encoded}")!important;background-repeat:repeat!important;background-size:400px 400px!important;}`;
  document.head.appendChild(style);
}

// ─── MODULES ──────────────────────────────────────────────────────────────────
const EQ_RANKS=[
  {rank:"E-1",title:"Recruit",track:"enlisted",xpRequired:0,msceit:"Perceiving",description:"Identifying emotion in others"},
  {rank:"E-2",title:"Specialist",track:"enlisted",xpRequired:500,msceit:"Using",description:"Applying emotion under pressure"},
  {rank:"E-3",title:"Technician",track:"enlisted",xpRequired:1200,msceit:"Understanding",description:"Reading emotional patterns"},
  {rank:"E-4",title:"Operator",track:"enlisted",xpRequired:2400,msceit:"Managing",description:"Managing self, reading your team"},
  {rank:"O-1",title:"Leader",track:"officer",xpRequired:4000,msceit:"Integration",description:"All six ACT processes integrated"},
  {rank:"O-2",title:"Commander",track:"officer",xpRequired:6500,msceit:"Application",description:"EQ in unit and leadership contexts"},
  {rank:"O-3",title:"General",track:"officer",xpRequired:10000,msceit:"Systemic",description:"Organizational and cultural influence"},
  {rank:"O-4",title:"Director",track:"officer",xpRequired:15000,msceit:"Certified",description:"Verified MSCEIT credential"},
];
function getRank(xp){let r=EQ_RANKS[0];for(const e of EQ_RANKS){if(xp>=e.xpRequired)r=e;else break;}return r;}
function getNextRank(xp){for(const e of EQ_RANKS){if(xp<e.xpRequired)return e;}return null;}
function getRankProgress(xp){const r=getRank(xp);const n=getNextRank(xp);if(!n)return 1;return(xp-r.xpRequired)/(n.xpRequired-r.xpRequired);}
const MODULES = [
  { id: "values", label: "GROUNDWORK", sublabel: "Values Identification", icon: "◈", tag: "ACT · Values", msceit: "Branch 4", locked: false },
  { id: "present", label: "SECTOR SCAN", sublabel: "Present-Moment Awareness", icon: "◎", tag: "ACT · Contact with Now", msceit: "Branch 1", locked: false },
  { id: "defusion", label: "NOISE REDUCTION", sublabel: "Cognitive Defusion", icon: "⊘", tag: "ACT · Defusion", msceit: "Branch 2", locked: false },
  { id: "acceptance", label: "HOLD POSITION", sublabel: "Acceptance", icon: "⬡", tag: "ACT · Acceptance", msceit: "Branch 3", locked: true },
  { id: "self", label: "OBSERVER POST", sublabel: "Self-as-Context", icon: "◉", tag: "ACT · Self-as-Context", msceit: "Branch 3", locked: true },
  { id: "action", label: "EXECUTE", sublabel: "Committed Action", icon: "▲", tag: "ACT · Committed Action", msceit: "Branch 4", locked: true },
];

// ─── SKELETON DATA ────────────────────────────────────────────────────────────
const SKELETON_DATA = {
  present: {
    hook: "You already read rooms. You already scan for threat. This is the same skill — turned inward.",
    clinical: "Present-moment awareness is the foundation of psychological flexibility. For infantry, attentional control is already trained — this module redirects that skill toward internal and interpersonal cues.",
    stages: [
      { stage: "Stage 1 — Read the Room", format: "Multiple choice", description: "Short video clips of faces, unit interactions, high-stress environments. Task: identify what's happening emotionally in the scene. Framed as situational awareness — reading your team, reading the room.", sample: { type: "mc", prompt: "Watch the clip. What's actually going on with this Marine?", context: "[Clip: team leader after a vehicle rollover, no casualties. He's quiet, jaw set, not engaging the debrief.]", options: [{ id: "a", text: "He's pissed at someone on the team" }, { id: "b", text: "He's processing — running it back in his head" }, { id: "c", text: "He's fine. Just focused." }, { id: "d", text: "He's scared it'll happen again" }], correct: "b", feedback: "Processing after a close call isn't weakness. It's your brain doing its job. The ones who skip this step carry it longer." } },
      { stage: "Stage 2 — Read Your Team", format: "Fill in the blank", description: "Vignettes shift to interpersonal unit dynamics. User identifies emotional subtext in conversations between Marines.", sample: { type: "fill", prompt: "Your boot snapped at you twice during comms check. Yesterday he was solid. Complete this:", template: "Something's off. My read is that he's ___, and I know because ___.", placeholder: "carrying something he hasn't said out loud..." } },
      { stage: "Stage 3 — Read Yourself", format: "Fill in the blank", description: "First-person present moment. Language stays behavioral and physical before becoming emotional.", sample: { type: "fill", prompt: "Right now, in this moment — not yesterday, not tomorrow:", template: "My body feels ___. My mind keeps going to ___. If I'm being straight, I'm probably ___.", placeholder: "tight across the shoulders..." } },
    ]
  },
  defusion: {
    hook: "Your mind generates noise under pressure. Always has. The mission is learning to identify the signal.",
    clinical: "Cognitive defusion separates the observing self from the content of thoughts. In combat, Marines are trained to call out when someone keys up and transmits unintelligible noise instead of signal. Under stress, the mind does the same thing. Defusion is clearing the net.",
    stages: [
      { stage: "Stage 1 — Name the Noise", format: "Multiple choice", description: "Vignettes present common high-pressure thought spirals. User identifies which pattern is running — without being asked to challenge it yet.", sample: { type: "mc", prompt: "A Marine misses a qualifying shot. On the drive back his mind is running. Which pattern is this?", context: '"If I can\'t perform under pressure, I\'m a liability. Everyone saw it. They\'re going to start wondering if they can count on me."', options: [{ id: "a", text: "Threat assessment — real feedback worth acting on" }, { id: "b", text: "Noise — his mind is predicting futures that haven't happened" }, { id: "c", text: "Motivation — this keeps standards high" }, { id: "d", text: "Not sure — could go either way" }], correct: "b", feedback: "One bad qual doesn't make you a liability. His mind ran straight to worst-case. That's not intel — that's noise. The skill is knowing the difference before you act on it." } },
      { stage: "Stage 2 — Label and Separate", format: "Fill in the blank", description: "User practices the core defusion move: labeling the thought as a thought, not a fact. Clearing the net.", sample: { type: "fill", prompt: "Take a thought your mind runs when things go wrong. Reframe it:", template: "Instead of that thought as fact, complete this: my mind is running the story that ___.", placeholder: "I let them down → my mind is running the story that I let them down" } },
      { stage: "Stage 3 — Signal vs. Noise", format: "Sentence construction", description: "User constructs the full defusion sequence: identify the thought, label it, assess what's actually true, name any real action warranted.", sample: { type: "fill", prompt: "Full rep. Own it.", template: "My mind is running ___. That's noise, not intel. What's actually true is ___. What I can do is ___.", placeholder: "the story that I'm not who I used to be..." } },
    ]
  },
  acceptance: {
    hook: "In the field, you train to eliminate error. As a human, error is the baseline. These are two different operating environments.",
    clinical: "The module opens with an explicit line that is non-negotiable: In combat, you run your training. Full stop. This module is for everything else — home, the bar, the drive back, the conversation that goes sideways. Accepting human fallibility is a completely separate operating environment from combat performance standards.",
    stages: [
      { stage: "Stage 1 — Two Operating Environments", format: "Multiple choice", description: "Vignettes present scenarios where a Marine applies combat-performance standards to human situations — and it costs him. User identifies the mismatch.", sample: { type: "mc", prompt: "A team leader snaps at his wife for being 'inefficient' during a family emergency. She shuts down. He doubles down. What's happening?", context: "", options: [{ id: "a", text: "He's right — she needs to get it together" }, { id: "b", text: "He's running combat standards in a civilian environment" }, { id: "c", text: "This is just how he communicates under stress" }, { id: "d", text: "She's being too sensitive" }], correct: "b", feedback: "Combat standards keep people alive downrange. In everything else, they corrode the mission. The skill is knowing which environment you're actually in." } },
      { stage: "Stage 2 — The Flaw Is Not the Failure", format: "Fill in the blank", description: "User applies the core acceptance principle to a personal scenario. Mistakes and flaws are human baseline — not evidence of fundamental failure.", sample: { type: "fill", prompt: "Think of something you did — not in the field, in life — that you haven't let go of:", template: "I made a mistake when I ___. I've been treating that like it means ___. What it actually means is ___.", placeholder: "went dark and didn't reach out for months..." } },
      { stage: "Stage 3 — Move Through It", format: "Sentence construction", description: "User constructs the full acceptance move: acknowledge the flaw, separate it from identity, identify forward motion.", sample: { type: "fill", prompt: "Full rep:", template: "I ___. It doesn't mean I'm ___. It means I'm human. I can ___.", placeholder: "lost my temper with my kid..." } },
    ]
  },
  self: {
    hook: "You wouldn't talk to a struggling Marine the way you talk to yourself. That gap is the work.",
    clinical: "The friend reframe is the clinical engine of this module. It is other-oriented before it becomes self-directed — a deliberate sequencing decision that lowers threat level. The After Action Review (AAR) establishes the observer perspective using familiar operational language, before the user turns that same objectivity inward.",
    stages: [
      { stage: "Stage 1 — The AAR Perspective", format: "Multiple choice", description: "After Action Review framing: user observes a scenario involving another Marine and assesses with the objectivity they'd bring to an operational debrief.", sample: { type: "mc", prompt: "A Marine in your unit is struggling after his second deployment. Not sleeping, pulling away, going quiet. He tells you he thinks he's broken. What do you tell him?", context: "", options: [{ id: "a", text: "Square it away. Everyone goes through a rough patch." }, { id: "b", text: "You're not broken. You're carrying too much without the right gear." }, { id: "c", text: "Talk to someone. That's above my pay grade." }, { id: "d", text: "Give him space — he'll work through it." }], correct: "b", feedback: "You knew exactly what he needed to hear. You knew it without thinking. The question is whether you can say that same thing to yourself." } },
      { stage: "Stage 2 — The Friend Reframe", format: "Fill in the blank", description: "User maps the gap between self-talk and friend-talk directly to their own experience. This is the core Observer Post exercise.", sample: { type: "fill", prompt: "Think about how you talk to yourself when you mess up:", template: "When I screw up, I tell myself ___. If a Marine I respected came to me with the same thing, I'd tell him ___.", placeholder: "you're slipping, you're not who you used to be..." } },
      { stage: "Stage 3 — Talk to Yourself Like That", format: "Sentence construction", description: "User constructs the full self-as-context move and practices the alternative voice directly.", sample: { type: "fill", prompt: "Say it to yourself. Directly.", template: "I've been telling myself ___. That's not how I'd talk to someone I respect. What's actually true is ___. So I'm telling myself ___.", placeholder: "I'm losing my edge..." } },
    ]
  },
  action: {
    hook: "You don't go downrange with basic-issue everything. Why go into life with basic-issue emotional tools? You are as good as your gear.",
    clinical: "Committed action is the behavioral output of all preceding ACT work — values-driven behavior sustained in the presence of difficult internal experience. This module integrates the Socratic voice feature: structured prompts followed by values-anchored questioning that moves from intention to specific, time-bound commitment.",
    stages: [
      { stage: "Stage 1 — Gear Check", format: "Multiple choice", description: "User identifies which emotional gear they're running with currently. Establishing baseline before building toward upgrade.", sample: { type: "mc", prompt: "Be honest. When things get hard at home, what's your default move?", context: "", options: [{ id: "a", text: "Lock down and wait for it to pass" }, { id: "b", text: "Get loud — clear the air fast and move on" }, { id: "c", text: "Stay busy so I don't have to sit in it" }, { id: "d", text: "I actually talk it through" }], correct: null, feedback: "No wrong answer. This is your baseline gear. The only question is whether it's getting the job done." } },
      { stage: "Stage 2 — Values to Behavior", format: "Fill in the blank", description: "User maps their stated values from GROUNDWORK directly to a specific behavioral domain.", sample: { type: "fill", prompt: "You said loyalty matters to you. What does loyalty actually look like in your life right now?", template: "Loyalty to me means ___. Right now I'm showing up for that by ___. Where I'm falling short is ___.", placeholder: "being present not just physically..." } },
      { stage: "Stage 3 — Commit", format: "Socratic voice", description: "Structured prompt followed by Socratic questioning anchored to the ACT hexaflex. User builds a specific, behavioral, time-bound commitment.", sample: { type: "socratic", prompt: "Based on everything in this program — your values, your patterns, what you want your life to look like — what's one thing you're going to do differently this week?", followups: ["What does that actually look like in practice — specifically, not generally?", "What's the version of you that doesn't follow through going to tell you? What do you say back?", "Who in your life would notice if you did this?"], template: "This week I'm going to ___. I'm doing it because ___. If I start to back off, I'll remind myself ___.", placeholder: "call my brother who's been struggling..." } },
    ]
  },
};

const VALUES_QUESTIONS = [
  { id: "v1", type: "mc", prompt: "When your unit is in the shit, what's the one thing that keeps you moving?", sub: "Don't overthink it. First instinct.", options: [{ id: "a", text: "The guy to my left and right", value: "loyalty" }, { id: "b", text: "Not letting the team down", value: "duty" }, { id: "c", text: "Getting everyone home", value: "protection" }, { id: "d", text: "Doing my job right", value: "excellence" }] },
  { id: "v2", type: "mc", prompt: "What would make you lose respect for a Marine faster than anything else?", sub: "Pick the one that hits hardest.", options: [{ id: "a", text: "Leaving someone behind", value: "loyalty" }, { id: "b", text: "Lying to cover their ass", value: "integrity" }, { id: "c", text: "Folding under pressure", value: "resilience" }, { id: "d", text: "Putting themselves first", value: "selflessness" }] },
  { id: "v3", type: "mc", prompt: "Ten years out — what do you want the Marines you served with to say about you?", sub: "One answer. Be honest.", options: [{ id: "a", text: "He never wavered, no matter what", value: "integrity" }, { id: "b", text: "I'd go back into the shit with him any day", value: "loyalty" }, { id: "c", text: "He made us better", value: "leadership" }, { id: "d", text: "He always showed up", value: "reliability" }] },
  { id: "v4", type: "fill", prompt: "Complete this:", template: "At the end of my life, I want to be known as someone who ___.", placeholder: "never quit on the people who counted on me", hint: "Say it like you'd say it to your platoon." },
  { id: "v5", type: "fill", prompt: "One more:", template: "The thing I won't compromise on, no matter what, is ___.", placeholder: "making sure my people are taken care of", hint: "This is yours. No right answer." },
];

// ─── DISTRESS PROTOCOL ────────────────────────────────────────────────────────

// Teal palette — evidence-based stress-reducing blue-green range (470-530nm)
const T = {
  core: "#1a6b6b",
  mid: "#1e8080",
  bright: "#22a8a8",
  glow: "rgba(34,168,168,0.25)",
  glowSoft: "rgba(34,168,168,0.10)",
  glowFaint: "rgba(34,168,168,0.05)",
  text: "#a8e6e6",
  textSoft: "#6abebe",
  bg: "#050e0e",
};

function PrepScreen({ step, message, buttonLabel, onReady }) {
  return (
    <View style={{ padding: 32, gap: 28, alignItems: "center" }}>
      <View style={{ width: 48, height: 2, backgroundColor: T.core, borderRadius: 1 }} />
      <Text style={{ color: T.text, fontSize: 16, lineHeight: 28, textAlign: "center", fontStyle: "italic" }}>
        {message}
      </Text>
      <TouchableOpacity onPress={onReady}
        style={{ backgroundColor: T.core, borderRadius: 30, paddingHorizontal: 36, paddingVertical: 14, borderWidth: 1, borderColor: T.bright, marginTop: 8 }}>
        <Text style={{ color: T.text, fontWeight: "bold", fontSize: 15, letterSpacing: 3 }}>{buttonLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function OrbBreathing({ onComplete }) {
  const TOTAL_CYCLES = 4;
  const PHASES = ["inhale", "hold1", "exhale", "hold2"];
  const DURATIONS = { inhale: 4, hold1: 4, exhale: 4, hold2: 4 };
  const LABELS = {
    inhale: "breathe in...",
    hold1: "hold...",
    exhale: "breathe out...",
    hold2: "hold..."
  };

  const [phase, setPhase] = useState("inhale");
  const [count, setCount] = useState(4);
  const [cycle, setCycle] = useState(0);
  const [done, setDone] = useState(false);
  const orbScale = useState(new Animated.Value(0.6))[0];
  const orbGlow = useState(new Animated.Value(0.3))[0];

  // Animate orb based on phase
  useEffect(() => {
    if (phase === "inhale") {
      Animated.timing(orbScale, { toValue: 1.0, duration: 4000, useNativeDriver: true }).start();
      Animated.timing(orbGlow, { toValue: 1.0, duration: 4000, useNativeDriver: true }).start();
    } else if (phase === "hold1") {
      Animated.timing(orbScale, { toValue: 1.0, duration: 200, useNativeDriver: true }).start();
      Animated.loop(Animated.sequence([
        Animated.timing(orbGlow, { toValue: 0.8, duration: 600, useNativeDriver: true }),
        Animated.timing(orbGlow, { toValue: 1.0, duration: 600, useNativeDriver: true }),
      ])).start();
    } else if (phase === "exhale") {
      Animated.timing(orbScale, { toValue: 0.55, duration: 4000, useNativeDriver: true }).start();
      Animated.timing(orbGlow, { toValue: 0.2, duration: 4000, useNativeDriver: true }).start();
    } else if (phase === "hold2") {
      Animated.timing(orbScale, { toValue: 0.55, duration: 200, useNativeDriver: true }).start();
      Animated.timing(orbGlow, { toValue: 0.15, duration: 200, useNativeDriver: true }).start();
    }
  }, [phase]);

  useEffect(() => {
    if (done) return;
    let c = count;
    const t = setInterval(() => {
      c -= 1;
      if (c > 0) {
        setCount(c);
      } else {
        clearInterval(t);
        const nextPhase = PHASES[(PHASES.indexOf(phase) + 1) % 4];
        if (nextPhase === "inhale") {
          const newCycle = cycle + 1;
          if (newCycle >= TOTAL_CYCLES) {
            setDone(true);
            setTimeout(onComplete, 2000);
            return;
          }
          setCycle(newCycle);
        }
        setPhase(nextPhase);
        setCount(DURATIONS[nextPhase]);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [phase, count, done]);

  if (done) return (
    <View style={{ alignItems: "center", padding: 48, gap: 20 }}>
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.glowSoft, borderWidth: 1, borderColor: T.core, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: T.text, fontSize: 32 }}>✓</Text>
      </View>
      <Text style={{ color: T.text, fontSize: 18, fontWeight: "bold", textAlign: "center", lineHeight: 26 }}>
        Good. We're steadier now.
      </Text>
      <Text style={{ color: T.textSoft, fontSize: 14, textAlign: "center", lineHeight: 22 }}>
        Your nervous system just shifted.{"\n"}Let's keep going.
      </Text>
    </View>
  );

  const glowOpacity = orbGlow.interpolate({ inputRange: [0, 1], outputRange: [0.05, 0.35] });
  const outerGlowOpacity = orbGlow.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.15] });

  return (
    <View style={{ alignItems: "center", paddingVertical: 40, paddingHorizontal: 24, gap: 28, backgroundColor: T.bg }}>
      {/* Orb */}
      <View style={{ width: 220, height: 220, alignItems: "center", justifyContent: "center" }}>
        {/* Outer glow ring */}
        <Animated.View style={{
          position: "absolute",
          width: 220, height: 220, borderRadius: 110,
          backgroundColor: T.glowFaint,
          opacity: outerGlowOpacity,
          transform: [{ scale: orbScale }],
        }} />
        {/* Mid glow */}
        <Animated.View style={{
          position: "absolute",
          width: 180, height: 180, borderRadius: 90,
          backgroundColor: T.glowSoft,
          opacity: glowOpacity,
          transform: [{ scale: orbScale }],
        }} />
        {/* Core orb — slightly organic by using different border radii */}
        <Animated.View style={{
          width: 140, height: 140,
          borderRadius: 70,
          backgroundColor: T.core,
          borderWidth: 1,
          borderColor: T.bright,
          opacity: orbGlow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.0] }),
          transform: [{ scale: orbScale }],
          shadowColor: T.bright,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 24,
          elevation: 10,
        }} />
      </View>

      {/* Phase label */}
      <Text style={{ color: T.text, fontSize: 20, letterSpacing: 4, fontStyle: "italic" }}>
        {LABELS[phase]}
      </Text>

      {/* Cycle dots */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {Array(TOTAL_CYCLES).fill(0).map((_, i) => (
          <View key={i} style={{
            width: i < cycle ? 24 : 8,
            height: 8, borderRadius: 4,
            backgroundColor: i < cycle ? T.bright : i === cycle ? T.mid : T.core,
            opacity: i < cycle ? 1 : i === cycle ? 0.8 : 0.3,
          }} />
        ))}
      </View>
      <Text style={{ color: T.textSoft, fontSize: 12, letterSpacing: 2 }}>
        round {cycle + 1} of {TOTAL_CYCLES}
      </Text>
    </View>
  );
}

function GroundingExercise({ onComplete }) {
  const cats = [
    { n: 5, label: "things you can SEE", icon: "👁" },
    { n: 4, label: "things you can FEEL", icon: "✋" },
    { n: 3, label: "things you can HEAR", icon: "👂" },
    { n: 2, label: "things you can SMELL", icon: "👃" },
    { n: 1, label: "thing you can TASTE", icon: "👅" }
  ];
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState(cats.map(c => Array(c.n).fill("")));
  const allFilled = inputs[step].every(v => v.trim().length > 0);
  const update = (i, v) => setInputs(inputs.map((a, si) => si === step ? a.map((x, ii) => ii === i ? v : x) : a));
  const isLast = step === cats.length - 1;

  return (
    <View style={{ padding: 24, gap: 16 }}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
        {cats.map((_, i) => (
          <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? T.bright : C.border }} />
        ))}
      </View>
      <Text style={{ color: T.textSoft, fontSize: 11, letterSpacing: 4, textAlign: "center" }}>5-4-3-2-1 GROUNDING</Text>
      <Text style={{ fontSize: 34, textAlign: "center" }}>{cats[step].icon}</Text>
      <Text style={{ fontSize: 18, color: C.text, fontWeight: "bold", textAlign: "center", letterSpacing: 1 }}>
        Let's find {cats[step].n} {cats[step].label}
      </Text>
      <Text style={{ color: C.textMuted, fontSize: 13, textAlign: "center", fontStyle: "italic" }}>
        Look around together. Take your time. Be specific.
      </Text>
      <View style={{ gap: 8 }}>
        {inputs[step].map((v, i) => (
          <View key={i} style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: v.trim() ? WITR.borderFocus : WITR.border, borderRadius: 6, overflow: "hidden" }}>
            <TextInput value={v} onChangeText={t => update(i, t)}
              placeholder={`${i + 1}.`} placeholderTextColor={WITR.inkMuted}
              style={{ padding: 12, color: WITR.ink, fontSize: 15 }} />
          </View>
        ))}
      </View>
      <TouchableOpacity onPress={() => isLast ? onComplete() : setStep(step + 1)} disabled={!allFilled}
        style={{ backgroundColor: allFilled ? T.core : C.border, borderRadius: 6, padding: 14, alignItems: "center", borderWidth: allFilled ? 1 : 0, borderColor: T.bright }}>
        <Text style={{ color: allFilled ? T.text : C.textDim, fontWeight: "bold", letterSpacing: 3 }}>
          {isLast ? "WE'RE GROUNDED" : "NEXT →"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function VividLife({ onDismiss }) {
  const [text, setText] = useState("");
  const hasContent = text.trim().length > 20;
  return (
    <View style={{ padding: 24, gap: 18 }}>
      <Text style={{ color: T.textSoft, fontSize: 11, letterSpacing: 4, textAlign: "center" }}>FORWARD OBSERVATION</Text>
      <Text style={{ color: C.text, fontSize: 16, lineHeight: 28, textAlign: "center", fontStyle: "italic" }}>
        Where are you going?
      </Text>
      <View style={{ backgroundColor: C.surfaceAlt, borderRadius: 10, padding: 16, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ color: C.text, fontSize: 14, lineHeight: 24 }}>
          Picture yourself five years from now — living fully in line with what you said matters to you.{"\n\n"}Where are you? Who's around you? What does a day look like? What are you doing with your time?{"\n\n"}Be specific. The more vivid you make this, the more real it becomes.
        </Text>
      </View>
      <View style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: hasContent ? WITR.borderFocus : WITR.border, borderRadius: 8, overflow: "hidden" }}>
        <TextInput value={text} onChangeText={setText}
          placeholder="Start anywhere. Let it come." placeholderTextColor={WITR.inkMuted}
          multiline numberOfLines={6}
          style={{ padding: 14, color: WITR.ink, fontSize: 15, minHeight: 140, textAlignVertical: "top", lineHeight: 26 }} />
      </View>
      {hasContent && (
        <View style={{ backgroundColor: T.glowFaint, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: T.core }}>
          <Text style={{ color: T.text, fontSize: 13, lineHeight: 20, fontStyle: "italic" }}>
            That's real. That's yours. When things get hard, this is what you're moving toward.
          </Text>
        </View>
      )}
      <TouchableOpacity onPress={onDismiss}
        style={{ backgroundColor: T.core, borderRadius: 8, padding: 16, alignItems: "center", borderWidth: 1, borderColor: T.bright }}>
        <Text style={{ color: T.text, fontWeight: "bold", fontSize: 16, letterSpacing: 3 }}>CARRY THIS FORWARD</Text>
      </TouchableOpacity>
    </View>
  );
}

function DistressProtocol({ visible, onDismiss }) {
  const [stage, setStage] = useState("prep_breathing");

  useEffect(() => {
    if (visible) setStage("prep_breathing");
  }, [visible]);

  const stageLabel = {
    prep_breathing: "STEP 1 OF 3", breathing: "STEP 1 OF 3",
    prep_grounding: "STEP 2 OF 3", grounding: "STEP 2 OF 3",
    prep_vivid: "STEP 3 OF 3", vivid: "STEP 3 OF 3",
  }[stage] || "STEP 1 OF 3";

  const bgColor = stage === "breathing" ? T.bg : C.surface;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.95)", justifyContent: "center", padding: 20 }}>
        <View style={{ backgroundColor: bgColor, borderWidth: 1, borderColor: stage === "breathing" ? T.core : C.border, borderRadius: 12, maxHeight: "90%", transition: "background-color 0.5s" }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: stage === "breathing" ? T.core : C.border }}>
            <Text style={{ color: stage === "breathing" ? T.textSoft : C.textMuted, fontSize: 11, letterSpacing: 4 }}>{stageLabel}</Text>
            <TouchableOpacity onPress={onDismiss}>
              <Text style={{ color: stage === "breathing" ? T.textSoft : C.textMuted, fontSize: 20 }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {stage === "prep_breathing" && (
              <PrepScreen
                step={1}
                message={"This isn't easy work.\nThe fact that you're here means something.\n\nLet's take a breath together before we keep going.\n\nFollow the shape on the next screen — it'll guide us. There's nothing to do but breathe."}
                buttonLabel="I'M WITH YOU"
                onReady={() => setStage("breathing")}
              />
            )}
            {stage === "breathing" && (
              <OrbBreathing onComplete={() => setStage("prep_grounding")} />
            )}
            {stage === "prep_grounding" && (
              <PrepScreen
                step={2}
                message={"Good. We're steadier.\n\nLet's stay here for a moment and look around together — just notice what's actually in the room with you right now.\n\nYour senses are an anchor. Let's use them."}
                buttonLabel="I'M HERE"
                onReady={() => setStage("grounding")}
              />
            )}
            {stage === "grounding" && (
              <GroundingExercise onComplete={() => setStage("prep_vivid")} />
            )}
            {stage === "prep_vivid" && (
              <PrepScreen
                step={3}
                message={"You're present. You're steady.\n\nNow — where are you going?\n\nThe more specifically you can see your future, the stronger your footing in the present. This isn't an exercise. This is you building something real.\n\nTake your time."}
                buttonLabel="I'M READY"
                onReady={() => setStage("vivid")}
              />
            )}
            {stage === "vivid" && (
              <VividLife onDismiss={onDismiss} />
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── SHARED ───────────────────────────────────────────────────────────────────
function Header({ onBack, title, subtitle }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
      <TouchableOpacity onPress={onBack}><Text style={{ color: C.textMuted, fontSize: 22 }}>←</Text></TouchableOpacity>
      <View>
        <Text style={{ color: C.text, fontSize: 15, fontWeight: "bold", letterSpacing: 3 }}>{title}</Text>
        {subtitle && <Text style={{ color: C.textMuted, fontSize: 12 }}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function CrisisFooter() {
  return (
    <View style={{ padding: 14, borderTopWidth: 1, borderTopColor: C.border, alignItems: "center" }}>
      <Text style={{ color: C.textDim, fontSize: 11 }}>Veterans Crisis Line · Dial 988, Press 1 · Text 838255</Text>
    </View>
  );
}

function Tag({ text }) {
  return <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
    <Text style={{ color: C.textDim, fontSize: 10, letterSpacing: 1 }}>{text}</Text>
  </View>;
}

// ─── SAMPLE INTERACTION ───────────────────────────────────────────────────────
function SampleInteraction({ sample }) {
  const [selected, setSelected] = useState(null);
  const [fillVal, setFillVal] = useState("");
  const [socrStep, setSocrStep] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const cardStyle = { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 16, marginTop: 12 };

  if (sample.type === "mc") return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <Tag text="SAMPLE" /><Tag text="MULTIPLE CHOICE" />
      </View>
      {!!sample.context && <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 6, padding: 10, marginBottom: 10 }}>
        <Text style={{ color: C.textMuted, fontSize: 12, lineHeight: 18 }}>{sample.context}</Text>
      </View>}
      <Text style={{ color: C.text, fontSize: 16, fontWeight: "bold", lineHeight: 22, marginBottom: 14 }}>{sample.prompt}</Text>
      {sample.options.map(opt => {
        const isSelected = selected === opt.id;
        const isCorrect = sample.correct && opt.id === sample.correct;
        const showResult = selected && sample.correct;
        return (
          <TouchableOpacity key={opt.id} onPress={() => !selected && setSelected(opt.id)}
            style={{ backgroundColor: showResult && isCorrect ? "rgba(46,107,79,0.2)" : isSelected && !isCorrect ? "rgba(139,46,46,0.2)" : C.surfaceAlt, borderWidth: 1, borderColor: showResult && isCorrect ? C.safe : isSelected && !isCorrect ? "#8b2e2e" : C.border, borderRadius: 7, padding: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ color: C.textMuted, fontSize: 11, width: 18 }}>{opt.id.toUpperCase()}</Text>
            <Text style={{ color: C.text, fontSize: 14, flex: 1 }}>{opt.text}</Text>
            {showResult && isCorrect && <Text style={{ color: C.safe }}>✓</Text>}
          </TouchableOpacity>
        );
      })}
      {selected && sample.feedback && (
        <View style={{ backgroundColor: "rgba(200,146,42,0.08)", borderWidth: 1, borderColor: C.accentDim, borderRadius: 7, padding: 12, marginTop: 8 }}>
          <Text style={{ color: C.text, fontSize: 14, lineHeight: 20 }}>{sample.feedback}</Text>
        </View>
      )}
    </View>
  );

  if (sample.type === "fill") return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <Tag text="SAMPLE" /><Tag text="FILL IN THE BLANK" />
      </View>
      <Text style={{ color: C.text, fontSize: 16, fontWeight: "bold", lineHeight: 22, marginBottom: 6 }}>{sample.prompt}</Text>
      <Text style={{ color: C.textMuted, fontSize: 13, lineHeight: 20, marginBottom: 12 }}>{sample.template}</Text>
      <View style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: fillVal.trim().length > 0 ? WITR.borderFocus : WITR.border, borderRadius: 6, overflow: "hidden" }}>
        <TextInput value={fillVal} onChangeText={setFillVal} placeholder={sample.placeholder} placeholderTextColor={WITR.inkMuted} multiline numberOfLines={3}
          style={{ padding: 12, color: WITR.ink, fontSize: 14, minHeight: 80, textAlignVertical: "top", lineHeight: 22, fontStyle: fillVal.trim() ? "normal" : "italic" }} />
      </View>
      {fillVal.trim().length > 10 && (
        <View style={{ backgroundColor: "rgba(46,107,79,0.15)", borderWidth: 1, borderColor: C.safe, borderRadius: 7, padding: 10, marginTop: 10 }}>
          <Text style={{ color: C.text, fontSize: 13 }}>That's a rep. That's the work.</Text>
        </View>
      )}
    </View>
  );

  if (sample.type === "socratic") return (
    <View style={cardStyle}>
      <View style={{ flexDirection: "row", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <Tag text="SAMPLE" /><Tag text="SOCRATIC VOICE" />
      </View>
      <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 7, padding: 12, marginBottom: 10 }}>
        <Text style={{ color: C.accent, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>PROMPT</Text>
        <Text style={{ color: C.text, fontSize: 14, lineHeight: 20 }}>{sample.prompt}</Text>
      </View>
      <View style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: WITR.border, borderRadius: 7, overflow: "hidden", marginBottom: 10 }}>
        <TextInput placeholder={sample.template} placeholderTextColor={WITR.inkMuted} multiline numberOfLines={3}
          onChangeText={t => { if (!revealed && t.length > 10) setRevealed(true); }}
          style={{ padding: 12, color: WITR.ink, fontSize: 14, minHeight: 80, textAlignVertical: "top", lineHeight: 22 }} />
      </View>
      {revealed && sample.followups[socrStep] && (
        <View style={{ backgroundColor: "rgba(200,146,42,0.08)", borderWidth: 1, borderColor: C.accentDim, borderRadius: 7, padding: 12 }}>
          <Text style={{ color: C.accent, fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>FOLLOW-UP</Text>
          <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, marginBottom: 10 }}>{sample.followups[socrStep]}</Text>
          {socrStep < sample.followups.length - 1
            ? <TouchableOpacity onPress={() => setSocrStep(socrStep + 1)} style={{ borderWidth: 1, borderColor: C.accentDim, borderRadius: 5, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "flex-start" }}>
              <Text style={{ color: C.accent, fontSize: 13, letterSpacing: 2 }}>KEEP GOING →</Text>
            </TouchableOpacity>
            : <View style={{ backgroundColor: "rgba(46,107,79,0.15)", borderWidth: 1, borderColor: C.safe, borderRadius: 6, padding: 10 }}>
              <Text style={{ color: C.text, fontSize: 13 }}>That's a commitment. Hold it.</Text>
            </View>
          }
        </View>
      )}
    </View>
  );
  return null;
}

// ─── SKELETON MODULE ──────────────────────────────────────────────────────────
function SkeletonModule({ module, onBack }) {
  const data = SKELETON_DATA[module.id];
  const [openStage, setOpenStage] = useState(0);
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <Header onBack={onBack} title={module.label} subtitle={module.sublabel} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Tag text={module.tag} /><Tag text={module.msceit} />
        </View>
        <View style={{ backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentDim, borderRadius: 10, padding: 16 }}>
          <Text style={{ color: C.accent, fontSize: 18, lineHeight: 26 }}>"{data.hook}"</Text>
        </View>
        <View>
          <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 5, marginBottom: 10 }}>CLINICAL RATIONALE</Text>
          <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 22 }}>{data.clinical}</Text>
        </View>
        <View>
          <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 5, marginBottom: 12 }}>TRAINING PROGRESSION</Text>
          {data.stages.map((s, i) => (
            <View key={i} style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: openStage === i ? C.accentDim : C.border, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
              <TouchableOpacity onPress={() => setOpenStage(openStage === i ? -1 : i)} style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: C.text, fontSize: 15, fontWeight: "bold", letterSpacing: 1 }}>{s.stage}</Text>
                  <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>Format: {s.format}</Text>
                </View>
                <Text style={{ color: C.textMuted, fontSize: 12 }}>{openStage === i ? "▲" : "▼"}</Text>
              </TouchableOpacity>
              {openStage === i && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 4 }}>{s.description}</Text>
                  <SampleInteraction sample={s.sample} />
                </View>
              )}
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: C.surface, borderWidth: 2, borderColor: C.border, borderStyle: "dashed", borderRadius: 10, padding: 24, alignItems: "center" }}>
          <Text style={{ color: C.textDim, fontSize: 15, fontWeight: "bold", letterSpacing: 3 }}>IN DEVELOPMENT</Text>
          <Text style={{ color: C.textDim, fontSize: 13, marginTop: 4 }}>Complete prior modules to unlock</Text>
        </View>
        <CrisisFooter />
      </ScrollView>
    </View>
  );
}

// ─── VALUES MODULE ────────────────────────────────────────────────────────────
function ValuesModule({ onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fillVal, setFillVal] = useState("");
  const [distress, setDistress] = useState(false);
  const [complete, setComplete] = useState(false);
  const q = VALUES_QUESTIONS[step];
  const DISTRESS = ["can't go on", "hopeless", "end it", "no point", "suicide", "hurt myself", "kill myself"];
  const checkDistress = t => DISTRESS.some(w => t.toLowerCase().includes(w));

  const advance = (ans) => {
    const next = { ...answers, [q.id]: ans };
    setAnswers(next);
    if (step + 1 >= VALUES_QUESTIONS.length) setComplete(true);
    else { setStep(step + 1); setFillVal(""); }
  };

  if (complete) {
    const topValues = [...new Set(Object.values(answers).filter(v => typeof v === "object").map(v => v.value))];
    const freeResponses = Object.values(answers).filter(v => typeof v === "string");
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header onBack={onBack} title="GROUNDWORK" />
        <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
          <View>
            <Text style={{ color: C.accent, fontSize: 11, letterSpacing: 5, marginBottom: 6 }}>MISSION COMPLETE</Text>
            <Text style={{ color: C.text, fontSize: 34, fontWeight: "bold", lineHeight: 38 }}>YOUR CORE VALUES</Text>
          </View>
          <Text style={{ color: C.textMuted, fontSize: 15, lineHeight: 24 }}>These aren't assigned. They came from you. Everything in this program builds on them.</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {topValues.map(v => <View key={v} style={{ backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentDim, borderRadius: 4, paddingHorizontal: 14, paddingVertical: 6 }}>
              <Text style={{ color: C.accent, fontSize: 13, fontWeight: "bold", letterSpacing: 3 }}>{v.toUpperCase()}</Text>
            </View>)}
          </View>
          {freeResponses.length > 0 && <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 18 }}>
            <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 4, marginBottom: 12 }}>YOUR WORDS</Text>
            {freeResponses.map((v, i) => <Text key={i} style={{ color: C.text, fontSize: 14, lineHeight: 22, marginBottom: 8 }}>— "{v}"</Text>)}
          </View>}
          <TouchableOpacity onPress={onBack} style={{ backgroundColor: C.accent, borderRadius: 6, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16, letterSpacing: 4 }}>BACK TO MODULES</Text>
          </TouchableOpacity>
          <CrisisFooter />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <DistressProtocol visible={distress} onDismiss={() => setDistress(false)} />
      <Header onBack={onBack} title="GROUNDWORK" subtitle="Values Identification" />
      <View style={{ height: 3, backgroundColor: C.border }}>
        <View style={{ height: 3, width: `${(step / VALUES_QUESTIONS.length) * 100}%`, backgroundColor: C.accent }} />
      </View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>
          {VALUES_QUESTIONS.map((_, i) => <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? C.accent : C.border }} />)}
        </View>

        {q.type === "mc" && <>
          <View>
            <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{q.sub}</Text>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: "bold", lineHeight: 32 }}>{q.prompt}</Text>
          </View>
          {q.options.map(opt => (
            <TouchableOpacity key={opt.id} onPress={() => advance(opt)}
              style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
                <Text style={{ color: C.textMuted, fontSize: 11 }}>{opt.id.toUpperCase()}</Text>
              </View>
              <Text style={{ color: C.text, fontSize: 15, flex: 1 }}>{opt.text}</Text>
            </TouchableOpacity>
          ))}
        </>}

        {q.type === "fill" && <>
          <View>
            <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>{q.prompt}</Text>
            <Text style={{ color: C.text, fontSize: 22, fontWeight: "bold", lineHeight: 30, marginBottom: 6 }}>{q.template}</Text>
            <Text style={{ color: C.textDim, fontSize: 12, fontStyle: "italic" }}>{q.hint}</Text>
          </View>
          <View style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: fillVal.trim() ? WITR.borderFocus : WITR.border, borderRadius: 8, overflow: "hidden" }}>
            <TextInput value={fillVal} onChangeText={setFillVal} placeholder={q.placeholder} placeholderTextColor={WITR.inkMuted} multiline numberOfLines={3}
              style={{ padding: 14, color: WITR.ink, fontSize: 15, minHeight: 90, textAlignVertical: "top", lineHeight: 24 }} />
          </View>
          <TouchableOpacity onPress={() => { if (checkDistress(fillVal)) { setDistress(true); return; } advance(fillVal); }} disabled={!fillVal.trim()}
            style={{ backgroundColor: fillVal.trim() ? C.accent : C.border, borderRadius: 6, padding: 14, alignItems: "center" }}>
            <Text style={{ color: fillVal.trim() ? "#000" : C.textDim, fontWeight: "bold", fontSize: 16, letterSpacing: 4 }}>SUBMIT</Text>
          </TouchableOpacity>
        </>}
        <CrisisFooter />
      </ScrollView>
    </View>
  );
}

// ─── NOISE REDUCTION MODULE ──────────────────────────────────────────────────
const NOISE_QUESTIONS = [
  {
    id: "n1", type: "mc",
    stage: "STAGE 1 — NAME THE NOISE",
    stageLabel: "Observing · External",
    sceneSetter: "First day. You just got off the bus at basic. Drill sergeants are everywhere — moving fast, giving instructions, getting in faces. It's controlled chaos and nobody told you the rules.",
    vignette: "The recruit next to you hasn't moved since he got off the bus. The DS gave a clear instruction thirty seconds ago. Everyone else picked up their gear and moved. He's still standing there, eyes forward, gear at his feet.",
    prompt: "What's happening with him?",
    sub: "Look past the position. What's actually going on.",
    options: [
      { id: "a", text: "He didn't hear the instruction — too much going on", value: "wrong" },
      { id: "b", text: "His mind is tracking something louder than the instruction in front of him", value: "correct" },
      { id: "c", text: "He's taking his time to make sure he does it right", value: "wrong" },
      { id: "d", text: "He's waiting to see what everyone else does before he moves", value: "also_correct" },
    ],
    feedback: {
      b: "Right. The instruction was clear. His body heard it. But his mind was already three steps ahead — tracking what happens if he does it wrong, what the DS will do, whether everyone is watching. The noise got louder than the signal. He froze when he should have moved.",
      d: "That works too. He's scanning the environment instead of responding to the actual instruction. His mind is tracking uncertainty — looking for more information before it will let him move. That's noise management that's making the noise louder, not quieter.",
      default: "Look closer. The instruction was loud and clear. Something else is tracking.",
    }
  },
  {
    id: "n2", type: "mc",
    stage: "STAGE 2 — MONITOR THE SIGNAL",
    stageLabel: "Monitoring · Adjacent",
    sceneSetter: "It's been a long day. Word gets around there's some downtime. People start to decompress — boots off, someone's on their bunk, the tension in the bay drops for the first time all day.",
    vignette: "Your bunkmate is standing at the end of his bunk at attention. The DS walked in two minutes ago, unannounced. Your bunkmate's position is correct — eyes forward, hands at his sides. But his hands are shaking slightly. He's doing everything right. Something is off.",
    prompt: "What is his body telling you that his position isn't?",
    sub: "Monitor what's underneath the surface.",
    options: [
      { id: "a", text: "He's exhausted — his body is giving out after a long day", value: "wrong" },
      { id: "b", text: "He's angry about being interrupted during downtime", value: "wrong" },
      { id: "c", text: "His nervous system is already tracking something that hasn't happened yet", value: "correct" },
      { id: "d", text: "Nothing — hands shake sometimes, it doesn't mean anything", value: "wrong" },
    ],
    feedback: {
      c: "His position is right. His body is giving him away. That shaking isn't about what's happening — it's about what his mind is tracking. He's at attention. His nervous system is already in the conversation with the DS that hasn't started yet. That gap between where his body is and where his mind is — that's the noise.",
      default: "Monitor more carefully. His position is correct. Something underneath it isn't.",
    }
  },
  {
    id: "n3", type: "fill",
    stage: "STAGE 2 — MONITOR THE SIGNAL",
    stageLabel: "Monitoring · Adjacent",
    sceneSetter: null,
    vignette: null,
    prompt: "Complete this:",
    template: "His body is in the room. His mind is already ___.",
    placeholder: "in the conversation with the DS that hasn't happened yet",
    hint: "Name where his mind actually is.",
    feedback: "That's the split. Physical presence, mental absence. You just named something most people never notice in themselves — let alone in someone else. That's monitoring."
  },
  {
    id: "n4", type: "fill",
    stage: "STAGE 3 — CLEAR THE NET",
    stageLabel: "Observing · Internal",
    sceneSetter: "Formation was called for 0530. It's 0543. Nobody has shown up yet. The unit is in position. It's quiet.",
    vignette: "Five minutes in, someone shifts their weight. Then someone else. A cough. Small movements starting to ripple through the formation. Your mind starts tracking. Are we in the right place? Did something change? Is this a test? What happens if someone breaks?\n\nThe movement around you is feeding something in you. Not yours exactly — but you picked it up anyway.",
    prompt: "What's actually happening — in the formation, and in you?",
    template: "The formation is tracking ___. My mind picked it up and started monitoring ___. When I step back and observe, what's actually true is ___. What the moment requires right now is ___.",
    placeholder: "uncertainty, not an actual threat / every possible reason they might be late / nothing has actually gone wrong yet / stillness — I move when there's a reason to move",
    hint: "Track → Monitor → Observe. Work through it.",
    feedback: "That restlessness moving through the formation — one mind starts tracking noise, the person next to them picks it up, then the next. Your nervous system doesn't know the difference between your signal and someone else's. The skill is noticing when you've picked up something that isn't yours, observing it for what it is, and choosing your response based on what the moment actually requires. Moving when you should be still is noise. Freezing when you should be moving is noise. Reading the moment clearly — that's the signal."
  },
];

function NoiseReductionModule({ onBack }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fillVal, setFillVal] = useState("");
  const [selected, setSelected] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [distress, setDistress] = useState(false);
  const [complete, setComplete] = useState(false);

  const q = NOISE_QUESTIONS[step];
  const DISTRESS_WORDS = ["can't go on", "hopeless", "end it", "no point", "suicide", "hurt myself", "kill myself"];
  const checkDistress = t => DISTRESS_WORDS.some(w => t.toLowerCase().includes(w));

  const advance = () => {
    if (step + 1 >= NOISE_QUESTIONS.length) setComplete(true);
    else { setStep(step + 1); setSelected(null); setShowFeedback(false); setFillVal(""); }
  };

  const handleChoice = (opt) => {
    if (selected) return;
    setSelected(opt.id);
    setAnswers({ ...answers, [q.id]: opt });
    setShowFeedback(true);
  };

  const handleFillSubmit = () => {
    if (checkDistress(fillVal)) { setDistress(true); return; }
    setAnswers({ ...answers, [q.id]: fillVal });
    setShowFeedback(true);
  };

  const getFeedback = () => {
    if (!selected) return q.feedback;
    return q.feedback[selected] || q.feedback.default;
  };

  if (complete) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Header onBack={onBack} title="NOISE REDUCTION" />
        <ScrollView contentContainerStyle={{ padding: 24, gap: 22 }}>
          <View>
            <Text style={{ color: C.accent, fontSize: 11, letterSpacing: 5, marginBottom: 6 }}>MISSION COMPLETE</Text>
            <Text style={{ color: C.text, fontSize: 34, fontWeight: "bold", lineHeight: 38 }}>NET CLEARED</Text>
          </View>
          <Text style={{ color: C.textMuted, fontSize: 15, lineHeight: 24 }}>
            You just worked through three levels of the same skill — observing noise in a stranger, monitoring it in someone you know, and stepping back to observe it in yourself. That's the progression. That's defusion.
          </Text>
          <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 18, gap: 14 }}>
            <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 4 }}>THE THREE MOVES</Text>
            {[
              { label: "TRACKING", desc: "Mind locked on noise. Can't respond to the actual signal." },
              { label: "MONITORING", desc: "Watching the noise from a slight distance. You can see it happening." },
              { label: "OBSERVING", desc: "Stepped back. Watching your own mind. Choosing your response." },
            ].map((item, i) => (
              <View key={i} style={{ flexDirection: "row", gap: 14, alignItems: "flex-start" }}>
                <View style={{ backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentDim, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 4, marginTop: 2 }}>
                  <Text style={{ color: C.accent, fontSize: 10, fontWeight: "bold", letterSpacing: 2 }}>{item.label}</Text>
                </View>
                <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{item.desc}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity onPress={onBack} style={{ backgroundColor: C.accent, borderRadius: 6, padding: 14, alignItems: "center" }}>
            <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16, letterSpacing: 4 }}>BACK TO MODULES</Text>
          </TouchableOpacity>
          <CrisisFooter />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <DistressProtocol visible={distress} onDismiss={() => setDistress(false)} />
      <Header onBack={onBack} title="NOISE REDUCTION" subtitle="Cognitive Defusion · Clear the Net" />
      <View style={{ height: 3, backgroundColor: C.border }}>
        <View style={{ height: 3, width: `${(step / NOISE_QUESTIONS.length) * 100}%`, backgroundColor: C.accent, transition: "width 0.4s" }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        {/* Stage indicator */}
        <View style={{ gap: 4 }}>
          <Text style={{ color: C.accent, fontSize: 10, letterSpacing: 5 }}>{q.stage}</Text>
          <Text style={{ color: C.textDim, fontSize: 11, letterSpacing: 2 }}>{q.stageLabel}</Text>
        </View>

        {/* Step dots */}
        <View style={{ flexDirection: "row", gap: 6 }}>
          {NOISE_QUESTIONS.map((_, i) => (
            <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? C.accent : C.border }} />
          ))}
        </View>

        {/* Scene setter */}
        {q.sceneSetter && (
          <View style={{ backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 14 }}>
            <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 3, marginBottom: 8 }}>SCENE</Text>
            <Text style={{ color: C.textMuted, fontSize: 14, lineHeight: 22, fontStyle: "italic" }}>{q.sceneSetter}</Text>
          </View>
        )}

        {/* Vignette */}
        {q.vignette && (
          <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: 8, padding: 16, borderLeftWidth: 3, borderLeftColor: C.accent }}>
            <Text style={{ color: C.text, fontSize: 15, lineHeight: 24 }}>{q.vignette}</Text>
          </View>
        )}

        {/* Question */}
        <View>
          {q.sub && <Text style={{ color: C.textMuted, fontSize: 11, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{q.sub}</Text>}
          <Text style={{ color: C.text, fontSize: q.type === "fill" ? 22 : 20, fontWeight: "bold", lineHeight: 28 }}>{q.prompt}</Text>
          {q.type === "fill" && (
            <Text style={{ color: C.textMuted, fontSize: 15, lineHeight: 24, marginTop: 6 }}>{q.template}</Text>
          )}
        </View>

        {/* Multiple choice */}
        {q.type === "mc" && (
          <View style={{ gap: 10 }}>
            {q.options.map(opt => {
              const isSelected = selected === opt.id;
              const isCorrect = opt.value === "correct" || opt.value === "also_correct";
              const showResult = showFeedback;
              return (
                <TouchableOpacity key={opt.id} onPress={() => handleChoice(opt)} disabled={!!selected}
                  style={{
                    backgroundColor: showResult && isSelected && isCorrect ? "rgba(46,107,79,0.2)" : showResult && isSelected && !isCorrect ? "rgba(139,46,46,0.2)" : C.surfaceAlt,
                    borderWidth: 1,
                    borderColor: showResult && isSelected && isCorrect ? C.safe : showResult && isSelected && !isCorrect ? "#8b2e2e" : C.border,
                    borderRadius: 8, padding: 14, flexDirection: "row", alignItems: "center", gap: 12
                  }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: C.textMuted, fontSize: 11 }}>{opt.id.toUpperCase()}</Text>
                  </View>
                  <Text style={{ color: C.text, fontSize: 15, flex: 1 }}>{opt.text}</Text>
                  {showResult && isSelected && isCorrect && <Text style={{ color: C.safe }}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Fill in the blank */}
        {q.type === "fill" && !showFeedback && (
          <View style={{ gap: 10 }}>
            {q.hint && <Text style={{ color: C.textDim, fontSize: 12, fontStyle: "italic" }}>{q.hint}</Text>}
            <View style={{ backgroundColor: WITR.bg, borderWidth: 1, borderColor: fillVal.trim() ? WITR.borderFocus : WITR.border, borderRadius: 8, overflow: "hidden" }}>
              <TextInput value={fillVal} onChangeText={setFillVal} placeholder={q.placeholder} placeholderTextColor={WITR.inkMuted} multiline numberOfLines={4}
                style={{ padding: 14, color: WITR.ink, fontSize: 15, minHeight: 100, textAlignVertical: "top", lineHeight: 24 }} />
            </View>
            <TouchableOpacity onPress={handleFillSubmit} disabled={!fillVal.trim()}
              style={{ backgroundColor: fillVal.trim() ? C.accent : C.border, borderRadius: 6, padding: 13, alignItems: "center" }}>
              <Text style={{ color: fillVal.trim() ? "#000" : C.textDim, fontWeight: "bold", fontSize: 16, letterSpacing: 4 }}>SUBMIT</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Feedback */}
        {showFeedback && (
          <View style={{ gap: 12 }}>
            <View style={{ backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentDim, borderRadius: 10, padding: 16 }}>
              <Text style={{ color: C.text, fontSize: 15, lineHeight: 24 }}>
                {q.type === "mc" ? getFeedback() : q.feedback}
              </Text>
            </View>
            <TouchableOpacity onPress={advance}
              style={{ backgroundColor: C.accent, borderRadius: 6, padding: 14, alignItems: "center" }}>
              <Text style={{ color: "#000", fontWeight: "bold", fontSize: 16, letterSpacing: 4 }}>
                {step + 1 >= NOISE_QUESTIONS.length ? "COMPLETE" : "NEXT →"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <CrisisFooter />
      </ScrollView>
    </View>
  );
}


function HomeScreen({ onSelect, xp=150, streak=3 }) {
  const rank=getRank(xp);
  const nextRank=getNextRank(xp);
  const progress=getRankProgress(xp);
  const isOfficer=rank.track==="officer";
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ padding: 24, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
        <Text style={{ color: C.accent, fontSize: 11, letterSpacing: 6, marginBottom: 4 }}>FIELD MANUAL</Text>
        <Text style={{ color: C.text, fontSize: 42, fontWeight: "bold", letterSpacing: 2, marginBottom: 4 }}>GROUNDWORK</Text>
        <Text style={{ color: C.textMuted, fontSize: 13 }}>Emotional intelligence. Tactical application.</Text>
      </View>
      <View style={{ padding: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.surfaceAlt, borderWidth: 2, borderColor: isOfficer ? C.accent : C.accentDim, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: C.accent, fontSize: 13, fontWeight: "bold", letterSpacing: 1 }}>{rank.rank}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontSize: 24, fontWeight: "bold", letterSpacing: 2 }}>{rank.title.toUpperCase()}</Text>
            <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }}>MSCEIT — {rank.msceit}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <Text style={{ fontSize: 13 }}>🔥</Text>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: "bold" }}>{streak} day streak</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
          <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2 }}>{nextRank ? "NEXT: "+nextRank.rank+" "+nextRank.title.toUpperCase() : "MAX RANK"}</Text>
          <Text style={{ color: C.textMuted, fontSize: 10 }}>{xp} / {nextRank ? nextRank.xpRequired : xp} XP</Text>
        </View>
        <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3, marginBottom: 14 }}>
          <View style={{ width: Math.round(progress*100)+"%", height: 6, backgroundColor: C.accent, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          {["E1","E2","E3","E4","O1","O2","O3","O4"].map((r, i) => {
            const ranks = ["E-1","E-2","E-3","E-4","O-1","O-2","O-3","O-4"];
            const isCurrent = rank.rank === ranks[i];
            const isPast = EQ_RANKS.findIndex(x => x.rank === rank.rank) > i;
            return (
              <View key={r} style={{ alignItems: "center", gap: 3 }}>
                <View style={{ width: isCurrent ? 10 : 7, height: isCurrent ? 10 : 7, borderRadius: isCurrent ? 5 : 3.5, backgroundColor: isCurrent ? C.accent : isPast ? C.accentDim : C.border }} />
                <Text style={{ color: isCurrent ? C.accent : C.textDim, fontSize: 8, letterSpacing: 0.5 }}>{r}</Text>
              </View>
            );
          })}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 8 }}>
        <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 5, marginBottom: 4 }}>TRAINING MODULES</Text>
        {MODULES.map(mod => (
          <TouchableOpacity key={mod.id} onPress={() => !mod.locked && onSelect(mod)} disabled={mod.locked}
            style={{ backgroundColor: mod.locked ? C.surface : C.surfaceAlt, borderWidth: 1, borderColor: !mod.locked && mod.id === "values" ? C.accentDim : C.border, borderRadius: 10, padding: 16, flexDirection: "row", alignItems: "center", gap: 14, opacity: mod.locked ? 0.4 : 1 }}>
            <View style={{ width: 42, height: 42, backgroundColor: !mod.locked && mod.id === "values" ? C.accentGlow : C.bg, borderWidth: 1, borderColor: !mod.locked && mod.id === "values" ? C.accentDim : C.border, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: mod.locked ? 18 : 20 }}>{mod.locked ? "🔒" : mod.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ color: C.text, fontSize: 15, fontWeight: "bold", letterSpacing: 2 }}>{mod.label}</Text>
                <Text style={{ color: C.textDim, fontSize: 9, marginTop: 2 }}>{mod.msceit}</Text>
              </View>
              <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 3 }}>{mod.sublabel}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <CrisisFooter />
      </ScrollView>
    </View>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [active, setActive] = useState(null);
  const go = mod => { setActive(mod); setScreen("module"); };
  const back = () => { setScreen("home"); setActive(null); };
  if (screen === "home") return <HomeScreen onSelect={go} />;
  if (active?.id === "values") return <ValuesModule onBack={back} />;
  if (active?.id === "defusion") return <NoiseReductionModule onBack={back} />;
  return <SkeletonModule module={active} onBack={back} />;
}
