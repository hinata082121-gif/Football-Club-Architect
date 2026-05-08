/**
 * Club policy is the president-level strategy that should influence AI choices,
 * event outcomes, sponsorship fit, and long-term growth balance.
 */
export type ClubPolicy =
  | "youth_development"
  | "win_now"
  | "local_first"
  | "commercial"
  | "data_driven"
  | "star_power"
  | "conservative"
  | "aggressive_investment";

export type StaffRole = "scout" | "pr" | "sales" | "analyst" | "goods" | "facility";

export type StaffPersonality =
  | "steady"
  | "aggressive"
  | "frugal"
  | "ambitious"
  | "craftsman"
  | "popular";

/**
 * 0: 自分で担当
 * 1: 提案のみ
 * 2: 小規模行動のみ自動
 * 3: 通常委任
 * 4: 完全委任
 */
export type DelegationLevel = 0 | 1 | 2 | 3 | 4;

export type MatchType = "league" | "cup" | "training";

export type MatchResult = "win" | "draw" | "lose" | "pending";

export type OpponentPlayStyle =
  | "balanced"
  | "attacking"
  | "defensive"
  | "youth"
  | "commercial"
  | "data_driven";

export type ScoutFocus =
  | "youth"
  | "immediate"
  | "low_cost"
  | "high_potential"
  | "position_specific"
  | "local"
  | "data_driven"
  | "balanced";

export type CoachSelectionPolicy =
  | "best_overall"
  | "youth_development"
  | "condition_first"
  | "balanced"
  | "veteran_stability"
  | "rotation";

export type PlayerPosition = "GK" | "DF" | "MF" | "FW";

export type PlayerStatus =
  | "starting"
  | "bench"
  | "reserve"
  | "injured"
  | "transfer_listed"
  | "leaving"
  | "retired";

export type PlayerDevelopmentStage =
  | "prospect"
  | "developing"
  | "prime"
  | "veteran"
  | "declining"
  | "retirement_risk";

export type PlayerActionType =
  | "recruit_player"
  | "train_coach"
  | "do_pr"
  | "sponsor_sales"
  | "hire_staff"
  | "improve_teamwork"
  | "rest_team";

export type StaffActionType =
  | "scout_young_player"
  | "scout_value_player"
  | "analyze_squad_depth"
  | "social_post"
  | "local_event"
  | "star_pr"
  | "wasteful_ad"
  | "small_sponsor"
  | "local_business"
  | "risky_big_pitch"
  | "opponent_analysis"
  | "tactics_review"
  | "coach_feedback"
  | "basic_goods_campaign"
  | "limited_goods"
  | "overproduce_goods"
  | "maintain_training_ground"
  | "improve_stadium_ops"
  | "inefficient_maintenance";

export type StaffActionRisk = "low" | "normal" | "high" | "major";

export type TrainingMatchType = "weaker" | "equal" | "stronger" | "local" | "youth";

export type ActionActorType = "player" | "staff" | "coach" | "system";

export type FinanceCategory =
  | "initial"
  | "ticket"
  | "sponsor"
  | "goods"
  | "salary"
  | "player_salary"
  | "staff_hiring"
  | "facility"
  | "training_match"
  | "event"
  | "loan"
  | "loan_repayment"
  | "recovery"
  | "other";

export type GameEventStatus = "pending" | "resolved" | "expired";
export type RandomEventCategory = "chance" | "decision" | "trouble";
export type RandomEventType =
  | "sponsor_offer"
  | "youth_growth"
  | "staff_dissatisfaction"
  | "minor_injury"
  | "local_popularity";

export type ContractAlertType =
  | "expiring_soon"
  | "expired"
  | "high_salary"
  | "retirement_risk"
  | "renewal_recommended";

export type FinancialHealthStatus =
  | "healthy"
  | "caution"
  | "cash_shortage"
  | "financial_crisis"
  | "insolvency_warning"
  | "insolvent"
  | "bankrupt";

