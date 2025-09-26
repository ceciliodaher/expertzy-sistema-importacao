/**
 * ScenarioAnalysis.js - Advanced Scenario Analysis for Pricing Strategy
 * 
 * Provides detailed analysis and comparison tools for pricing scenarios
 * Supports multi-dimensional analysis across states, customer types, and market conditions
 */

class ScenarioAnalysis {
    constructor() {
        this.scenarios = [];
        this.analysisResults = {};
        this.comparisonMatrix = {};
        this.riskAssessments = {};
    }

    /**
     * Set scenarios for analysis
     * @param {Array} scenarios - Array of pricing scenarios
     */
    setScenarios(scenarios) {
        this.scenarios = scenarios;
        console.log(`📊 ScenarioAnalysis: ${scenarios.length} cenários carregados para análise`);
    }

    /**
     * Perform comprehensive multi-dimensional analysis
     */
    performComprehensiveAnalysis() {
        console.log('🔍 Iniciando análise abrangente de cenários...');
        
        const analysis = {
            cost_analysis: this.analyzeCostStructure(),
            tax_efficiency: this.analyzeTaxEfficiency(),
            competitive_position: this.analyzeCompetitivePosition(),
            risk_assessment: this.assessOverallRisk(),
            optimization_opportunities: this.identifyOptimizationOpportunities(),
            strategic_recommendations: this.generateStrategicRecommendations()
        };

        this.analysisResults = analysis;
        console.log('✅ Análise abrangente concluída');
        
        return analysis;
    }

    /**
     * Analyze cost structure across scenarios
     */
    analyzeCostStructure() {
        const costs = this.scenarios.map(s => s.totals.total_cost);
        const taxes = this.scenarios.map(s => s.taxes.total_taxes);
        const benefits = this.scenarios.map(s => this.validateTaxSavings(s.benefits, `Cenário ${s.state}`));

        return {
            cost_range: {
                min: Math.min(...costs),
                max: Math.max(...costs),
                average: costs.reduce((a, b) => a + b, 0) / costs.length,
                variance: this.calculateVariance(costs)
            },
            tax_burden: {
                min: Math.min(...taxes),
                max: Math.max(...taxes),
                average: taxes.reduce((a, b) => a + b, 0) / taxes.length,
                as_percentage_of_cost: taxes.map((tax, i) => (tax / costs[i]) * 100)
            },
            benefit_potential: {
                total_possible_savings: Math.max(...benefits),
                states_with_benefits: benefits.filter(b => b > 0).length,
                average_savings: benefits.reduce((a, b) => a + b, 0) / benefits.length
            },
            efficiency_ranking: this.rankScenariosByEfficiency()
        };
    }

    /**
     * Analyze tax efficiency across different states
     */
    analyzeTaxEfficiency() {
        const taxEfficiency = this.scenarios.map(scenario => {
            const effectiveTaxRate = scenario.taxes.total_taxes / scenario.totals.cif_cost;
            const benefitUtilization = scenario.benefits.applicable ? 
                this.validateTaxSavings(scenario.benefits, `Cenário ${scenario.state}`) / scenario.taxes.icms_nominal : 0;
            
            return {
                state: scenario.state,
                effective_tax_rate: effectiveTaxRate,
                benefit_utilization: benefitUtilization,
                efficiency_score: this.calculateTaxEfficiencyScore(scenario)
            };
        });

        // Sort by efficiency score
        taxEfficiency.sort((a, b) => b.efficiency_score - a.efficiency_score);

        return {
            most_efficient: taxEfficiency[0],
            least_efficient: taxEfficiency[taxEfficiency.length - 1],
            ranking: taxEfficiency,
            analysis: {
                tax_rate_spread: Math.max(...taxEfficiency.map(t => t.effective_tax_rate)) - 
                                Math.min(...taxEfficiency.map(t => t.effective_tax_rate)),
                states_with_benefits: taxEfficiency.filter(t => t.benefit_utilization > 0).length,
                average_efficiency: taxEfficiency.reduce((sum, t) => sum + t.efficiency_score, 0) / taxEfficiency.length
            }
        };
    }

