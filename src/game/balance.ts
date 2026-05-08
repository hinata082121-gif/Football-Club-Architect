import type {
  CoachSelectionPolicy,
  LoanType,
  PlayerActionType,
  PlayerPosition,
  PlayerStatus,
  RecoveryActionType,
  ScoutFocus,
  StaffActionType,
  StatEffects,
  TrainingMatchType,
} from "@/types/game";

export const BASE_ACTION_POINTS = 3;
export const MAX_CONDITION = 100;
export const MIN_CONDITION = 0;
export const MAX_CLUB_RATING = 100;
export const MIN_CLUB_RATING = 0;
export const COACH_EXPERIENCE_PER_LEVEL = 100;

export const INITIAL_CLUB_BALANCE = {
  money: 1_000_000,
  fans: 300,
  reputation: 10,
  teamPower: 35,
  teamwork: 30,
  condition: 70,
  actionPoints: BASE_ACTION_POINTS,
  maxActionPoints: BASE_ACTION_POINTS,
  turn: 1,
  clubLevel: 1,
  stadiumCapacity: 1_000,
  goodsPower: 5,
  sponsorPower: 5,
} as const;

export const INITIAL_COACH_BALANCE = {
  level: 1,
  tactics: 25,
  playerSelection: 25,
  inGameManagement: 20,
  development: 30,
  motivation: 30,
  charisma: 20,
  aiJudgment: 25,
  experience: 0,
} as const;

export const PLAYER_ACTION_COSTS: Record<PlayerActionType, number> = {
  recruit_player: 1,
  train_coach: 1,
  do_pr: 1,
  sponsor_sales: 1,
  hire_staff: 1,
  improve_teamwork: 1,
  rest_team: 1,
};

export const PLAYER_ACTION_EFFECTS: Record<PlayerActionType, StatEffects> = {
  recruit_player: {
    money: -45_000,
    reputation: 1,
  },
  train_coach: {
    money: -80_000,
    coachExperience: 35,
    reputation: 1,
  },
  do_pr: {
    money: -50_000,
    fans: 80,
    reputation: 1,
  },
  sponsor_sales: {
    money: 80_000,
    sponsorPower: 1,
  },
  hire_staff: {
    money: -120_000,
    reputation: 1,
  },
  improve_teamwork: {
    money: -60_000,
    teamwork: 4,
    condition: -3,
  },
  rest_team: {
    condition: 15,
    teamwork: 1,
  },
};

export const STAFF_SALARY_BASE = {
  scout: 45_000,
  pr: 40_000,
  sales: 42_000,
  analyst: 48_000,
  goods: 38_000,
  facility: 44_000,
} as const;

export const STAFF_ACTION_BASE_EFFECTS: Record<StaffActionType, StatEffects> = {
  scout_young_player: { money: -25_000 },
  scout_value_player: { money: -15_000 },
  analyze_squad_depth: {},
  social_post: { money: -8_000, fans: 15 },
  local_event: { money: -28_000, fans: 45, reputation: 1 },
  star_pr: { money: -45_000, fans: 60, reputation: 1 },
  wasteful_ad: { money: -55_000, fans: 12 },
  small_sponsor: { money: 25_000, sponsorPower: 1 },
  local_business: { money: 35_000, reputation: 1 },
  risky_big_pitch: { money: 100_000, sponsorPower: 2 },
  opponent_analysis: { teamwork: 1, coachExperience: 8 },
  tactics_review: { teamwork: 2 },
  coach_feedback: { coachExperience: 15 },
  basic_goods_campaign: { money: 10_000, goodsPower: 1 },
  limited_goods: { money: 20_000, fans: 10, reputation: 1 },
  overproduce_goods: { money: -45_000, goodsPower: 1 },
  maintain_training_ground: { money: -25_000, condition: 4, teamwork: 1 },
  improve_stadium_ops: { money: -35_000, stadiumCapacity: 20, sponsorPower: 1 },
  inefficient_maintenance: { money: -40_000, condition: 1 },
};