export type LoanType =
  | "short_term"
  | "long_term"
  | "emergency"
  | "regional_support"
  | "owner_injection";

export type LoanStatus = "active" | "repaid" | "defaulted";

export type RecoveryActionType =
  | "sponsor_advance"
  | "emergency_sponsor_pitch"
  | "cost_cutting_campaign"
  | "goods_clearance"
  | "ticket_price_increase";

export type FinalRecoveryOptionType =
  | "fire_sale_players"
  | "reduce_staff"
  | "emergency_loan"
  | "downsize_club"
  | "declare_bankruptcy";

export interface StatEffects {
  money?: number;
  fans?: number;
  reputation?: number;
  teamPower?: number;
  teamwork?: number;
  condition?: number;
  actionPoints?: number;
  clubLevel?: number;
  stadiumCapacity?: number;
  goodsPower?: number;
  sponsorPower?: number;
  coachExperience?: number;
  coachLevel?: number;
  coachDevelopment?: number;
  staffDissatisfaction?: number;
  staffLoyalty?: number;
}

/**
 * Club is the main player-owned entity and contains values shown frequently in the UI.
 */
export interface Club {
  id: string;
  name: string;
  money: number;
  fans: number;
  reputation: number;
  teamPower: number;
  teamwork: number;
  condition: number;
  actionPoints: number;
  maxActionPoints: number;
  turn: number;
  clubLevel: number;
  policy: ClubPolicy;
  stadiumCapacity: number;
  goodsPower: number;
  sponsorPower: number;
}

/**
 * Staff represents an AI-delegatable club employee.
 * Judgment and aiAccuracy should drive how well the staff member selects actions.
 */
export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  level: number;
  judgment: number;
  specialty: string;
  growth: number;
  loyalty: number;
  dissatisfaction: number;
  personality: StaffPersonality;
  aiAccuracy: number;
  delegationLevel: DelegationLevel;
  salary: number;
}

/**
 * Coach affects automatic match simulation and player development.
 */
export interface Coach {
  id: string;
  name: string;
  level: number;
  tactics: number;
  playerSelection: number;
  inGameManagement: number;
  development: number;
  motivation: number;
  charisma: number;
  aiJudgment: number;
  experience: number;
}

/**
 * Player is the lightweight squad member model for the alpha player system.
 * Detailed skills, traits, and position aptitude should be added later only when needed.
 */
export interface Player {
  id: string;
  name: string;
  age: number;
  position: PlayerPosition;
  overall: number;
  potential: number;
  growth: number;
  condition: number;
  morale: number;
  salary: number;
  contractMonths: number;
  marketValue: number;
  status: PlayerStatus;
  developmentStage: PlayerDevelopmentStage;
  monthsUntilBirthday: number;
  experience: number;
  appearances: number;
  trainingMatchAppearances: number;
  wantsRenewal?: boolean;
  retirementRisk?: number;
  announcedRetirement?: boolean;
  isHomegrown: boolean;
  joinedAtYear: number;
  joinedAtMonth: number;
}

export interface ContractAlert {
  playerId: string;
  playerName: string;
  type: ContractAlertType;
  message: string;
  severity: "info" | "warning" | "danger";
}

export interface FinancialHealth {
  status: FinancialHealthStatus;
  money: number;
  debt: number;
  netWorth: number;
  monthlyIncomeEstimate: number;
  monthlyExpenseEstimate: number;
  insolvencyLine: number;
  monthsInInsolvency: number;
  warnings: string[];
  recommendedActions: string[];
}

export interface Loan {
  id: string;
  type: LoanType;
  principal: number;
  remainingPrincipal: number;
  interestRate: number;
  monthlyPayment: number;
  remainingMonths: number;
  totalMonths: number;
  status: LoanStatus;
  borrowedAtYear: number;
  borrowedAtMonth: number;
}

