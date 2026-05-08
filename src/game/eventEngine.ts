import {
  COACH_EXPERIENCE_PER_LEVEL,
  EVENT_BALANCE,
  MAX_CLUB_RATING,
  MAX_CONDITION,
  MIN_CLUB_RATING,
  MIN_CONDITION,
} from "@/game/balance";
import { chance, pick, randomFloat } from "@/utils/random";
import type {
  ActionLog,
  EventChoice,
  FinanceLog,
  GameState,
  RandomEvent,
  RandomEventType,
  Staff,
  StatEffects,
} from "@/types/game";

type EventTemplate = {
  type: RandomEventType;
  weight: number;
  create: (state: GameState) => RandomEvent;
};

export function maybeGenerateRandomEvent(state: GameState): GameState {
  const pendingEvents = state.events.filter((event) => event.status === "pending");

  if (pendingEvents.length >= EVENT_BALANCE.maxPendingEvents) {
    return state;
  }

  if (!chance(getEventChance(state))) {
    return state;
  }

  const event = createRandomEvent(state);

  if (!event) {
    return state;
  }

  return {
    ...state,
    events: [event, ...state.events],
    actionLogs: [
      createActionLog(
        state,
        "ランダムイベント発生",
        "月次進行中にクラブ状況に応じたイベント判定が成功したため。",
        `${event.title}: ${event.description}`,
        {},
      ),
      ...state.actionLogs,
    ],
  };
}

export function resolveEventChoice(
  state: GameState,
  eventId: string,
  choiceId: string,
): GameState {
  const event = state.events.find((candidate) => candidate.id === eventId);

  if (!event || event.status !== "pending") {
    return state;
  }

  const choice = event.choices.find((candidate) => candidate.id === choiceId);

  if (!choice) {
    return state;
  }

  const resolvedEffects = resolveChoiceEffects(state, event, choice);
  const { nextState, appliedEffects } = applyEventEffects(state, event, choice, resolvedEffects);
  const resolvedEvent: RandomEvent = {
    ...event,
    status: "resolved",
    selectedChoiceId: choice.id,
  };
  const financeLog = createFinanceLog(nextState, event, choice, appliedEffects.money);

  return {
    ...nextState,
    events: nextState.events.map((candidate) =>
      candidate.id === event.id ? resolvedEvent : candidate,
    ),
    actionLogs: [
      createActionLog(
        nextState,
        `イベント解決: ${event.title}`,
        choice.description,
        buildChoiceResult(event, choice, appliedEffects),
        appliedEffects,
      ),
      ...nextState.actionLogs,
    ],
    financeLogs: financeLog ? [financeLog, ...nextState.financeLogs] : nextState.financeLogs,
  };
}

export function createRandomEvent(state: GameState): RandomEvent | null {
  const templates = getAvailableEventTemplates(state);

  if (templates.length === 0) {
    return null;
  }

  return weightedPick(templates).create(state);
}

function getAvailableEventTemplates(state: GameState): EventTemplate[] {
  const templates: EventTemplate[] = [
    { type: "sponsor_offer", weight: 28 + state.club.sponsorPower, create: createSponsorOfferEvent },
    { type: "youth_growth", weight: 24 + state.coach.development, create: createYouthGrowthEvent },
    { type: "minor_injury", weight: state.club.condition < 55 ? 24 : 14, create: createMinorInjuryEvent },
    {
      type: "local_popularity",
      weight:
        20 +
        (state.club.policy === "local_first" ? 20 : 0) +
        (state.staff.some((member) => member.role === "pr") ? 12 : 0),
      create: createLocalPopularityEvent,
    },
  ];
  const unhappyStaff = getMostUnhappyStaff(state);

  if (unhappyStaff) {
    templates.push({
      type: "staff_dissatisfaction",
      weight: 34 + unhappyStaff.dissatisfaction,
      create: createStaffDissatisfactionEvent,
    });
  }

  return templates;
}