export const MATCH_BALANCE = {
  officialEntryFee: 100_000,
  officialOpponentVariance: 8,
  homeAdvantage: 5,
  luckRange: 12,
  conditionWeight: 0.25,
  teamworkWeight: 0.2,
  coachWeight: 0.3,
  tacticsWeight: 0.16,
  inGameManagementWeight: 0.14,
  motivationWeight: 0.12,
  coachLevelWeight: 1.8,
  winReputationGain: 2,
  drawReputationGain: 1,
  lossReputationChange: -1,
  conditionLossPerMatch: 8,
  teamworkGainChance: 0.55,
  teamworkGainOnMatch: 1,
  coachExperienceGain: 18,
  winFansGain: 45,
  drawFansGain: 16,
  lossFansChange: -6,
  winMoneyGain: 140_000,
  drawMoneyGain: 75_000,
  lossMoneyGain: 25_000,
  decisivePowerDifference: 18,
  closePowerDifference: 7,
} as const;

export const TRAINING_MATCH_BALANCE: Record<
  TrainingMatchType,
  {
    actionPointCost: number;
    money: number;
    fans: number;
    reputation: number;
    teamPower: number;
    teamwork: number;
    condition: number;
    coachExperience: number;
    opponentPowerModifier: number;
  }
> = {
  weaker: {
    actionPointCost: 1,
    money: 15_000,
    fans: 8,
    reputation: 0,
    teamPower: 1,
    teamwork: 2,
    condition: -4,
    coachExperience: 8,
    opponentPowerModifier: -10,
  },
  equal: {
    actionPointCost: 1,
    money: 25_000,
    fans: 12,
    reputation: 0,
    teamPower: 1,
    teamwork: 3,
    condition: -6,
    coachExperience: 12,
    opponentPowerModifier: 0,
  },
  stronger: {
    actionPointCost: 1,
    money: 35_000,
    fans: 20,
    reputation: 1,
    teamPower: 1,
    teamwork: 4,
    condition: -8,
    coachExperience: 18,
    opponentPowerModifier: 12,
  },
  local: {
    actionPointCost: 1,
    money: 30_000,
    fans: 25,
    reputation: 1,
    teamPower: 1,
    teamwork: 2,
    condition: -5,
    coachExperience: 10,
    opponentPowerModifier: -5,
  },
  youth: {
    actionPointCost: 1,
    money: 10_000,
    fans: 10,
    reputation: 0,
    teamPower: 1,
    teamwork: 3,
    condition: -3,
    coachExperience: 14,
    opponentPowerModifier: -15,
  },
};

export const EVENT_BALANCE = {
  eventChancePerTurn: 0.25,
  maxPendingEvents: 3,
  localFirstBonusChance: 0.12,
  prStaffBonusChance: 0.08,
  highDissatisfactionBonusChance: 0.2,
  smallMoneyReward: 50_000,
  mediumMoneyReward: 120_000,
  largeMoneyReward: 180_000,
  negotiationSuccessChance: 0.55,
  topSelectionSuccessChance: 0.55,
  smallReputationChange: 1,
  fanEventGain: 40,
  dissatisfactionChange: 8,
  staffTalkDissatisfactionChange: -12,
  staffRaiseDissatisfactionChange: -20,
  staffRaiseLoyaltyGain: 8,
  staffRaiseCost: 50_000,
  injuryCareCost: 45_000,
} as const;

export const ECONOMY_BALANCE = {
  monthlyFixedCost: 80_000,
  fanIncomeRate: 20,
  goodsIncomeRate: 700,
  sponsorIncomeRate: 1_000,
  minimumCashWarning: 200_000,
  staffHiringCost: 120_000,
  salaryBurdenWarningRatio: 0.75,
} as const;

export const FINANCE_HEALTH_THRESHOLDS = {
  cautionMoney: 300_000,
  cashShortageMoney: 0,
  financialCrisisMoney: -500_000,
  insolvencyWarningMoney: -1_500_000,
  insolvencyLine: -3_000_000,
  bankruptcyGraceMonths: 3,
} as const;

export const BANKRUPTCY_BALANCE = {
  finalWarningMonth: 2,
  downsizeRestartMoney: 250_000,
  downsizeClubLevelLoss: 2,
  downsizeReputationLoss: 8,
  downsizeFanRate: 0.65,
  downsizeStadiumRate: 0.75,
  downsizePlayerKeepCount: 16,
  downsizeStaffKeepCount: 2,
  downsizeLoanPrincipalRate: 0.35,
  fireSalePlayerCount: 3,
  fireSaleIncomeRate: 0.22,
  fireSaleReputationLoss: 4,
  fireSaleFanLossRate: 0.12,
  reduceStaffCount: 2,
  reduceStaffSeveranceMonths: 1,
} as const;