    /**
     * Analyze competitive position for each scenario
     */
    analyzeCompetitivePosition() {
        // Assume market reference prices for competitive analysis
        const marketReferences = {
            'GO': 12000, 'SC': 11500, 'ES': 11800, 'MG': 12200, 'SP': 12500
        };

        const competitiveAnalysis = this.scenarios.map(scenario => {
            const marketRef = this.validateMarketReference(marketReferences[scenario.state], scenario.state);
            const competitiveAdvantage = (marketRef - scenario.totals.total_cost) / marketRef * 100;
            
            return {
                state: scenario.state,
                market_reference: marketRef,
                our_cost: scenario.totals.total_cost,
                competitive_advantage: competitiveAdvantage,
                position: this.classifyCompetitivePosition(competitiveAdvantage)
            };
        });

        return {
            best_position: competitiveAnalysis.reduce((best, current) => 
                current.competitive_advantage > best.competitive_advantage ? current : best),
            positions: competitiveAnalysis,
            market_penetration_potential: this.assessMarketPenetrationPotential(competitiveAnalysis)
        };
    }

    /**
     * Assess overall risk across scenarios
     */
    assessOverallRisk() {
        const riskFactors = this.scenarios.map(scenario => {
            const risks = {
                regulatory_risk: this.assessRegulatoryRisk(scenario),
                cost_volatility_risk: this.assessCostVolatilityRisk(scenario),
                market_risk: this.assessMarketRisk(scenario),
                operational_risk: this.assessOperationalRisk(scenario)
            };

            const overallRisk = Object.values(risks).reduce((sum, risk) => sum + risk.score, 0) / 4;
            
            return {
                state: scenario.state,
                individual_risks: risks,
                overall_risk_score: overallRisk,
                risk_level: this.classifyRiskLevel(overallRisk)
            };
        });

        return {
            lowest_risk: riskFactors.reduce((lowest, current) => 
                current.overall_risk_score < lowest.overall_risk_score ? current : lowest),
            highest_risk: riskFactors.reduce((highest, current) => 
                current.overall_risk_score > highest.overall_risk_score ? current : highest),
            risk_analysis: riskFactors,
            risk_mitigation_strategies: this.generateRiskMitigationStrategies(riskFactors)
        };
    }

    /**
     * Identify optimization opportunities
     */
    identifyOptimizationOpportunities() {
        const opportunities = [];

        // Cost optimization opportunities
        const costOptimization = this.identifyCostOptimizations();
        if (costOptimization.length > 0) {
            opportunities.push(...costOptimization);
        }

        // Tax optimization opportunities
        const taxOptimization = this.identifyTaxOptimizations();
        if (taxOptimization.length > 0) {
            opportunities.push(...taxOptimization);
        }

        // Process optimization opportunities
        const processOptimization = this.identifyProcessOptimizations();
        if (processOptimization.length > 0) {
            opportunities.push(...processOptimization);
        }

        // Strategic positioning opportunities
        const strategicOptimization = this.identifyStrategicOptimizations();
        if (strategicOptimization.length > 0) {
            opportunities.push(...strategicOptimization);
        }

        return {
            total_opportunities: opportunities.length,
            high_impact: opportunities.filter(o => o.impact === 'high'),
            medium_impact: opportunities.filter(o => o.impact === 'medium'),
            low_impact: opportunities.filter(o => o.impact === 'low'),
            opportunities: opportunities.sort((a, b) => this.getImpactScore(b.impact) - this.getImpactScore(a.impact))
        };
    }

