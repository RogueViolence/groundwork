#!/usr/bin/env python3
import re

path = '/Users/jacob/Desktop/groundwork/app/index.tsx'

with open(path, 'r') as f:
    content = f.read()

# Add EQ ranks and helper functions before HomeScreen
progression_code = '''
// ─── PROGRESSION SYSTEM ──────────────────────────────────────────────────────
const EQ_RANKS = [
  { rank: "E-1", title: "Recruit", track: "enlisted", xpRequired: 0, msceit: "Perceiving", description: "Identifying emotion in others" },
  { rank: "E-2", title: "Specialist", track: "enlisted", xpRequired: 500, msceit: "Using", description: "Applying emotion under pressure" },
  { rank: "E-3", title: "Technician", track: "enlisted", xpRequired: 1200, msceit: "Understanding", description: "Reading emotional patterns" },
  { rank: "E-4", title: "Operator", track: "enlisted", xpRequired: 2400, msceit: "Managing", description: "Managing self, reading your team" },
  { rank: "O-1", title: "Leader", track: "officer", xpRequired: 4000, msceit: "Integration", description: "All six ACT processes integrated" },
  { rank: "O-2", title: "Commander", track: "officer", xpRequired: 6500, msceit: "Application", description: "EQ in unit and leadership contexts" },
  { rank: "O-3", title: "General", track: "officer", xpRequired: 10000, msceit: "Systemic", description: "Organizational and cultural influence" },
  { rank: "O-4", title: "Director", track: "officer", xpRequired: 15000, msceit: "Certified", description: "Verified MSCEIT credential" },
];

function getRank(xp) {
  let current = EQ_RANKS[0];
  for (const r of EQ_RANKS) { if (xp >= r.xpRequired) current = r; else break; }
  return current;
}
function getNextRank(xp) {
  for (const r of EQ_RANKS) { if (xp < r.xpRequired) return r; }
  return null;
}
function getRankProgress(xp) {
  const current = getRank(xp);
  const next = getNextRank(xp);
  if (!next) return 1;
  return (xp - current.xpRequired) / (next.xpRequired - current.xpRequired);
}

'''