export const LOAN_BALANCE = {
  maxActiveLoans: 3,
  maxTotalDebt: 4_000_000,
  shortTermAmount: 500_000,
  longTermAmount: 2_000_000,
  emergencyAmount: 1_500_000,
  regionalSupportAmount: 1_000_000,
  ownerInjectionAmount: 700_000,
  minimumLongTermReputation: 18,
  minimumLongTermSponsorPower: 8,
  minimumRegionalFans: 700,
  ownerInjectionUseLimit: 1,
  interestRates: {
    short_term: 0.18,
    long_term: 0.12,
    emergency: 0.24,
    regional_support: 0.06,
    owner_injection: 0,
  } satisfies Record<LoanType, number>,
  loanTerms: {
    short_term: 6,
    long_term: 30,
    emergency: 12,
    regional_support: 18,
    owner_injection: 0,
  } satisfies Record<LoanType, number>,
} as const;

export const RECOVERY_ACTION_BALANCE = {
  sponsorAdvance: {
    minimumSponsorPower: 3,
    baseAmount: 450_000,
    reputationMultiplier: 8_000,
    sponsorPowerMultiplier: 35_000,
    durationMonths: 6,
    monthlyPenalty: 120_000,
    reputationEffect: -1,
    maxAmount: 900_000,
  },
  emergencySponsorPitch: {
    actionPointCost: 1,
    baseSuccessChance: 0.35,
    reputationWeight: 0.005,
    sponsorPowerWeight: 0.025,
    salesStaffSpecialtyWeight: 0.003,
    maxSuccessChance: 0.82,
    successMoneyMin: 500_000,
    successMoneyMax: 1_000_000,
    failureMoney: 100_000,
    successSponsorPowerGain: 1,
    failureReputationEffect: -1,
  },
  costCuttingCampaign: {
    actionPointCost: 1,
    money: 180_000,
    staffDissatisfaction: 8,
    maxExecutionsPerMonth: 1,
  },
  goodsClearance: {
    minimumGoodsPower: 2,
    baseMoney: 80_000,
    moneyPerGoodsPower: 20_000,
    goodsPowerEffect: -1,
    reputationEffect: -1,
  },
  ticketPriceIncrease: {
    minimumFans: 120,
    baseMoney: 90_000,
    moneyPerFan: 80,
    fanEffect: -35,
    reputationEffect: -1,
  },
  actionTypes: [
    "sponsor_advance",
    "emergency_sponsor_pitch",
    "cost_cutting_campaign",
    "goods_clearance",
    "ticket_price_increase",
  ] satisfies RecoveryActionType[],
} as const;

export const TURN_BALANCE = {
  naturalConditionRecovery: 4,
  paidStaffDissatisfactionChange: -1,
  lowCashStaffDissatisfactionChange: 1,
  debtStaffDissatisfactionChange: 3,
  lowConditionWarning: 35,
  highDissatisfactionWarning: 70,
} as const;

export const STAFF_GENERATION_BALANCE = {
  minLevel: 1,
  maxLevel: 2,
  minJudgment: 24,
  maxJudgment: 42,
  minGrowth: 45,
  maxGrowth: 82,
  minLoyalty: 45,
  maxLoyalty: 78,
  minDissatisfaction: 0,
  maxDissatisfaction: 12,
  minAiAccuracy: 28,
  maxAiAccuracy: 45,
  salaryVariance: 8_000,
} as const;

export const STAFF_AI_BALANCE = {
  proposalOnlyDelegationLevel: 1,
  lowRiskAutoDelegationLevel: 2,
  normalRiskAutoDelegationLevel: 3,
  highRiskAutoDelegationLevel: 4,
  majorExpenseThreshold: 90_000,
  highExpenseThreshold: 50_000,
  minEffectMultiplier: 0.6,
  maxEffectMultiplier: 1.35,
  lowSkillNoise: 45,
  highSkillNoise: 8,
  poorActionBadDecisionBonus: 24,
  goodActionBadDecisionPenalty: 18,
  personalityScoreBonus: 14,
  lowCashThreshold: 250_000,
  strongClubThreshold: 55,
  popularClubFanThreshold: 900,
} as const;

