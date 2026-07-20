import { feedPlannerFlow } from '../flows/feedPlannerFlow';
import { marketPriceFlow } from '../flows/marketPriceFlow';
import { diseaseCheckerFlow } from '../flows/diseaseCheckerFlow';
import { breedingAdvisorFlow } from '../flows/breedingAdvisorFlow';
import { vaccinationPlannerFlow } from '../flows/vaccinationPlannerFlow';

const FLOWS = {
  feedPlanner: feedPlannerFlow,
  marketPrice: marketPriceFlow,
  diseaseChecker: diseaseCheckerFlow,
  breedingAdvisor: breedingAdvisorFlow,
  vaccinationPlanner: vaccinationPlannerFlow
};

export const chatbotService = {
  getFlows: () => FLOWS,
  getFlow: (id) => FLOWS[id] || null
};