function createSponsorOfferEvent(state: GameState): RandomEvent {
  return {
    id: createEventId(state, "sponsor_offer"),
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    type: "sponsor_offer",
    category: "chance",
    title: "スポンサー打診",
    description: "地元企業からスポンサー契約の打診が届きました。",
    status: "pending",
    choices: [
      createChoice("sign", "契約する", "安定した条件でスポンサー契約を結びます。", {
        money: EVENT_BALANCE.mediumMoneyReward,
        sponsorPower: 1,
      }),
      createChoice("negotiate", "条件交渉する", "より良い条件を狙います。失敗しても小さな契約は残ります。", {
        money: EVENT_BALANCE.largeMoneyReward,
        sponsorPower: 2,
      }),
      createChoice("decline", "断る", "クラブ方針に合わない案件として丁寧に断ります。", {
        reputation: EVENT_BALANCE.smallReputationChange,
      }),
    ],
  };
}

function createYouthGrowthEvent(state: GameState): RandomEvent {
  return {
    id: createEventId(state, "youth_growth"),
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    type: "youth_growth",
    category: "chance",
    title: "若手成長",
    description: "若手選手が練習で目立つ成長を見せています。",
    status: "pending",
    choices: [
      createChoice("invest", "育成に投資する", "個別育成に投資し、戦力と監督経験を伸ばします。", {
        money: -60_000,
        teamPower: 2,
        coachExperience: 18,
        coachDevelopment: 1,
      }),
      createChoice("watch", "様子を見る", "大きな支出をせず、自然な成長を待ちます。", {
        teamPower: 1,
      }),
      createChoice("promote", "トップ起用する", "トップチームで試します。成功すれば大きな刺激になります。", {
        teamPower: 2,
        teamwork: -1,
      }),
    ],
  };
}

function createStaffDissatisfactionEvent(state: GameState): RandomEvent {
  const targetStaff = getMostUnhappyStaff(state);

  return {
    id: createEventId(state, "staff_dissatisfaction"),
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    type: "staff_dissatisfaction",
    category: "decision",
    title: "スタッフ不満",
    description: `${targetStaff?.name ?? "スタッフ"}が業務負荷や待遇に不満を感じています。`,
    status: "pending",
    targetStaffId: targetStaff?.id,
    choices: [
      createChoice("talk", "面談する", "時間を取り、状況を聞いて不満を下げます。", {
        staffDissatisfaction: EVENT_BALANCE.staffTalkDissatisfactionChange,
      }),
      createChoice("raise", "給与を上げる", "短期的な支出と引き換えに忠誠心と不満を改善します。", {
        money: -EVENT_BALANCE.staffRaiseCost,
        staffLoyalty: EVENT_BALANCE.staffRaiseLoyaltyGain,
        staffDissatisfaction: EVENT_BALANCE.staffRaiseDissatisfactionChange,
      }),
      createChoice("ignore", "放置する", "今は対応せず様子を見ます。不満は少し高まります。", {
        staffDissatisfaction: EVENT_BALANCE.dissatisfactionChange,
      }),
    ],
  };
}

function createMinorInjuryEvent(state: GameState): RandomEvent {
  return {
    id: createEventId(state, "minor_injury"),
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    type: "minor_injury",
    category: "trouble",
    title: "選手軽傷",
    description: "主力候補の一人に軽い違和感が出ています。",
    status: "pending",
    choices: [
      createChoice("rest", "休ませる", "無理をさせず、チーム全体の状態を整えます。", {
        condition: 6,
        teamPower: -1,
      }),
      createChoice("push", "無理させる", "短期的な戦力維持を優先しますが、状態は悪化します。", {
        condition: -10,
      }),
      createChoice("care", "ケアに投資する", "ケアに資金を使い、コンディション回復を狙います。", {
        money: -EVENT_BALANCE.injuryCareCost,
        condition: 10,
      }),
    ],
  };
}