export const PLAYER_GENERATION_BALANCE = {
  initialSquadSize: 18,
  initialPositionCounts: {
    GK: 2,
    DF: 6,
    MF: 6,
    FW: 4,
  } satisfies Record<PlayerPosition, number>,
  initialStartingCounts: {
    GK: 1,
    DF: 4,
    MF: 4,
    FW: 2,
  } satisfies Record<PlayerPosition, number>,
  age: {
    min: 17,
    max: 36,
  },
  overall: {
    min: 20,
    max: 45,
  },
  potential: {
    min: 35,
    max: 70,
  },
  growth: {
    min: 20,
    max: 80,
  },
  condition: {
    min: 65,
    max: 95,
  },
  morale: {
    min: 50,
    max: 80,
  },
  contractMonths: {
    min: 6,
    max: 36,
    veteranMax: 18,
    olderMax: 12,
  },
  birthdayMonths: {
    min: 1,
    max: 12,
  },
  ageProfileWeights: {
    young: 28,
    growth: 30,
    prime: 26,
    veteran: 12,
    older: 4,
  },
  salary: {
    base: 4_000,
    overallMultiplier: 350,
    potentialMultiplier: 50,
    min: 8_000,
    max: 38_000,
    roundTo: 1_000,
    positionMultiplier: {
      GK: 0.95,
      DF: 0.98,
      MF: 1,
      FW: 1.08,
    } satisfies Record<PlayerPosition, number>,
    youngDiscount: 0.86,
    veteranDiscount: 0.9,
  },
  marketValue: {
    base: 80_000,
    overallMultiplier: 28_000,
    potentialMultiplier: 10_000,
    growthMultiplier: 4_000,
    min: 120_000,
    max: 3_800_000,
    roundTo: 10_000,
    youngPremium: 1.25,
    primeMultiplier: 1,
    veteranDiscount: 0.72,
    olderDiscount: 0.5,
  },
} as const;

export const PLAYER_DEVELOPMENT_BALANCE = {
  maxOverall: 100,
  minOverall: 1,
  maxPotential: 100,
  minPotential: 20,
  monthlyExperienceDecay: 0.88,
  potentialGrowthCapBuffer: 2,
  youthPolicyGrowthBonus: 0.18,
  homegrownGrowthBonus: 0.04,
  coachDevelopmentWeight: 0.003,
  growthBaseDivisor: 135,
  experienceWeight: 0.006,
  appearanceWeight: 0.018,
  trainingAppearanceWeight: 0.025,
  primeSmallGrowthChance: 0.14,
  veteranDeclineChance: 0.08,
  decliningDeclineChance: 0.28,
  retirementRiskDeclineChance: 0.46,
  lowConditionDeclineBonusChance: 0.1,
  moraleDeclineProtection: 0.08,
  coachMotivationDeclineProtection: 0.08,
  potentialDeclineAge: 34,
  potentialDeclineChance: 0.2,
  maxMonthlyGrowth: 2,
  maxMonthlyDecline: 2,
  experience: {
    league: {
      starting: 10,
      bench: 4,
      reserve: 0,
    },
    cup: {
      starting: 9,
      bench: 4,
      reserve: 0,
    },
    training: {
      starting: 6,
      bench: 4,
      reserve: 1,
      youthBonus: 3,
      youthFocusedBonus: 4,
    },
  },
  maxDevelopmentLogItems: 6,
} as const;

export const CONTRACT_BALANCE = {
  expiringSoonMonths: 3,
  renewalMonths: [12, 24, 36],
  renewalCostRate: 0.18,
  renewalCostMin: 20_000,
  renewalCostMax: 600_000,
  renewalRoundTo: 10_000,
  salaryIncreaseRate: {
    12: 0.04,
    24: 0.08,
    36: 0.12,
  } satisfies Record<12 | 24 | 36, number>,
  highSalaryThreshold: 32_000,
  salaryBurdenWarningRatio: 0.42,
  retirement: {
    startAge: 37,
    highRiskAge: 40,
    baseRiskAtStartAge: 10,
    ageRiskStep: 9,
    lowConditionBonus: 8,
    highMoraleReduction: 6,
    highOverallReduction: 5,
    monthlyAnnouncementScale: 0.08,
    maxMonthlyAnnouncementChance: 0.18,
  },
} as const;

