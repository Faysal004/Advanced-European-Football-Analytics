// Global variables
let currentMode = 'general';
let geminiApiKey = 'AIzaSyD08u4YIqUVO3AMYoxvTHag_6Wori-WdtA'; // Pre-filled API key

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Advanced Football Analytics Ready!');
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    // Pre-fill the API key
    document.getElementById('geminiApiKey').value = geminiApiKey;
}

function setupEventListeners() {
    // Auto-resize textarea
    document.getElementById('query').addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // Keyboard shortcuts
    document.getElementById('query').addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            analyzeFootball();
        }
    });
    
    // Update API key on input
    document.getElementById('geminiApiKey').addEventListener('input', function() {
        geminiApiKey = this.value;
    });
}

function selectMode(mode) {
    currentMode = mode;
    
    // Update active button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update placeholder text based on mode
    const textarea = document.getElementById('query');
    const placeholders = {
        'general': 'e.g., Compare Manchester City and Bayern Munich\'s Champions League performance over the last 5 years',
        'young-talents': 'e.g., Find the most promising players under 21 in Europe with highest potential value',
        'transfer-values': 'e.g., Analyze the most expensive transfers in 2024 and their impact on team performance',
        'live-stats': 'e.g., Get current season statistics for top scorers in Premier League'
    };
    
    textarea.placeholder = placeholders[mode];
}

function setQuery(text) {
    document.getElementById('query').value = text;
    document.getElementById('query').focus();
}

async function quickAnalysis(type) {
    const queries = {
        'top-young-players': 'Analyze the top 15 most valuable players under 21 in European football, including their current market values, potential, and which clubs they play for',
        'most-expensive-transfers': 'List and analyze the most expensive football transfers in 2024, including transfer fees, player performance impact, and whether they were worth the investment',
        'emerging-talents': 'Identify emerging young talents (18-22 years old) from each major European league who have shown significant development and market value growth',
        'market-trends': 'Analyze current football transfer market trends, including which positions are most expensive, which leagues are spending most, and inflation patterns'
    };
    
    document.getElementById('query').value = queries[type];
    await analyzeFootball();
}

async function analyzeFootball() {
    geminiApiKey = document.getElementById('geminiApiKey').value.trim();
    const query = document.getElementById('query').value.trim();
    
    // Hide previous results and errors
    document.getElementById('result').style.display = 'none';
    document.getElementById('error').style.display = 'none';
    document.getElementById('dataSources').style.display = 'none';
    
    // Validate input
    if (!geminiApiKey) {
        showError('Please provide your Google Gemini API key to continue');
        return;
    }
    
    if (!query) {
        showError('Please enter your football analysis query');
        return;
    }
    
    // Show loading
    document.getElementById('loading').style.display = 'block';
    document.querySelector('.analyze-btn').disabled = true;
    
    try {
        // Show data source
        showDataSources(['Google Gemini 2.0']);
        
        // Create enhanced prompt based on mode
        const enhancedPrompt = createEnhancedPrompt(query, currentMode);
        
        // Call Google Gemini API
        const analysis = await callGemini(enhancedPrompt);
        
        // Show results
        showResult(analysis);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showError(`Analysis failed: ${error.message}`);
    } finally {
        // Hide loading
        document.getElementById('loading').style.display = 'none';
        document.querySelector('.analyze-btn').disabled = false;
    }
}

function createEnhancedPrompt(query, mode) {
    let basePrompt = `As a professional football analyst with extensive knowledge of European football, analyze the following query: "${query}"\n\n`;
    
    // Add mode-specific instructions
    const modeInstructions = {
        'general': 'Provide comprehensive analysis including tactics, performance metrics, and strategic insights.',
        'young-talents': 'Focus specifically on young players (under 23), their development potential, current estimated market values, playing style, and future prospects. Include specific ages, positions, and estimated market values in millions of euros.',
        'transfer-values': 'Analyze transfer market data including current estimated market values, recent transfer fees, contract details, and financial impact. Include specific monetary figures and market trends.',
        'live-stats': 'Focus on current season statistics, recent performance data, form guides, and up-to-date metrics for the 2024-2025 season.'
    };
    
    basePrompt += `Analysis Focus: ${modeInstructions[mode]}\n\n`;
    
    basePrompt += `Please provide a detailed analysis including:
    - Key statistics and performance metrics
    - Player comparisons with specific data points  
    - Market value analysis (when relevant) with estimates in €millions
    - Historical context and trends
    - Current season insights (2024-2025)
    - Specific examples and observations
    - Future predictions and potential
    - Age-specific analysis for young players when relevant
    
    Format your response in a structured, professional manner with clear sections and data points. Include specific numbers, ages, and estimated values where possible.`;
    
    return basePrompt;
}

async function callGemini(prompt) {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': geminiApiKey
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `You are a professional football analyst with deep knowledge of European football, player statistics, transfer markets, and tactical analysis. Provide detailed, accurate, and insightful analysis with specific data points and market values.\n\n${prompt}`
                }]
            }],
            generationConfig: {
                maxOutputTokens: 3000,
                temperature: 0.7
            }
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
}

function showDataSources(sources) {
    const sourcesList = document.getElementById('sourcesList');
    sourcesList.innerHTML = sources.map(source => 
        `<span class="source-tag">${source}</span>`
    ).join('');
    document.getElementById('dataSources').style.display = 'block';
}

function showResult(analysis) {
    // Show analysis in main tab
    const resultContent = document.getElementById('resultContent');
    let formattedAnalysis = formatAnalysis(analysis);
    resultContent.innerHTML = formattedAnalysis;
    
    // Show raw Gemini response in data tab
    document.getElementById('rawData').textContent = 'Raw Google Gemini Response:\n\n' + analysis;
    
    // Create charts placeholder
    createCharts();
    
    // Show result section
    document.getElementById('result').style.display = 'block';
    
    // Scroll to results
    document.getElementById('result').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function formatAnalysis(analysis) {
    // Enhanced formatting for better readability
    let formatted = analysis
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong class="highlight">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/(\d+(?:\.\d+)?[€$£M]+)/g, '<span class="highlight">$1</span>')
        .replace(/(\d{1,2}-\d{1,2})/g, '<span class="highlight">$1</span>'); // Score highlighting
    
    return `<p>${formatted}</p>`;
}

function createCharts() {
    const chartsContainer = document.getElementById('chartsContainer');
    
            chartsContainer.innerHTML = `
        <div class="chart-placeholder">
            <h4>📊 Analysis Insights</h4>
            <p>Google Gemini provides comprehensive analysis with:</p>
            <ul style="text-align: left; margin: 15px 0; line-height: 1.6;">
                <li>• Detailed player statistics and comparisons</li>
                <li>• Market value analysis and trends</li>
                <li>• Performance metrics and ratings</li>
                <li>• Strategic insights and predictions</li>
                <li>• Age-based analysis for young talents</li>
                <li>• Transfer market evaluations</li>
            </ul>
            <p><em>All insights are presented in the main Analysis tab.</em></p>
        </div>
    `;
}

function showTab(tabName) {
    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
}

function showError(message) {
    const errorDiv = document.getElementById('error');
    errorDiv.innerHTML = `
        <strong>⚠️ Error:</strong> ${message}
        <br><small>Check your API key and internet connection</small>
    `;
    errorDiv.style.display = 'block';
}

// Utility functions for formatting
function formatCurrency(value) {
    if (value >= 1000000) {
        return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
        return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
}