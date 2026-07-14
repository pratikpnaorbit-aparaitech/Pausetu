// valuationEngine.js
// Orchestrator for Phase 2 livestock market price estimation.

import { BASE_PRICES, getAgeMultiplier, getWeightFactor } from './priceFactors';
import { getBreedQualityScore } from './breedFactors';
import { getLactationBonus, inferLactation } from './lactationFactors';
import { getBcsMultiplier, getUdderConditionBonus } from './healthFactors';
import { getDiseaseDeduction } from './diseaseFactors';
import { getVerificationLevelBonus } from './verificationFactors';
import { getDistrictDemandMultiplier } from './districtDemand';
import { getSeasonBonus, getCurrentSeason } from './seasonFactors';
import { calculateMarketDemand } from './marketDemand';
import { calculateConfidence } from './confidenceEngine';

const getMilkBonus = (type, yieldL) => {
  const milk = parseFloat(yieldL) || 0;
  if (milk <= 0) return 0;
  if (type === 'goat') return milk * 1500;
  if (type === 'cow') return milk * 2800;
  if (type === 'buffalo') return milk * 3200;
  return 0;
};

const getPregnancyBonus = (type, isPregnant, month) => {
  if (!isPregnant) return 0;
  const base = type === 'goat' ? 2000 : type === 'buffalo' ? 8000 : 6000;
  const inc = type === 'goat' ? 200 : type === 'buffalo' ? 800 : 600;
  return base + inc * (parseInt(month, 10) || 0);
};

export const valuationEngine = {
  estimatePrice: (input) => {
    const {
      animalType,
      breed,
      age,
      weight,
      milkProduction,
      isPregnant,
      pregnancyMonth,
      healthCondition,
      vaccinationStatus,
      location,
      isVerified
    } = input;

    // 1. Resolve inferred Phase 2 variables
    const lactationNumber = input.lactationNumber || inferLactation(animalType, age);
    
    let bcs = input.bcs || 'good';
    if (healthCondition === 'excellent') bcs = 'excellent';
    else if (healthCondition === 'average') bcs = 'average';
    else if (healthCondition === 'needs_treatment') bcs = 'poor';

    let udderCondition = input.udderCondition || 'normal';
    if (healthCondition === 'needs_treatment' && parseFloat(milkProduction) > 5) {
      udderCondition = 'damaged';
    } else if (healthCondition === 'excellent') {
      udderCondition = 'healthy';
    }

    let diseaseHistory = input.diseaseHistory || 'none';
    if (healthCondition === 'needs_treatment') {
      diseaseHistory = parseFloat(milkProduction) > 5 ? 'mastitis' : 'lameness';
    }

    let verificationLevel = input.verificationLevel || 'none';
    if (isVerified) {
      verificationLevel = 'video_verified';
    }

    const season = input.season || getCurrentSeason();
    
    let yieldTrend = input.yieldTrend || 'stable';
    const parsedAge = parseFloat(age) || 0;
    if (parsedAge < 3.0 && parseFloat(milkProduction) > 0) yieldTrend = 'increasing';
    else if (parsedAge > 7.0) yieldTrend = 'decreasing';

    // 2. Fetch baseline variables
    const basePrice = BASE_PRICES[animalType] || 25000;
    const breedScore = getBreedQualityScore(animalType, breed);
    const milkValue = getMilkBonus(animalType, milkProduction);
    const pregnancyBonus = getPregnancyBonus(animalType, isPregnant, pregnancyMonth);
    
    // 3. Fetch modular factors
    const lactationBonus = getLactationBonus(animalType, lactationNumber);
    
    const bcsMult = getBcsMultiplier(bcs);
    const udderBonus = getUdderConditionBonus(animalType, udderCondition);
    const diseaseDeduction = getDiseaseDeduction(animalType, diseaseHistory);
    const healthBonus = Math.round(basePrice * (bcsMult - 1.0)) + udderBonus + diseaseDeduction;

    const verificationBonus = getVerificationLevelBonus(verificationLevel);
    const seasonBonus = getSeasonBonus(animalType, season);
    
    const demandObj = calculateMarketDemand({
      breed,
      healthCondition,
      milkProduction,
      district: location?.district,
      yieldTrend
    });
    const marketDemandBonus = (demandObj.score - 50) * 150;

    // 4. Fetch Multipliers
    const ageMultiplier = getAgeMultiplier(animalType, age);
    const weightMultiplier = getWeightFactor(animalType, weight);
    const locationMultiplier = getDistrictDemandMultiplier(location?.district);

    // 5. Apply Valuation Formula:
    // Estimated Price = (Base Price + Breed Score + Milk Value + Pregnancy Bonus + Lactation Bonus + Health Bonus + Verification Bonus + Season Bonus + Market Demand Bonus) * Age Multiplier * Weight Multiplier * Location Multiplier
    const baseSum = basePrice + breedScore + milkValue + pregnancyBonus + lactationBonus + healthBonus + verificationBonus + seasonBonus + marketDemandBonus;
    const rawExpectedPrice = baseSum * ageMultiplier * weightMultiplier * locationMultiplier;

    const expectedPrice = Math.max(5000, Math.round(rawExpectedPrice / 500) * 500);
    const minPrice = Math.max(4000, Math.round((expectedPrice * 0.9) / 500) * 500);
    const premiumPrice = Math.round((expectedPrice * 1.1) / 500) * 500;

    // 6. Calculate Confidence
    const confidenceScore = calculateConfidence({
      animalType,
      breed,
      age,
      weight,
      milkProduction,
      verificationLevel,
      location,
      healthCondition
    });

    // 7. Dynamic AI Selling Insights (generated dynamically from calculated factors)
    const sellingSuggestions = [];
    if (vaccinationStatus !== 'complete') {
      sellingSuggestions.push('estimator.suggestions.ai.vaccination');
    }
    const baseWeightLimit = animalType === 'goat' ? 35 : 350;
    if (parseFloat(weight) < baseWeightLimit) {
      sellingSuggestions.push('estimator.suggestions.ai.weight');
    }
    if (verificationLevel === 'none') {
      sellingSuggestions.push('estimator.suggestions.ai.verification');
    }
    if (season === 'winter' || season === 'festival') {
      sellingSuggestions.push('estimator.suggestions.ai.season');
    }
    if (parseFloat(milkProduction) > (animalType === 'goat' ? 2 : 12)) {
      sellingSuggestions.push('estimator.suggestions.ai.milk');
    }

    if (sellingSuggestions.length === 0) {
      sellingSuggestions.push('estimator.suggestions.sell.localMarket');
    }

    return {
      minPrice,
      expectedPrice,
      premiumPrice,
      confidenceScore,
      demand: demandObj,
      suggestions: {
        buying: [
          'estimator.suggestions.buy.localTransport',
          healthCondition === 'needs_treatment' ? 'estimator.suggestions.buy.treatmentCost' : 'estimator.suggestions.buy.excellentPremium'
        ],
        selling: sellingSuggestions.slice(0, 3)
      },
      reasoningKeys: [
        breedScore > 0 ? 'estimator.reasoning.premiumBreed' : 'estimator.reasoning.standardCattle',
        lactationNumber >= 2 && lactationNumber <= 4 ? 'estimator.reasoning.primeAge' : 'estimator.reasoning.standardCattle'
      ]
    };
  }
};

export default valuationEngine;