export interface LoanOffer {
  id: string;
  type: LoanType;
  amount: number;
  interestRate: number;
  monthlyPayment: number;
  totalMonths: number;
  description: string;
  requirements: string[];
  riskNote: string;
  available: boolean;
  disabledReason?: string;
}

export interface SponsorAdvance {
  active: boolean;
  remainingMonths: number;
  monthlySponsorPenalty: number;
  amountReceived: number;
}

export interface RecoveryAction {
  type: RecoveryActionType;
  title: string;
  description: string;
  immediateMoneyEffect: number;
  monthlyPenalty?: number;
  durationMonths?: number;
  reputationEffect?: number;
  fanEffect?: number;
  riskNote: string;
  available: boolean;
  disabledReason?: string;
}

export interface BankruptcyState {
  isBankrupt: boolean;
  monthsInInsolvency: number;
  finalWarningIssued: boolean;
  bankruptcyReason?: string;
  canDownsizeRestart: boolean;
}

export interface PlayerDevelopmentResult {
  playerId: string;
  playerName: string;
  previousOverall: number;
  newOverall: number;
  previousPotential: number;
  newPotential: number;
  ageChanged: boolean;
  stage: PlayerDevelopmentStage;
  notes: string[];
}

export interface TeamCompositionSummary {
  totalPlayers: number;
  averageAge: number;
  totalSalary: number;
  averageOverall: number;
  averagePotential: number;
  positionCounts: Record<PlayerPosition, number>;
  startingAverageOverall: number;
  benchAverageOverall: number;
  reserveAverageOverall: number;
}

export interface TeamPowerBreakdown {
  startingPower: number;
  benchDepth: number;
  conditionModifier: number;
  teamworkModifier: number;
  coachModifier: number;
  finalTeamPower: number;
}

export interface ScoutedPlayer {
  id: string;
  player: Player;
  discoveredByStaffId?: string;
  discoveredByStaffName?: string;
  scoutAccuracy: number;
  estimatedOverall: number;
  estimatedPotential: number;
  estimatedSalary: number;
  estimatedMarketValue: number;
  confidence: number;
  focus: ScoutFocus;
  discoveredAtYear: number;
  discoveredAtMonth: number;
  expiresAtYear: number;
  expiresAtMonth: number;
}

export interface ScoreBreakdown {
  teamPower: number;
  startingPower?: number;
  benchDepth?: number;
  conditionModifier?: number;
  teamworkModifier?: number;
  coachModifier?: number;
  teamwork: number;
  condition: number;
  coachLevel: number;
  tactics: number;
  inGameManagement: number;
  motivation: number;
  homeAdvantage: number;
  luck: number;
  total: number;
  opponentPower: number;
  opponentLuck: number;
  opponentTotal: number;
  powerDifference: number;
  teamPowerBreakdown?: TeamPowerBreakdown;
}

export interface MatchPowerBreakdown {
  clubMatchPower: number;
  opponentMatchPower: number;
  teamPower: number;
  teamPowerBreakdown?: TeamPowerBreakdown;
  teamworkBonus: number;
  conditionBonus: number;
  coachLevelBonus: number;
  tacticsBonus: number;
  inGameManagementBonus: number;
  motivationBonus: number;
  homeBonus: number;
  luck: number;
  opponentBasePower: number;
  opponentLuck: number;
  powerDifference: number;
}

/**
 * MatchReport explains why a result happened and what the player should improve next.
 */
export interface MatchReport {
  summary: string;
  reasons: string[];
  positives: string[];
  improvements: string[];
  recommendedActions?: string[];
  scoreBreakdown: ScoreBreakdown;
}

export interface Match {
  id: string;
  turn: number;
  year?: number;
  month?: number;
  type: MatchType;
  opponentName: string;
  opponentClubId?: string;
  opponentOwnerName?: string;
  opponentClubLevel?: number;
  opponentPlayStyle?: OpponentPlayStyle;
  opponentPower: number;
  isHome: boolean;
  result: MatchResult;
  goalsFor: number;
  goalsAgainst: number;
  postMatchEffects?: StatEffects;
  report: MatchReport;
}

