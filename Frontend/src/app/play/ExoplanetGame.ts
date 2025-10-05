import { ExoplanetSlider } from '../components/ExoplanetSlider';
import type { ExoplanetParameters } from '../components/ExoplanetSlider';
import { ExoplanetClassifier } from './ExoplanetClassifier';
import type { ExoplanetType } from './ExoplanetClassifier';
import { SpaceScene } from '../components/SpaceScene/SpaceScene';
import { Planet } from '../components/CelestialBodies/Planet';
import { getTopClassificationConfig, type PlanetConfig } from './PlanetConfigs';
import { getPlanetTranslation } from './PlanetTranslations';
import { exoplanetAPI } from '../../lib/api';

export interface GameState {
  targetExoplanet: {
    name: string;
    parameters: ExoplanetParameters;
  };
  currentGuess: ExoplanetParameters;
  lastClassification: ExoplanetType[];
  similarity: number;
  attempts: number;
  gameWon: boolean;
}

export class ExoplanetGame {
  private container: HTMLElement;
  private gameState: GameState;
  private slider!: ExoplanetSlider;
  private classifier: ExoplanetClassifier;
  private spaceScene!: SpaceScene;
  private feedbackContainer!: HTMLElement;
  private t: (key: string) => string;

  constructor(container: HTMLElement, translateFunction: (key: string) => string) {
    this.container = container;
    this.t = translateFunction;
    this.classifier = new ExoplanetClassifier();
    this.gameState = this.initializeGame();
    
    this.setupUI();
    this.setupSpaceScene();
    this.setupGameLogic();
  }

  private initializeGame(): GameState {
    const targetExoplanet = this.classifier.getTargetExoplanet();
    return {
      targetExoplanet,
      currentGuess: {
        mass: 1,
        radius: 1,
        temperature: 288,
        orbitalDistance: 1,
        atmosphere: 1,
        composition: 70,
        brightness: 1.0
      },
      lastClassification: [],
      similarity: 0,
      attempts: 0,
      gameWon: false
    };
  }