    /**
     * Generate strategic recommendations
     */
    generateStrategicRecommendations() {
        const recommendations = [];

        // Primary recommendation - lowest cost
        const lowestCost = this.scenarios.reduce((min, current) => 
            current.totals.total_cost < min.totals.total_cost ? current : min);
        
        recommendations.push({
            type: 'primary',
            category: 'cost_optimization',
            title: 'Estratégia de Menor Custo',
            description: `Operação em ${lowestCost.state_name} oferece o menor custo total`,
            state: lowestCost.state,
            financial_impact: {
                cost_savings: this.calculateMaxSavings(lowestCost),
                implementation_cost: 'Low',
                payback_period: 'Immediate'
            },
            implementation_difficulty: 'Easy',
            strategic_value: 'High'
        });

        // Tax benefits recommendation
        const bestBenefits = this.scenarios.reduce((best, current) => 
            this.validateTaxSavings(current.benefits, `Cenário ${current.state}`) > this.validateTaxSavings(best.benefits, `Cenário ${best.state}`) ? current : best);
        
        if (bestBenefits.benefits.applicable && bestBenefits.benefits.tax_savings > 0) {
            recommendations.push({
                type: 'secondary',
                category: 'tax_optimization',
                title: 'Estratégia de Benefícios Fiscais',
                description: `${bestBenefits.state_name} oferece benefícios fiscais significativos`,
                state: bestBenefits.state,
                financial_impact: {
                    tax_savings: bestBenefits.benefits.tax_savings,
                    implementation_cost: 'Medium',
                    payback_period: '3-6 months'
                },
                implementation_difficulty: 'Medium',
                strategic_value: 'Medium'
            });
        }

        // Diversification recommendation
        if (this.scenarios.length > 2) {
            const topStates = this.scenarios
                .sort((a, b) => a.totals.total_cost - b.totals.total_cost)
                .slice(0, 2);
            
            recommendations.push({
                type: 'strategic',
                category: 'risk_management',
                title: 'Estratégia de Diversificação',
                description: `Diversificar operações entre ${topStates.map(s => s.state_name).join(' e ')}`,
                states: topStates.map(s => s.state),
                financial_impact: {
                    risk_reduction: 'High',
                    flexibility_gain: 'High',
                    implementation_cost: 'High'
                },
                implementation_difficulty: 'Hard',
                strategic_value: 'High'
            });
        }

        return {
            primary_recommendation: recommendations.find(r => r.type === 'primary'),
            secondary_recommendations: recommendations.filter(r => r.type === 'secondary'),
            strategic_recommendations: recommendations.filter(r => r.type === 'strategic'),
            implementation_roadmap: this.createImplementationRoadmap(recommendations)
        };
    }

    /**
     * Create detailed comparison matrix
     */
    createComparisonMatrix() {
        const matrix = {
            states: this.scenarios.map(s => s.state),
            metrics: {
                total_cost: this.scenarios.map(s => s.totals.total_cost),
                tax_burden: this.scenarios.map(s => s.taxes.total_taxes),
                icms_rate: this.scenarios.map(s => s.taxes.icms_nominal),
                benefits: this.scenarios.map(s => this.validateTaxSavings(s.benefits, `Cenário ${s.state}`)),
                competitiveness: this.scenarios.map(s => s.totals.competitiveness_score)
            },
            rankings: {
                by_cost: this.rankStatesByCost(),
                by_benefits: this.rankStatesByBenefits(),
                by_competitiveness: this.rankStatesByCompetitiveness()
            }
        };

        this.comparisonMatrix = matrix;
        return matrix;
    }

