/** User-visible weekly plan copy for `generateProfileWeeklySchedule` (by language). */
export type ScheduleProfileLang = 'sv' | 'en';

export const SCHEDULE_PROFILE_WEEKDAYS: Record<ScheduleProfileLang, readonly string[]> = {
  sv: ['måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag', 'söndag'],
  en: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
};

export const SCHEDULE_PROFILE_DEFAULT_REST: Record<ScheduleProfileLang, string> = {
  sv: 'Vilodag – lyssna på kroppen och ladda om.',
  en: 'Rest day – listen to your body and recharge.',
};

function capitalizeDay(lang: ScheduleProfileLang, dayIndex: number): string {
  const w = SCHEDULE_PROFILE_WEEKDAYS[lang][dayIndex] ?? SCHEDULE_PROFILE_WEEKDAYS.en[dayIndex];
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function formatScheduleProfileDetail(
  lang: ScheduleProfileLang,
  dayIndex: number,
  body: string,
): string {
  return `${capitalizeDay(lang, dayIndex)} – ${body}`;
}

const SV = {
  IRONMAN: [
    'Styrka – överkropp & core (45–60 min).\nFokus på press, drag och stabilitet för simning och cykling.',
    'Löpning Zone 2 (45–60 min).\nSnacktempo, jämn andning. Bygg aerob bas utan att bli sliten.',
    'Simning teknik (30–45 min).\nDrillar, lugna längder och fokus på vattenläge, catch och rotation.',
    'Cykel Zone 2 (60–90 min).\nJämnt tempo, låg puls. Trampa runt lätt men kontrollerat.',
    'Styrka – underkropp & core (45–60 min).\nFokus på benstyrka, höfter och bål för löp- och cykelekonomi.',
    'Långpass (60–90 min löpning eller 90–120 min cykel).\nHåll lugnt tempo, fokus på uthållighet och nutrition.',
    'Vilodag eller mycket lätt aktivitet (promenad, lugn sim). Din kropp bygger styrka nu – håll det enkelt.',
  ],
  COMPETITOR: [
    'Styrka helkropp (45–60 min).\nFokus på basövningar, explosivitet och god teknik.',
    'Intervallpass i din huvudgren.\nUppvärmning → 4–8 intervaller → nedvarvning. Hög men kontrollerad ansträngning.',
    'Lätt pass i din sekundära gren (20–40 min).\nSnacktempo, fokus på rörelsekvalitet.',
    'Styrka helkropp (45–60 min).\nLite tyngre än måndag, men lämna 1–2 reps i tanken.',
    'Tempopass i din huvudgren (30–50 min effektiv tid).\nStrax under tävlingsfart, jämn och fokuserad ansträngning.',
    'Långpass i din huvudgren.\nBygg uthållighet och testa pacing och energiintag.',
    'Vilodag. Fokus på sömn, mat och låg stress. En lugn promenad är ok om det känns bra.',
  ],
  RECOMP: [
    'Push-pass (bröst, axlar, triceps) 45–60 min.\nMedelvikt, kontrollerad teknik, 2–3 set per övning.',
    'Lugn cardio 30–40 min (gång, cykel eller lätt löpning).\nSyfte: öka energiförbrukning utan att slita.',
    'Pull-pass (rygg, biceps) 45–60 min.\nFokus på kontakt, kontrollerade reps, 2–3 set per övning.',
    'Enkel intervallcardio 25–30 min totalt.\nKort uppvärmning → 6–10 snabba intervaller → nedvarvning.',
    'Benpass 45–60 min.\nKnäböj/benpress, höftdominanta övningar och lite bål i slutet.',
    'Aktiv återhämtning (promenad, lätt cykel, yoga) 20–40 min.\nLåg puls, fokus på att må bra i kroppen.',
    'Hel vilodag.\nSov gott, ät bra och ladda mentalt för kommande vecka.',
  ],
  WELLNESS: [
    'Styrka helkropp (ca 30 min).\n2–3 enkla övningar för överkropp, underkropp och core.',
    'Promenad eller lätt cardio (30 min).\nTempo där du kan prata obehindrat.',
    'Yoga eller rörlighet (30 min).\nFokusera på höfter, bröstrygg och skuldror.',
    'Styrka helkropp (ca 30 min).\nLätta vikter eller kroppsvikt, fokus på kvalitet före kvantitet.',
    'Valfri kondition (30–45 min): cykel, gång, simning eller gruppklass.\nVälj något som känns kul.',
    'Utomhusaktivitet (t.ex. hike, simning, cykel, paddling).\nNjut av att vara ute, inte av att ta ut dig.',
    'Vilodag.\nKänn efter i kroppen, ta en lugn promenad om det känns bra – annars helt fri dag.',
  ],
  COMEBACK: [
    'Lätt styrka helkropp (20–30 min).\nMycket låg belastning, fokus på kontroll och rörelsekvalitet.',
    'Promenad eller mycket lätt cardio (20–30 min).\nDu ska kunna andas helt obehindrat.',
    'Hel vilodag.\nPrioritera sömn och låg stress. Lätt stretching om det känns skönt.',
    'Lätt styrka helkropp (20–30 min).\nUpprepa övningar som kändes bra i måndags.',
    'Mycket lätt cardio (20–30 min): lugn cykel, promenad eller vattenlöpning.\nAllt ska kännas kontrollerat.',
    'Längre promenad eller enkel utomhusaktivitet.\nTa pauser ofta och avsluta medan du fortfarande känner dig pigg.',
    'Hel vilodag.\nReflektera över hur kroppen känns och justera kommande vecka vid behov.',
  ],
  EXPLORER: [
    'Styrkepass där du testar nya övningar.\nHelkropp, 30–45 min, lugnt tempo och nyfiket fokus.',
    'Testa något nytt: klättring, kampsport, dans eller gruppklass.\nMålet är upplevelse, inte prestation.',
    'Löpning eller cykel (30–45 min).\nVälj det som känns mest lockande idag.',
    'Styrka igen, men med andra övningar än måndagen.\nKort och lekfullt pass.',
    'Simning, gruppklass eller annan social aktivitet.\nTräning som känns mer som lek än som “jobb”.',
    'Utomhusäventyr: vandring, cykeltur, paddling eller liknande.\nUtforska en ny plats om du kan.',
    'Vilodag.\nKänn efter vad du gillade mest den här veckan och vad du vill göra mer av.',
  ],
} as const;

const EN = {
  IRONMAN: [
    'Strength – upper body & core (45–60 min).\nFocus on press, pull, and stability for swim and bike.',
    'Easy run Zone 2 (45–60 min).\nConversational pace, steady breathing. Build aerobic base without trashing legs.',
    'Swim technique (30–45 min).\nDrills, easy lengths, focus on body position, catch, and rotation.',
    'Bike Zone 2 (60–90 min).\nSteady effort, low heart rate. Smooth, controlled pedalling.',
    'Strength – lower body & core (45–60 min).\nLeg and hip strength plus core for run and bike economy.',
    'Long session (60–90 min run or 90–120 min bike).\nEasy pace, endurance and fueling practice.',
    'Rest or very light activity (walk, easy swim). Your body adapts now – keep it simple.',
  ],
  COMPETITOR: [
    'Full-body strength (45–60 min).\nBasics, power, and solid technique.',
    'Intervals in your main sport.\nWarm-up → 4–8 reps → cool-down. Hard but controlled.',
    'Easy session in your secondary sport (20–40 min).\nEasy pace, movement quality first.',
    'Full-body strength (45–60 min).\nA bit heavier than Monday, still leave 1–2 reps in reserve.',
    'Tempo in your main sport (30–50 min effective).\nJust below race effort, smooth and focused.',
    'Long session in your main sport.\nBuild endurance; practice pacing and fueling.',
    'Rest day. Sleep, food, low stress. An easy walk is fine if it feels good.',
  ],
  RECOMP: [
    'Push session (chest, shoulders, triceps) 45–60 min.\nModerate weight, controlled reps, 2–3 sets each.',
    'Easy cardio 30–40 min (walk, bike, or light run).\nBurn a little extra without beating yourself up.',
    'Pull session (back, biceps) 45–60 min.\nControlled reps, 2–3 sets each.',
    'Simple interval cardio ~25–30 min total.\nShort warm-up → 6–10 quick intervals → cool-down.',
    'Leg session 45–60 min.\nSquat/leg press, hip hinge work, a little core at the end.',
    'Active recovery (walk, easy bike, yoga) 20–40 min.\nLow intensity, focus on feeling good.',
    'Full rest day.\nSleep well, eat well, reset mentally for next week.',
  ],
  WELLNESS: [
    'Full-body strength (~30 min).\n2–3 simple moves for upper, lower, and core.',
    'Walk or light cardio (30 min).\nPace where you can talk easily.',
    'Yoga or mobility (30 min).\nHips, upper back, and shoulders.',
    'Full-body strength (~30 min).\nLight weights or bodyweight, quality over quantity.',
    'Pick-your-own cardio (30–45 min): bike, walk, swim, or class.\nChoose something you enjoy.',
    'Outdoor activity (hike, swim, bike, paddle).\nEnjoy being outside, not max effort.',
    'Rest day.\nListen to your body; easy walk if it feels right, otherwise fully off.',
  ],
  COMEBACK: [
    'Light full-body strength (20–30 min).\nVery easy load, control and movement quality.',
    'Walk or very easy cardio (20–30 min).\nYou should breathe completely freely.',
    'Full rest day.\nPrioritize sleep and low stress. Light stretching if it feels nice.',
    'Light full-body strength (20–30 min).\nRepeat moves that felt good on Monday.',
    'Very easy cardio (20–30 min): easy bike, walk, or pool jog.\nEverything should feel easy.',
    'Longer walk or simple outdoor activity.\nTake breaks often; stop while you still feel fresh.',
    'Full rest day.\nReflect on how you feel and adjust next week if needed.',
  ],
  EXPLORER: [
    'Strength while trying new exercises.\nFull body, 30–45 min, curious and playful.',
    'Try something new: climbing, martial arts, dance, or a class.\nExperience over performance.',
    'Run or bike (30–45 min).\nPick what sounds fun today.',
    'Strength again, different moves than Monday.\nShort and playful.',
    'Swim, group class, or social activity.\nTraining that feels more like play.',
    'Outdoor adventure: hike, ride, paddle, etc.\nExplore somewhere new if you can.',
    'Rest day.\nNotice what you enjoyed most this week and do more of that.',
  ],
} as const;

export function getScheduleProfileBody(
  lang: ScheduleProfileLang,
  archetype: string,
  dayIndex: number,
): string | undefined {
  const pack = lang === 'en' ? EN : SV;
  const row = pack[archetype as keyof typeof SV];
  if (!row) return undefined;
  return row[dayIndex];
}