  private setupUI() {
    this.container.innerHTML = `
      <div class="game-container">
        <div class="game-header">
          <h1>${this.t("game.title")}</h1>
          <div class="game-info">
            <div class="target-info">
              <h3>${this.t("game.target")}: <span id="target-name">${this.t(getPlanetTranslation(this.gameState.targetExoplanet.name, 'name'))}</span></h3>
              <p id="target-description"></p>
            </div>
            <div class="game-stats">
              <div>${this.t("game.attempts")}: <span id="attempts">${this.gameState.attempts}</span></div>
            </div>
          </div>
        </div>
        
        <div class="game-content">
          <div class="left-panel">
            <div class="panel-toggle" id="left-toggle">
              <span class="arrow">▶</span>
            </div>
            <div class="panel-content" id="left-panel-content">
              <div id="slider-container"></div>
            </div>
          </div>
          
          <div class="space-view">
            <div id="space-container"></div>
          </div>
          
          <div class="right-panel">
            <div class="panel-toggle" id="right-toggle">
              <span class="arrow">◀</span>
            </div>
            <div class="panel-content" id="right-panel-content">
              <div id="feedback-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.feedbackContainer = this.container.querySelector('#feedback-container') as HTMLElement;
    
    // Initialize slider
    const sliderContainer = this.container.querySelector('#slider-container') as HTMLElement;
    if (!sliderContainer) {
      console.error('Slider container not found!');
      return;
    }
    this.slider = new ExoplanetSlider(sliderContainer, this.t, this.gameState.currentGuess);
    console.log('Slider initialized successfully');
    
    this.updateTargetDescription();
    
    // Setup button event listener after slider is created
    this.setupClassifyButton();
  }

  private setupSpaceScene() {
    const spaceContainer = this.container.querySelector('#space-container') as HTMLElement;
    this.spaceScene = new SpaceScene(spaceContainer);
    
    // Create a representative planet based on current parameters
    this.updatePlanetVisualization();
  }

  private setupGameLogic() {
    this.slider.setOnChange((parameters: ExoplanetParameters) => {
      this.gameState.currentGuess = parameters;
      this.updatePlanetVisualization();
    });

    // Setup panel toggles
    this.setupPanelToggles();
    
    // Initially hide right panel arrow since feedback is empty
    this.updateRightPanelVisibility();
  }

  private setupClassifyButton() {
    // Wait a bit for the DOM to be fully rendered
    setTimeout(() => {
      const classifyBtn = this.container.querySelector('#classify-btn') as HTMLButtonElement;
      console.log('Game: Classify button found:', classifyBtn);
      if (classifyBtn) {
        classifyBtn.addEventListener('click', () => {
          console.log('Game: Classify button clicked!');
          this.handleClassification();
        });
        console.log('Game: Classify button event listener added');
      } else {
        console.error('Game: Classify button not found!');
      }
    }, 100);
  }

  private convertToExoplanetTypes(classifications: any[]): ExoplanetType[] {
    // Get default characteristics for each exoplanet type from the classifier
    const defaultCharacteristics = {
      'Earth-like': {
        massRange: [0.5, 2] as [number, number],
        radiusRange: [0.8, 1.5] as [number, number],
        temperatureRange: [250, 320] as [number, number],
        orbitalDistanceRange: [0.7, 1.5] as [number, number],
        atmosphereRange: [0.8, 1.2] as [number, number],
        compositionRange: [60, 90] as [number, number]
      },
      'Sub Earth': {
        massRange: [0.1, 0.5] as [number, number],
        radiusRange: [0.3, 0.8] as [number, number],
        temperatureRange: [200, 300] as [number, number],
        orbitalDistanceRange: [0.5, 1.5] as [number, number],
        atmosphereRange: [0.3, 1.0] as [number, number],
        compositionRange: [40, 80] as [number, number]
      },
      'Super Earth': {
        massRange: [2, 10] as [number, number],
        radiusRange: [1.2, 2] as [number, number],
        temperatureRange: [200, 350] as [number, number],
        orbitalDistanceRange: [0.5, 2] as [number, number],
        atmosphereRange: [1, 50] as [number, number],
        compositionRange: [30, 80] as [number, number]
      },
      'Hot Jupiter': {
        massRange: [50, 500] as [number, number],
        radiusRange: [8, 15] as [number, number],
        temperatureRange: [500, 2000] as [number, number],
        orbitalDistanceRange: [0.01, 0.1] as [number, number],
        atmosphereRange: [50, 200] as [number, number],
        compositionRange: [0, 20] as [number, number]
      },
      'Gas Giant': {
        massRange: [50, 1000] as [number, number],
        radiusRange: [8, 20] as [number, number],
        temperatureRange: [100, 500] as [number, number],
        orbitalDistanceRange: [1, 10] as [number, number],
        atmosphereRange: [50, 200] as [number, number],
        compositionRange: [0, 20] as [number, number]
      },
      'Ice Giant': {
        massRange: [10, 50] as [number, number],
        radiusRange: [3, 8] as [number, number],
        temperatureRange: [50, 200] as [number, number],
        orbitalDistanceRange: [5, 30] as [number, number],
        atmosphereRange: [10, 100] as [number, number],
        compositionRange: [20, 60] as [number, number]
      },
      'Ocean World': {
        massRange: [0.5, 5] as [number, number],
        radiusRange: [0.8, 2] as [number, number],
        temperatureRange: [250, 350] as [number, number],
        orbitalDistanceRange: [0.5, 2] as [number, number],
        atmosphereRange: [0.5, 2] as [number, number],
        compositionRange: [80, 100] as [number, number]
      },
      'Desert World': {
        massRange: [0.3, 3] as [number, number],
        radiusRange: [0.5, 1.5] as [number, number],
        temperatureRange: [300, 600] as [number, number],
        orbitalDistanceRange: [0.3, 1.5] as [number, number],
        atmosphereRange: [0.1, 1] as [number, number],
        compositionRange: [0, 20] as [number, number]
      }
    };

    return classifications.map(classification => ({
      name: classification.name,
      description: classification.description,
      characteristics: defaultCharacteristics[classification.name as keyof typeof defaultCharacteristics] || defaultCharacteristics['Earth-like'],
      probability: classification.probability
    }));
  }

  private setupPanelToggles() {
    const leftToggle = this.container.querySelector('#left-toggle') as HTMLElement;
    const rightToggle = this.container.querySelector('#right-toggle') as HTMLElement;
    const leftPanel = this.container.querySelector('#left-panel-content') as HTMLElement;
    const rightPanel = this.container.querySelector('#right-panel-content') as HTMLElement;
    const leftPanelContainer = this.container.querySelector('.left-panel') as HTMLElement;
    const rightPanelContainer = this.container.querySelector('.right-panel') as HTMLElement;

    // Left panel toggle
    leftToggle.addEventListener('click', () => {
      const isOpen = leftPanel.classList.contains('open');
      if (isOpen) {
        leftPanel.classList.remove('open');
        leftPanelContainer.classList.remove('open');
        leftToggle.querySelector('.arrow')!.textContent = '▶';
      } else {
        leftPanel.classList.add('open');
        leftPanelContainer.classList.add('open');
        leftToggle.querySelector('.arrow')!.textContent = '◀';
      }
    });

    // Right panel toggle
    rightToggle.addEventListener('click', () => {
      const isOpen = rightPanel.classList.contains('open');
      if (isOpen) {
        rightPanel.classList.remove('open');
        rightPanelContainer.classList.remove('open');
        rightToggle.querySelector('.arrow')!.textContent = '◀';
      } else {
        rightPanel.classList.add('open');
        rightPanelContainer.classList.add('open');
        rightToggle.querySelector('.arrow')!.textContent = '▶';
      }
    });
  }

  private updateTargetDescription() {
    const targetName = this.container.querySelector('#target-name') as HTMLElement;
    const targetDesc = this.container.querySelector('#target-description') as HTMLElement;
    
    targetName.textContent = this.t(getPlanetTranslation(this.gameState.targetExoplanet.name, 'name'));
    
    // Get description from classifier
    const allTypes = this.classifier.classify(this.gameState.targetExoplanet.parameters);
    const targetType = allTypes.find(type => type.name === this.gameState.targetExoplanet.name);
    
    if (targetType) {
      targetDesc.textContent = this.t(getPlanetTranslation(this.gameState.targetExoplanet.name, 'desc'));
    }
  }

  private updatePlanetVisualization() {
    // Clear existing objects
    this.spaceScene.objects.forEach(obj => {
      this.spaceScene.removeObject(obj);
    });
    this.spaceScene.objects = [];

    // Create enhanced celestial body based on current parameters
    const size = Math.max(0.5, Math.min(3, this.gameState.currentGuess.radius));
    const { temperature, composition, atmosphere, mass, brightness } = this.gameState.currentGuess;
    
    // Determine if it's a star or planet based on mass and temperature
    const isStar = mass > 10 || temperature > 1000;
    
    // Get planet configuration based on last classification if available
    let planetConfig: PlanetConfig | null = null;
    if (this.gameState.lastClassification.length > 0) {
      planetConfig = getTopClassificationConfig(this.gameState.lastClassification);
    }
    
    if (isStar) {
      this.createStar(size, temperature, brightness);
    } else {
      this.createEnhancedPlanet(size, temperature, composition, atmosphere, brightness, planetConfig);
    }
  }

  private createStar(size: number, temperature: number, brightness: number) {
    const starColor = this.getStarColor(temperature);
    const star = new Planet(
      'Current Star',
      size,
      {
        color: starColor,
        temperature: temperature,
        brightness: brightness,
      },
      0.02, // Rotación más rápida para estrellas
      0,    // Sin órbita
      0     // En el centro
    );
    
    // Agregar luz de estrella con brillo ajustable
    if (star.light) {
      star.light.intensity = 2.5 * brightness;
      star.light.distance = 50;
    }
    
    this.spaceScene.addObject(star);
  }

  private createEnhancedPlanet(size: number, temperature: number, composition: number, atmosphere: number, brightness: number, planetConfig: PlanetConfig | null) {
    const planetColor = this.getPlanetColor();
    
    // Usar configuración del planeta si está disponible
    const config = planetConfig || null;
    
    const planet = new Planet(
      'Current Planet',
      size,
      {
        color: planetColor,
        textureUrl: config?.textureUrl, // Use texture from config
        temperature: temperature,
        composition: composition,
        atmosphere: atmosphere,
        brightness: brightness,
        planetConfig: config
      },
      0.01,
      0, // Sin órbita para visualización individual
      0  // En el centro
    );
    
    this.spaceScene.addObject(planet);
  }

  private getStarColor(temperature: number): number {
    if (temperature < 3000) {
      return 0xff4500; // Enana roja
    } else if (temperature < 5000) {
      return 0xffa500; // Estrella naranja
    } else if (temperature < 6000) {
      return 0xffff00; // Estrella amarilla (como el Sol)
    } else if (temperature < 10000) {
      return 0xffffff; // Estrella blanca
    } else {
      return 0x87ceeb; // Gigante azul
    }
  }

  private getPlanetColor(): number {
    const { temperature, composition } = this.gameState.currentGuess;
    
    // Base color from temperature
    let r = 0, g = 0, b = 0;
    
    if (temperature < 250) {
      // Cold - blue/white
      r = 100; g = 150; b = 255;
    } else if (temperature < 350) {
      // Moderate - green/blue
      r = 100; g = 200; b = 150;
    } else if (temperature < 500) {
      // Warm - yellow/green
      r = 200; g = 200; b = 100;
    } else {
      // Hot - red/orange
      r = 255; g = 150; b = 100;
    }
    
    // Adjust for water content (more blue for high water)
    const waterFactor = composition / 100;
    r = Math.floor(r * (1 - waterFactor * 0.3));
    g = Math.floor(g * (1 - waterFactor * 0.2));
    b = Math.floor(b + waterFactor * 50);
    
    return (r << 16) | (g << 8) | b;
  }

  private async handleClassification() {
    console.log('Game: handleClassification called');
    
    if (this.gameState.gameWon) {
      console.log('Game: Early return - game already won');
      return;
    }

    this.gameState.attempts++;
    console.log('Game: Attempt', this.gameState.attempts);
    
    // Send parameters to backend AI for classification
    try {
      console.log('Game: Converting parameters to backend format');
      const backendData = exoplanetAPI.convertGameParametersToBackend(this.gameState.currentGuess);
      console.log('Game: Converted data', backendData);
      
      console.log('Game: Calling backend API');
      const response = await exoplanetAPI.classifyExoplanet(backendData);
      console.log('Game: Received response', response);
      
      // Convert backend response to frontend format
      this.gameState.lastClassification = this.convertToExoplanetTypes(response.classifications || []);
      console.log('Game: Updated lastClassification:', this.gameState.lastClassification);
      
      // Use the top prediction probability as similarity score
      const topClassification = this.gameState.lastClassification[0];
      this.gameState.similarity = topClassification ? topClassification.probability : 0;
      console.log('Game: Updated similarity:', this.gameState.similarity);
      
      // Debug: Log target and classifications for comparison
      console.log('Game: Target exoplanet:', this.gameState.targetExoplanet.name);
      console.log('Game: All classifications:', this.gameState.lastClassification.map(c => `${c.name} (${Math.round(c.probability * 100)}%)`));
      
      // Check if won - look for target in top classifications with reasonable confidence
      const targetClassification = this.gameState.lastClassification.find(
        c => c.name === this.gameState.targetExoplanet.name
      );
      
      if (targetClassification) {
        console.log(`Game: Found target "${this.gameState.targetExoplanet.name}" with ${Math.round(targetClassification.probability * 100)}% confidence`);
        
        // Win condition: target is in top 2 classifications with >60% confidence, OR top classification with >70% confidence
        const isTopClassification = targetClassification === topClassification;
        const isTopTwo = this.gameState.lastClassification.indexOf(targetClassification) < 2;
        const hasGoodConfidence = targetClassification.probability >= 0.6;
        const hasHighConfidence = targetClassification.probability >= 0.7;
        
        if ((isTopTwo && hasGoodConfidence) || (isTopClassification && hasHighConfidence)) {
          this.gameState.gameWon = true;
          console.log('Game: Game won!');
        }
      } else {
        console.log('Game: Target not found in classifications');
      }
      
    } catch (error) {
      console.error('Backend classification failed:', error);
      // Fallback to local classification
      this.gameState.lastClassification = this.classifier.classify(this.gameState.currentGuess);
      this.gameState.similarity = this.classifier.calculateSimilarity(
        this.gameState.currentGuess,
        this.gameState.targetExoplanet.parameters
      );
      
      // Check if won with local classifier - use same logic as backend
      const targetClassification = this.gameState.lastClassification.find(
        c => c.name === this.gameState.targetExoplanet.name
      );
      
      if (targetClassification) {
        console.log(`Game: Local classifier found target "${this.gameState.targetExoplanet.name}" with ${Math.round(targetClassification.probability * 100)}% confidence`);
        
        const topClassification = this.gameState.lastClassification[0];
        const isTopClassification = targetClassification === topClassification;
        const isTopTwo = this.gameState.lastClassification.indexOf(targetClassification) < 2;
        const hasGoodConfidence = targetClassification.probability >= 0.6;
        const hasHighConfidence = targetClassification.probability >= 0.7;
        
        if ((isTopTwo && hasGoodConfidence) || (isTopClassification && hasHighConfidence)) {
          this.gameState.gameWon = true;
        }
      }
    }

    this.updateUI();
    this.showFeedback();
    
    // Update planet visualization with new classification
    this.updatePlanetVisualization();
  }


  private updateUI() {
    const attemptsEl = this.container.querySelector('#attempts') as HTMLElement;
    
    attemptsEl.textContent = this.gameState.attempts.toString();
  }

  private showFeedback() {
    console.log('Game: showFeedback called with lastClassification:', this.gameState.lastClassification);
    const topClassification = this.gameState.lastClassification[0];
    console.log('Game: topClassification:', topClassification);
    
    let feedbackHTML = `
      <div class="feedback-section">
        <h4>${this.t("game.classification.result")}</h4>
        <div class="classification-result">
          <div class="top-result">
            <strong>${this.t(getPlanetTranslation(topClassification.name, 'name'))}</strong> (${Math.round(topClassification.probability * 100)}% match)
          </div>
          <p>${this.t(getPlanetTranslation(topClassification.name, 'desc'))}</p>
        </div>
        
        ${this.gameState.lastClassification.length > 1 ? `
          <div class="other-classifications">
            <h5>${this.t("game.other.possibilities")}:</h5>
            ${this.gameState.lastClassification.slice(1, 4).map(type => 
              `<div>${this.t(getPlanetTranslation(type.name, 'name'))} (${Math.round(type.probability * 100)}%)</div>`
            ).join('')}
          </div>
        ` : ''}
        
        <!-- Add similarity message with restart button -->
        <div class="similarity-feedback">
          ${this.getSimilarityMessage()}
        </div>
        
        <!-- Add general restart button for non-winning cases -->
        ${!this.gameState.gameWon ? `
          <div class="game-actions">
            <button id="restart-btn" class="restart-btn">🔄 ${this.t("game.restart")}</button>
          </div>
        ` : ''}
        
      </div>
    `;

    this.feedbackContainer.innerHTML = feedbackHTML;

    // Add restart button listener
    const restartBtn = this.feedbackContainer.querySelector('#restart-btn') as HTMLButtonElement;
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.restartGame();
      });
    }
    
    // Show right panel arrow since feedback now has content
    this.updateRightPanelVisibility();
  }

  private getSimilarityMessage(): string {
    const similarity = this.gameState.similarity;
    const topClassification = this.gameState.lastClassification[0];
    const isCorrectClassification = topClassification && topClassification.name === this.gameState.targetExoplanet.name;
    const hasHighConfidence = topClassification && topClassification.probability >= 0.8;
    
    if (this.gameState.gameWon) {
      // 50/50 chance to show either congratulations or real planet message
      const showRealPlanetMessage = Math.random() < 0.5;
      
      if (showRealPlanetMessage) {
        // Randomly choose between the two real planet messages
        const useFirstMessage = Math.random() < 0.5;
        const messageKey = useFirstMessage ? "game.feedback.real_planet_found" : "game.feedback.new_planet_discovered";
        return '<div class="similarity-perfect"><div class="message-content">' + this.t(messageKey) + '</div><button id="restart-btn" class="play-again-btn">🎉 ' + this.t("game.play.again") + '</button></div>';
      } else {
        return '<div class="similarity-perfect"><div class="message-content">' + this.t("game.feedback.no_planet_discovered") + '</div><button id="restart-btn" class="play-again-btn">🎉 ' + this.t("game.play.again") + '</button></div>';
      }
    } else if (isCorrectClassification && !hasHighConfidence) {
      return '<div class="similarity-good">' + this.t("game.feedback.correct_but_low_confidence") + ' (' + Math.round(topClassification.probability * 100) + '%)</div>';
    } else if (similarity >= 0.8) {
      return '<div class="similarity-excellent">' + this.t("game.feedback.close") + '</div>';
    } else if (similarity >= 0.6) {
      return '<div class="similarity-good">' + this.t("game.feedback.good") + '</div>';
    } else if (similarity >= 0.4) {
      return '<div class="similarity-fair">' + this.t("game.feedback.fair") + '</div>';
    } else {
      return '<div class="similarity-poor">' + this.t("game.feedback.poor") + '</div>';
    }
  }

  private updateRightPanelVisibility() {
    const rightToggle = this.container.querySelector('#right-toggle') as HTMLElement;
    const hasContent = this.feedbackContainer.innerHTML.trim() !== '';
    
    if (hasContent) {
      rightToggle.style.display = 'flex';
    } else {
      rightToggle.style.display = 'none';
    }
  }



  private restartGame() {
    this.gameState = this.initializeGame();
    this.slider.setParameters(this.gameState.currentGuess);
    this.updateTargetDescription();
    this.updateUI();
    this.updatePlanetVisualization();
    this.feedbackContainer.innerHTML = '';
    
    // Hide right panel arrow since feedback is now empty
    this.updateRightPanelVisibility();
  }

  public getGameState(): GameState {
    return { ...this.gameState };
  }
}