export const TEAM_POWER_BALANCE = {
  minTeamPower: 1,
  maxTeamPower: 100,
  expectedStartingCount: 11,
  expectedBenchCount: 7,
  missingStarterPenalty: 2.5,
  missingBenchPenalty: 0.5,
  benchDepthWeight: 0.15,
  conditionNeutral: 75,
  conditionWeight: 0.08,
  minConditionModifier: -6,
  maxConditionModifier: 4,
  teamworkNeutral: 50,
  teamworkWeight: 0.05,
  minTeamworkModifier: -5,
  maxTeamworkModifier: 5,
  coachNeutral: 40,
  coachSelectionWeight: 0.04,
  coachTacticsWeight: 0.035,
  coachLevelWeight: 0.2,
  minCoachModifier: -3,
  maxCoachModifier: 6,
} as const;

export const COACH_SELECTION_BALANCE = {
  startingCounts: {
    GK: 1,
    DF: 4,
    MF: 4,
    FW: 2,
  } satisfies Record<PlayerPosition, number>,
  startingCount: 11,
  benchCount: 7,
  unavailableStatuses: ["injured", "transfer_listed", "leaving", "retired"] satisfies PlayerStatus[],
  highSkillNoise: 1.5,
  lowSkillNoise: 8,
  minSelectionSkill: 20,
  maxSelectionSkill: 95,
  policyWeights: {
    best_overall: {
      overall: 1.25,
      potential: 0.08,
      growth: 0.04,
      condition: 0.18,
      morale: 0.08,
      youth: 0,
      veteran: 0,
    },
    youth_development: {
      overall: 0.72,
      potential: 0.35,
      growth: 0.24,
      condition: 0.14,
      morale: 0.08,
      youth: 6,
      veteran: -4,
    },
    condition_first: {
      overall: 0.86,
      potential: 0.08,
      growth: 0.06,
      condition: 0.42,
      morale: 0.1,
      youth: 0,
      veteran: 0,
    },
    balanced: {
      overall: 0.96,
      potential: 0.16,
      growth: 0.1,
      condition: 0.24,
      morale: 0.12,
      youth: 1,
      veteran: 1,
    },
    veteran_stability: {
      overall: 0.94,
      potential: 0.05,
      growth: 0.02,
      condition: 0.18,
      morale: 0.26,
      youth: -3,
      veteran: 5,
    },
    rotation: {
      overall: 0.82,
      potential: 0.18,
      growth: 0.14,
      condition: 0.36,
      morale: 0.12,
      youth: 2,
      veteran: 0,
    },
  } satisfies Record<
    CoachSelectionPolicy,
    {
      overall: number;
      potential: number;
      growth: number;
      condition: number;
      morale: number;
      youth: number;
      veteran: number;
    }
  >,
} as const;

export const SCOUT_BALANCE = {
  defaultCount: 2,
  maxActiveReports: 12,
  reportExpiryMonths: 3,
  fallbackAccuracy: 42,
  minAccuracy: 20,
  maxAccuracy: 92,
  minConfidence: 25,
  maxConfidence: 95,
  estimateMinError: 1,
  estimateMaxError: 14,
  levelConfidenceBonus: 4,
  highAccuracyThreshold: 70,
  lowAccuracyThreshold: 38,
  salaryEstimateNoiseRate: 0.18,
  marketValueEstimateNoiseRate: 0.22,
  localSalaryDiscount: 0.9,
} as const;

export const TRANSFER_BALANCE = {
  maxPlayers: 30,
  minPlayers: 16,
  signingCostRate: 0.18,
  signingCostMin: 60_000,
  signingCostMax: 900_000,
  signingCostRoundTo: 10_000,
  focusSigningCostMultiplier: {
    youth: 1.08,
    immediate: 1.18,
    low_cost: 0.78,
    high_potential: 1.2,
    position_specific: 1,
    local: 0.88,
    data_driven: 1.02,
    balanced: 1,
  } satisfies Record<ScoutFocus, number>,
  releaseIncomeRate: 0.1,
  shortContractIncomeMultiplier: 0.35,
  longContractPenaltySalaryMonths: 2,
  releasePenaltyRate: 0.18,
  releasePenaltyMax: 250_000,
  releaseRoundTo: 10_000,
} as const;