new_home = '''function HomeScreen({ onSelect, xp = 150, streak = 3 }) {
  const rank = getRank(xp);
  const nextRank = getNextRank(xp);
  const progress = getRankProgress(xp);
  const isOfficer = rank.track === "officer";

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" />
      <View style={{ padding: 22, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.surface }}>
        <Text style={{ color: C.accent, fontSize: 10, letterSpacing: 6, marginBottom: 4 }}>FIELD MANUAL</Text>
        <Text style={{ color: C.text, fontSize: 40, fontWeight: "bold", letterSpacing: 2, marginBottom: 2 }}>GROUNDWORK</Text>
        <Text style={{ color: C.textMuted, fontSize: 13 }}>Emotional intelligence. Tactical application.</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>

        <View style={{ backgroundColor: C.surface, borderWidth: 1, borderColor: isOfficer ? C.accentDim : C.border, borderRadius: 12, padding: 18, gap: 14 }}>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: isOfficer ? C.accentGlow : C.surfaceAlt, borderWidth: 2, borderColor: isOfficer ? C.accent : C.border, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ color: C.accent, fontSize: 11, fontWeight: "bold", letterSpacing: 1 }}>{rank.rank}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={{ color: C.text, fontSize: 22, fontWeight: "bold", letterSpacing: 2 }}>{rank.title.toUpperCase()}</Text>
                {isOfficer && (
                  <View style={{ backgroundColor: C.accentGlow, borderWidth: 1, borderColor: C.accentDim, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: C.accent, fontSize: 9, letterSpacing: 2, fontWeight: "bold" }}>OFFICER</Text>
                  </View>
                )}
              </View>
              <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{rank.description}</Text>
              <Text style={{ color: C.textDim, fontSize: 10, letterSpacing: 2, marginTop: 2 }}>MSCEIT - {rank.msceit}</Text>
            </View>
          </View>

          <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
              <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 2 }}>
                {nextRank ? `NEXT: ${nextRank.rank} ${nextRank.title.toUpperCase()}` : "MAX RANK ACHIEVED"}
              </Text>
              <Text style={{ color: C.textMuted, fontSize: 10 }}>{xp} / {nextRank ? nextRank.xpRequired : xp} XP</Text>
            </View>
            <View style={{ height: 6, backgroundColor: C.border, borderRadius: 3 }}>
              <View style={{ width: `${Math.round(progress * 100)}%`, height: 6, backgroundColor: C.accent, borderRadius: 3 }} />
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <View style={{ backgroundColor: streak > 0 ? "rgba(200,100,30,0.15)" : C.surfaceAlt, borderWidth: 1, borderColor: streak > 0 ? "rgba(200,100,30,0.4)" : C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={{ fontSize: 18 }}>🔥</Text>
              <View>
                <Text style={{ color: streak > 0 ? "#e8822a" : C.textDim, fontSize: 20, fontWeight: "bold" }}>{streak}</Text>
                <Text style={{ color: C.textDim, fontSize: 9, letterSpacing: 2 }}>DAY STREAK</Text>
              </View>
            </View>
            <Text style={{ color: C.textMuted, fontSize: 12, lineHeight: 18, flex: 1 }}>
              {streak === 0 ? "Complete today's session to start your streak." :
               streak < 7 ? "Keep going. Consistency builds the skill." :
               streak < 30 ? `${streak} days strong. You're building something real.` :
               "This is what commitment looks like."}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 3 }}>
            {EQ_RANKS.map(r => {
              const earned = xp >= r.xpRequired;
              const isCurrent = r.rank === rank.rank;
              return (
                <View key={r.rank} style={{ flex: 1, alignItems: "center", gap: 3 }}>
                  <View style={{ width: "100%", height: 4, borderRadius: 2, backgroundColor: earned ? C.accent : C.border }} />
                  <Text style={{ color: isCurrent ? C.accent : earned ? C.textMuted : C.textDim, fontSize: 7, letterSpacing: 1 }}>{r.rank}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Text style={{ color: C.textMuted, fontSize: 10, letterSpacing: 5, marginTop: 4 }}>TRAINING MODULES</Text>
        {MODULES.map(mod => (
          <TouchableOpacity key={mod.id} onPress={() => !mod.locked && onSelect(mod)} disabled={mod.locked}
            style={{ backgroundColor: mod.locked ? C.surface : C.surfaceAlt, borderWidth: 1, borderColor: !mod.locked && (mod.id === "values" || mod.id === "defusion") ? C.accentDim : C.border, borderRadius: 10, padding: 15, flexDirection: "row", alignItems: "center", gap: 13, opacity: mod.locked ? 0.4 : 1 }}>
            <View style={{ width: 42, height: 42, backgroundColor: !mod.locked && (mod.id === "values" || mod.id === "defusion") ? C.accentGlow : C.bg, borderWidth: 1, borderColor: !mod.locked && (mod.id === "values" || mod.id === "defusion") ? C.accentDim : C.border, borderRadius: 8, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: mod.locked ? 16 : 18 }}>{mod.locked ? "🔒" : mod.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ color: C.text, fontSize: 14, fontWeight: "bold", letterSpacing: 2 }}>{mod.label}</Text>
                <Text style={{ color: C.textDim, fontSize: 9, marginTop: 2 }}>{mod.msceit}</Text>
              </View>
              <Text style={{ color: C.textMuted, fontSize: 12, marginTop: 2 }}>{mod.sublabel}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <CrisisFooter />
      </ScrollView>
    </View>
  );
}'''

# Find and replace the old HomeScreen function
old_home_pattern = r'function HomeScreen\(\{ onSelect \}\).*?^}'
content = re.sub(old_home_pattern, new_home.strip(), content, flags=re.DOTALL | re.MULTILINE)

# Inject progression code before HomeScreen
content = content.replace('function HomeScreen(', progression_code + 'function HomeScreen(')

with open(path, 'w') as f:
    f.write(content)

print("Patched successfully")