function createLocalPopularityEvent(state: GameState): RandomEvent {
  return {
    id: createEventId(state, "local_popularity"),
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    type: "local_popularity",
    category: "chance",
    title: "地域人気上昇",
    description: "地域でクラブの話題が増えています。",
    status: "pending",
    choices: [
      createChoice("expand_event", "地域イベントを拡大", "費用をかけて地域接点を増やします。", {
        money: -40_000,
        fans: 90,
        reputation: 1,
      }),
      createChoice("social_spread", "SNSで拡散", "低コストで話題を広げます。", {
        fans: 55,
        reputation: 1,
      }),
      createChoice("natural", "自然増に任せる", "支出せず自然なファン増を受け取ります。", {
        fans: 25,
      }),
    ],
  };
}

function resolveChoiceEffects(
  state: GameState,
  event: RandomEvent,
  choice: EventChoice,
): StatEffects {
  if (event.type === "sponsor_offer" && choice.id === "negotiate") {
    return chance(EVENT_BALANCE.negotiationSuccessChance)
      ? choice.effects
      : { money: EVENT_BALANCE.smallMoneyReward, sponsorPower: 1 };
  }

  if (event.type === "youth_growth" && choice.id === "promote") {
    return chance(EVENT_BALANCE.topSelectionSuccessChance)
      ? { teamPower: 3, teamwork: 1, coachExperience: 10 }
      : { teamPower: 1, teamwork: -2, coachExperience: 8 };
  }

  if (event.type === "local_popularity" && state.club.policy === "local_first") {
    return {
      ...choice.effects,
      fans: (choice.effects.fans ?? 0) + 15,
    };
  }

  return choice.effects;
}

function applyEventEffects(
  state: GameState,
  event: RandomEvent,
  choice: EventChoice,
  effects: StatEffects,
): { nextState: GameState; appliedEffects: StatEffects } {
  const nextMoney = state.club.money + (effects.money ?? 0);
  const nextFans = Math.max(0, state.club.fans + (effects.fans ?? 0));
  const nextReputation = clampRating(state.club.reputation + (effects.reputation ?? 0));
  const nextTeamPower = clampRating(state.club.teamPower + (effects.teamPower ?? 0));
  const nextTeamwork = clampRating(state.club.teamwork + (effects.teamwork ?? 0));
  const nextCondition = clamp(state.club.condition + (effects.condition ?? 0), MIN_CONDITION, MAX_CONDITION);
  const nextSponsorPower = clampRating(state.club.sponsorPower + (effects.sponsorPower ?? 0));
  const coachUpdate = applyCoachEffects(state, effects);
  const nextStaff = applyStaffEffects(state.staff, event, effects, choice.id === "raise");

  return {
    nextState: {
      ...state,
      club: {
        ...state.club,
        money: nextMoney,
        fans: nextFans,
        reputation: nextReputation,
        teamPower: nextTeamPower,
        teamwork: nextTeamwork,
        condition: nextCondition,
        sponsorPower: nextSponsorPower,
      },
      coach: coachUpdate.coach,
      staff: nextStaff,
    },
    appliedEffects: {
      money: nextMoney - state.club.money,
      fans: nextFans - state.club.fans,
      reputation: nextReputation - state.club.reputation,
      teamPower: nextTeamPower - state.club.teamPower,
      teamwork: nextTeamwork - state.club.teamwork,
      condition: nextCondition - state.club.condition,
      sponsorPower: nextSponsorPower - state.club.sponsorPower,
      coachExperience: coachUpdate.experienceDelta,
      coachLevel: coachUpdate.levelDelta,
      coachDevelopment: coachUpdate.developmentDelta,
      staffDissatisfaction: effects.staffDissatisfaction,
      staffLoyalty: effects.staffLoyalty,
    },
  };
}

function applyCoachEffects(state: GameState, effects: StatEffects) {
  const experienceGain = effects.coachExperience ?? 0;
  const totalExperience = state.coach.experience + experienceGain;
  const levelGain = Math.floor(totalExperience / COACH_EXPERIENCE_PER_LEVEL);
  const nextExperience = totalExperience % COACH_EXPERIENCE_PER_LEVEL;
  const developmentDelta = (effects.coachDevelopment ?? 0) + levelGain;

  return {
    coach: {
      ...state.coach,
      level: state.coach.level + levelGain,
      experience: nextExperience,
      development: clampRating(state.coach.development + developmentDelta),
    },
    experienceDelta: experienceGain,
    levelDelta: levelGain,
    developmentDelta,
  };
}