export interface OpponentClub {
  id: string;
  clubName: string;
  ownerName: string;
  clubLevel: number;
  reputation: number;
  fans: number;
  teamPower: number;
  teamwork: number;
  coachLevel: number;
  playStyle: OpponentPlayStyle;
}

export interface MatchRecordsSummary {
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  winRate: number;
}

export interface OpponentRecord {
  opponentClubId?: string;
  opponentName: string;
  opponentOwnerName?: string;
  totalMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  winRate: number;
}

/**
 * ActionLog stores both human and AI decisions with reason, result, and stat effects.
 */
export interface ActionLog {
  id: string;
  turn: number;
  year?: number;
  month?: number;
  actorType: ActionActorType;
  actorName: string;
  actionName: string;
  reason: string;
  result: string;
  effects: StatEffects;
}

export interface FinanceLog {
  id: string;
  turn: number;
  year?: number;
  month?: number;
  category: FinanceCategory;
  amount: number;
  description: string;
}

export interface PlayerAction {
  id: PlayerActionType;
  name: string;
  description: string;
  actionPointCost: number;
  requiresApproval: boolean;
  effectsPreview: StatEffects;
}

export interface StaffAction {
  id: StaffActionType;
  staffId: string;
  name: string;
  reason: string;
  expectedEffects: StatEffects;
  risk: StaffActionRisk;
  requiresApproval: boolean;
}

export interface TrainingMatchPreview {
  type: TrainingMatchType;
  difficulty: string;
  purpose: string;
  opponentPower: number;
  expectedRewards: StatEffects;
  conditionCost: number;
  canPlay: boolean;
}

/**
 * EventChoice is designed for eventEngine: each choice can have cost/effects and optional approval.
 */
export interface EventChoice {
  id: string;
  label: string;
  description: string;
  effects: StatEffects;
  requiresApproval: boolean;
  cost?: number;
  requirements?: string[];
  effectPreview?: string;
  disabledReason?: string;
}

export interface RandomEvent {
  id: string;
  turn: number;
  year?: number;
  month?: number;
  type: RandomEventType;
  category: RandomEventCategory;
  title: string;
  description: string;
  choices: EventChoice[];
  status: GameEventStatus;
  selectedChoiceId?: string;
  targetStaffId?: string;
}

export interface GameState {
  /** Player-facing president name. Kept outside Club because it represents the user, not club stats. */
  ownerName: string;
  currentYear: number;
  currentMonth: number;
  elapsedMonths: number;
  club: Club;
  coach: Coach;
  staff: Staff[];
  players: Player[];
  scoutedPlayers: ScoutedPlayer[];
  scoutFocus: ScoutFocus;
  coachSelectionPolicy: CoachSelectionPolicy;
  autoCoachSelectionEnabled: boolean;
  contractAlerts: ContractAlert[];
  financialHealth: FinancialHealth;
  monthsInInsolvency: number;
  isGameOver: boolean;
  gameOverReason?: string;
  bankruptcyState: BankruptcyState;
  loans: Loan[];
  sponsorAdvance?: SponsorAdvance;
  matches: Match[];
  actionLogs: ActionLog[];
  financeLogs: FinanceLog[];
  events: RandomEvent[];
  lastMatchReport: MatchReport | null;
  scheduledOfficialMatch: Match | null;
  hasEnteredOfficialCompetition: boolean;
  trainingMatchPlayedTurn: number | null;
}

export interface EngineResult {
  state: GameState;
  actionLogs: ActionLog[];
  financeLogs?: FinanceLog[];
}

export interface CurrentMonthSummary {
  actions: ActionLog[];
  matches: Match[];
  eventLogs: ActionLog[];
  financeLogs: FinanceLog[];
}