    /**
     * Utility Methods
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }

    calculateTaxEfficiencyScore(scenario) {
        const baseTaxRate = scenario.taxes.total_taxes / scenario.totals.cif_cost;
        const benefitFactor = scenario.benefits.applicable ? 
            1 + this.validateTaxSavings(scenario.benefits, `Cenário ${scenario.state}`) / scenario.taxes.total_taxes : 1;
        
        return (1 / baseTaxRate) * benefitFactor * 100; // Higher score = more efficient
    }

    classifyCompetitivePosition(advantage) {
        if (advantage > 15) return 'Highly Competitive';
        if (advantage > 5) return 'Competitive';
        if (advantage > -5) return 'Neutral';
        return 'Disadvantageous';
    }

    classifyRiskLevel(riskScore) {
        if (riskScore < 3) return 'Low';
        if (riskScore < 6) return 'Medium';
        return 'High';
    }

    assessRegulatoryRisk(scenario) {
        let score = 2; // Base regulatory risk
        
        if (scenario.benefits.applicable) {
            score += 1; // Benefits add regulatory complexity
        }
        
        return {
            score: score,
            factors: ['Tax law changes', 'Benefit program stability'],
            mitigation: 'Monitor regulatory updates, maintain compliance'
        };
    }

    assessCostVolatilityRisk(scenario) {
        // Simplified cost volatility assessment
        return {
            score: 3,
            factors: ['Exchange rate fluctuation', 'Import duty changes'],
            mitigation: 'Hedge currency exposure, diversify suppliers'
        };
    }

    assessMarketRisk(scenario) {
        return {
            score: 4,
            factors: ['Demand fluctuation', 'Competition intensity'],
            mitigation: 'Market research, flexible pricing strategy'
        };
    }

    assessOperationalRisk(scenario) {
        let score = 2;
        
        if (scenario.benefits.applicable) {
            score += 1; // Benefits require additional operational complexity
        }
        
        return {
            score: score,
            factors: ['Supply chain disruption', 'Operational complexity'],
            mitigation: 'Backup suppliers, process standardization'
        };
    }

    // Additional utility methods for optimization identification
    identifyCostOptimizations() {
        const opportunities = [];
        
        const costDifference = Math.max(...this.scenarios.map(s => s.totals.total_cost)) - 
                             Math.min(...this.scenarios.map(s => s.totals.total_cost));
        
        if (costDifference > 1000) {
            opportunities.push({
                type: 'cost_reduction',
                title: 'Relocate to Lower-Cost State',
                description: `Potential savings of R$ ${costDifference.toFixed(2)} by choosing optimal state`,
                impact: 'high',
                effort: 'medium'
            });
        }
        
        return opportunities;
    }

    identifyTaxOptimizations() {
        const opportunities = [];
        
        const benefitScenarios = this.scenarios.filter(s => s.benefits.applicable);
        
        if (benefitScenarios.length > 0) {
            const maxBenefit = Math.max(...benefitScenarios.map(s => s.benefits.tax_savings));
            
            opportunities.push({
                type: 'tax_benefit',
                title: 'Optimize Tax Benefits',
                description: `Potential tax savings of R$ ${maxBenefit.toFixed(2)} through benefit programs`,
                impact: 'medium',
                effort: 'medium'
            });
        }
        
        return opportunities;
    }

    identifyProcessOptimizations() {
        return [
            {
                type: 'process_improvement',
                title: 'Automate Tax Calculations',
                description: 'Implement automated monitoring of benefit eligibility',
                impact: 'medium',
                effort: 'low'
            }
        ];
    }

    identifyStrategicOptimizations() {
        return [
            {
                type: 'strategic_positioning',
                title: 'Multi-State Operation',
                description: 'Establish presence in multiple states for risk diversification',
                impact: 'high',
                effort: 'high'
            }
        ];
    }

    getImpactScore(impact) {
        const scores = { 'high': 3, 'medium': 2, 'low': 1 };
        if (scores[impact] === undefined) {
            throw new Error(`Nível de impacto inválido: ${impact} - deve ser 'high', 'medium' ou 'low'`);
        }
        return scores[impact];
    }

    calculateMaxSavings(bestScenario) {
        const maxCost = Math.max(...this.scenarios.map(s => s.totals.total_cost));
        return maxCost - bestScenario.totals.total_cost;
    }

    rankScenariosByEfficiency() {
        return this.scenarios
            .map(s => ({
                state: s.state,
                efficiency: s.totals.total_cost + this.validateTaxSavings(s.benefits, `Cenário ${s.state}`) * -1
            }))
            .sort((a, b) => a.efficiency - b.efficiency);
    }

    rankStatesByCost() {
        return this.scenarios
            .sort((a, b) => a.totals.total_cost - b.totals.total_cost)
            .map((s, index) => ({ state: s.state, rank: index + 1, cost: s.totals.total_cost }));
    }

    rankStatesByBenefits() {
        return this.scenarios
            .sort((a, b) => this.validateTaxSavings(b.benefits, `Cenário ${b.state}`) - this.validateTaxSavings(a.benefits, `Cenário ${a.state}`))
            .map((s, index) => ({ state: s.state, rank: index + 1, benefits: this.validateTaxSavings(s.benefits, `Cenário ${s.state}`) }));
    }

    rankStatesByCompetitiveness() {
        return this.scenarios
            .sort((a, b) => b.totals.competitiveness_score - a.totals.competitiveness_score)
            .map((s, index) => ({ state: s.state, rank: index + 1, score: s.totals.competitiveness_score }));
    }

    createImplementationRoadmap(recommendations) {
        return recommendations.map((rec, index) => ({
            phase: index + 1,
            recommendation: rec.title,
            timeline: this.getImplementationTimeline(rec.implementation_difficulty),
            prerequisites: this.getPrerequisites(rec),
            success_metrics: this.getSuccessMetrics(rec)
        }));
    }

    getImplementationTimeline(difficulty) {
        const timelines = {
            'Easy': '1-2 weeks',
            'Medium': '1-3 months', 
            'Hard': '6-12 months'
        };
        return timelines[difficulty] || '1-3 months';
    }

    getPrerequisites(recommendation) {
        const prerequisites = {
            'cost_optimization': ['Location analysis', 'Regulatory compliance check'],
            'tax_optimization': ['Benefit eligibility verification', 'Compliance setup'],
            'risk_management': ['Risk assessment', 'Resource planning']
        };
        return prerequisites[recommendation.category] || ['Strategic planning'];
    }

    getSuccessMetrics(recommendation) {
        const metrics = {
            'cost_optimization': ['Cost reduction %', 'Implementation timeline'],
            'tax_optimization': ['Tax savings realized', 'Compliance maintained'],
            'risk_management': ['Risk score reduction', 'Operational flexibility']
        };
        return metrics[recommendation.category] || ['ROI improvement'];
    }

    assessMarketPenetrationPotential(competitiveAnalysis) {
        const avgAdvantage = competitiveAnalysis.reduce((sum, c) => sum + c.competitive_advantage, 0) / competitiveAnalysis.length;
        
        if (avgAdvantage > 10) return 'High';
        if (avgAdvantage > 0) return 'Medium';
        return 'Low';
    }

    generateRiskMitigationStrategies(riskFactors) {
        return riskFactors.map(risk => ({
            state: risk.state,
            priority_risks: Object.entries(risk.individual_risks)
                .sort((a, b) => b[1].score - a[1].score)
                .slice(0, 2)
                .map(([type, data]) => ({ type, ...data })),
            mitigation_plan: this.createMitigationPlan(risk)
        }));
    }

    createMitigationPlan(risk) {
        return [
            'Implement monitoring systems',
            'Establish contingency procedures',
            'Regular compliance reviews',
            'Stakeholder communication protocols'
        ];
    }

    /**
     * Validation methods for strict fiscal calculations
     */
    validateTaxSavings(benefits, contextLabel) {
        if (!benefits || typeof benefits.tax_savings === 'undefined') {
            throw new Error(`Benefícios fiscais não calculados para ${contextLabel} - obrigatório para análise`);
        }
        return benefits.tax_savings;
    }

    validateMarketReference(marketRef, state) {
        if (!marketRef || marketRef <= 0) {
            throw new Error(`Referência de mercado não disponível para estado ${state} - obrigatório para análise competitiva`);
        }
        return marketRef;
    }
}

// Export for use in other modules
export { ScenarioAnalysis };