function applyStaffEffects(
  staff: Staff[],
  event: RandomEvent,
  effects: StatEffects,
  raiseSalary: boolean,
): Staff[] {
  if (!event.targetStaffId) {
    return staff;
  }

  return staff.map((member) => {
    if (member.id !== event.targetStaffId) {
      return member;
    }

    return {
      ...member,
      dissatisfaction: clampRating(member.dissatisfaction + (effects.staffDissatisfaction ?? 0)),
      loyalty: clampRating(member.loyalty + (effects.staffLoyalty ?? 0)),
      salary: raiseSalary ? member.salary + 8_000 : member.salary,
    };
  });
}

function getEventChance(state: GameState): number {
  let eventChance = EVENT_BALANCE.eventChancePerTurn;

  if (state.club.policy === "local_first") {
    eventChance += EVENT_BALANCE.localFirstBonusChance;
  }
  if (state.staff.some((member) => member.role === "pr")) {
    eventChance += EVENT_BALANCE.prStaffBonusChance;
  }
  if (getMostUnhappyStaff(state)) {
    eventChance += EVENT_BALANCE.highDissatisfactionBonusChance;
  }

  return Math.min(0.75, eventChance);
}

function getMostUnhappyStaff(state: GameState): Staff | null {
  const unhappyStaff = state.staff
    .filter((member) => member.dissatisfaction >= 55)
    .sort((a, b) => b.dissatisfaction - a.dissatisfaction);

  return unhappyStaff[0] ?? null;
}

function weightedPick(templates: EventTemplate[]): EventTemplate {
  const total = templates.reduce((sum, template) => sum + template.weight, 0);
  let cursor = randomFloat(0, total);

  for (const template of templates) {
    cursor -= template.weight;
    if (cursor <= 0) {
      return template;
    }
  }

  return pick(templates);
}

function createChoice(
  id: string,
  label: string,
  description: string,
  effects: StatEffects,
): EventChoice {
  return {
    id,
    label,
    description,
    effects,
    requiresApproval: false,
  };
}

function createActionLog(
  state: GameState,
  actionName: string,
  reason: string,
  result: string,
  effects: StatEffects,
): ActionLog {
  return {
    id: `event-log-${state.club.turn}-${Date.now()}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    actorType: "system",
    actorName: "System",
    actionName,
    reason,
    result,
    effects,
  };
}

function createFinanceLog(
  state: GameState,
  event: RandomEvent,
  choice: EventChoice,
  moneyChange: number | undefined,
): FinanceLog | null {
  if (!moneyChange) {
    return null;
  }

  return {
    id: `finance-event-${event.id}-${choice.id}`,
    turn: state.club.turn,
    year: state.currentYear,
    month: state.currentMonth,
    category: "event",
    amount: moneyChange,
    description: `${event.title}: ${choice.label}`,
  };
}

function buildChoiceResult(
  event: RandomEvent,
  choice: EventChoice,
  effects: StatEffects,
): string {
  if (event.type === "sponsor_offer" && choice.id === "negotiate") {
    return (effects.money ?? 0) >= EVENT_BALANCE.largeMoneyReward
      ? "条件交渉が成功し、より良いスポンサー条件を獲得しました。"
      : "条件交渉は控えめな結果でしたが、小さな契約を確保しました。";
  }

  if (event.type === "youth_growth" && choice.id === "promote") {
    return (effects.teamwork ?? 0) >= 0
      ? "トップ起用が良い刺激になり、若手とチームに成長がありました。"
      : "トップ起用は少し早く、連携面に課題が出ました。経験は残っています。";
  }

  return `${choice.label}を選択しました。${choice.description}`;
}

function createEventId(state: GameState, type: RandomEventType): string {
  return `event-${type}-${state.club.turn}-${Date.now()}`;
}

function clampRating(value: number): number {
  return clamp(value, MIN_CLUB_RATING, MAX_CLUB_RATING);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
