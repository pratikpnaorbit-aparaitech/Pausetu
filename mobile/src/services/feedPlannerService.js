// feedPlannerService.js
// Business logic engine to compute feeding recommendations for Maharashtra livestock.

export const feedPlannerService = {
  calculateFeedPlan: ({ animal, breed, weight, milk, pregnant, goal, green }) => {
    // 1. Convert options to numeric representations
    const hasGreen = green === 'yes';
    const isPregnant = pregnant === 'yes';
    
    let weightNum = 350;
    if (weight === 'lt_300') weightNum = 250;
    else if (weight === 'w300_400') weightNum = 350;
    else if (weight === 'w400_500') weightNum = 450;
    else if (weight === 'gt_500') weightNum = 550;

    let milkNum = 0;
    if (milk === 'm5_10') milkNum = 7.5;
    else if (milk === 'm10_15') milkNum = 12.5;
    else if (milk === 'm15_20') milkNum = 17.5;
    else if (milk === 'gt_20') milkNum = 22.5;

    // 2. Base Fodder requirements
    let greenFodder = 0;
    let dryFodder = 0;

    if (hasGreen) {
      greenFodder = animal === 'cow' ? 18 : 22;
      dryFodder = animal === 'cow' ? 4 : 5;
    } else {
      greenFodder = 0;
      dryFodder = animal === 'cow' ? 8 : 10;
    }

    // Adjust based on weight
    const weightFactor = weightNum / 350;
    greenFodder = Math.round(greenFodder * weightFactor * 10) / 10;
    dryFodder = Math.round(dryFodder * weightFactor * 10) / 10;

    // 3. Concentrate requirements
    let concentrate = 0;
    if (milkNum > 0) {
      // Milking animal
      const baseMaintenance = animal === 'cow' ? 1.5 : 2.0;
      let yieldFactor = 0.4; // 400g per L
      if (breed === 'hf' || breed === 'jersey' || breed === 'murrah') {
        yieldFactor = 0.5; // 500g per L
      }
      concentrate = baseMaintenance + (milkNum * yieldFactor);
    } else {
      // Dry animal
      concentrate = animal === 'cow' ? 1.0 : 1.5;
    }

    // Pregnancy adjustments
    if (isPregnant) {
      concentrate += 1.0;
    }

    // Goal adjustments
    if (goal === 'inc_milk') {
      concentrate += 0.5;
    } else if (goal === 'gain_wt') {
      concentrate += 0.8;
    }

    concentrate = Math.round(concentrate * 10) / 10;

    // 4. Cotton Seed Cake (Kapas Khali)
    let cottonSeedCake = animal === 'cow' ? 1.0 : 1.8;
    if (goal === 'gain_wt') cottonSeedCake += 0.5;
    cottonSeedCake = Math.round(cottonSeedCake * weightFactor * 10) / 10;

    // 5. Mineral Mixture & Salt
    let mineralMixture = isPregnant ? 80 : 50;
    if (milkNum > 15) mineralMixture += 20;

    let salt = milkNum > 15 ? 50 : 30;

    // 6. Water Requirements
    let water = animal === 'cow' ? 60 : 85;
    if (breed === 'hf') water += 15;
    if (milkNum > 0) water += (milkNum * 2);
    water = Math.round(water);

    // 7. Costs estimation (Maharashtra average rates)
    // Dry: Rs.6/kg, Green: Rs.2/kg, Concentrate: Rs.32/kg, Cotton seed: Rs.42/kg
    const costDry = dryFodder * 6;
    const costGreen = greenFodder * 2;
    const costConc = concentrate * 32;
    const costCotton = cottonSeedCake * 42;
    const costMinerals = 6; // approx cost for MM and salt

    const dailyCost = Math.round(costDry + costGreen + costConc + costCotton + costMinerals);
    const monthlyCost = dailyCost * 30;

    // 8. Expected milk improvement
    let milkImprovement = 0;
    if (milkNum > 0 && goal === 'inc_milk') {
      milkImprovement = breed === 'hf' || breed === 'jersey' ? 1.8 : 1.2;
    }

    // 9. Confidence and tips
    const confidenceScore = Math.min(98, Math.round(88 + (hasGreen ? 5 : 2) + (weightNum > 300 ? 3 : 1)));

    return {
      dryFodder,
      greenFodder,
      concentrate,
      cottonSeedCake,
      mineralMixture,
      salt,
      water,
      dailyCost,
      monthlyCost,
      milkImprovement,
      confidenceScore,
      tips: [
        `feedPlanner.tips.${animal}.${breed || 'generic'}`,
        `feedPlanner.tips.goal.${goal}`,
        `feedPlanner.tips.water`
      ],
      warnings: [
        isPregnant ? 'feedPlanner.warnings.pregnant' : null,
        !hasGreen ? 'feedPlanner.warnings.no_green' : null,
        milkNum > 20 ? 'feedPlanner.warnings.high_milk' : null
      ].filter(Boolean)
    };
  }
};
