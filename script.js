document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('screeningForm');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Add event listeners for progress tracking
    const radioInputs = form.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', updateProgress);
    });
    
    // Add name input listener
    const nameInput = document.getElementById('userName');
    nameInput.addEventListener('input', updateProgress);
    
    // Form submission
    form.addEventListener('submit', handleSubmit);
    
    // Add smooth animations to question cards
    animateQuestionCards();
}

function updateProgress() {
    const totalQuestions = 10; // Including name field
    let answeredQuestions = 0;
    
    // Check name field
    const nameInput = document.getElementById('userName');
    if (nameInput.value.trim()) {
        answeredQuestions++;
        document.querySelector('[data-question="0"]').classList.add('answered');
    }
    
    // Count answered questions
    for (let i = 1; i <= 9; i++) {
        const questionInputs = document.querySelectorAll(`input[name="q${i}"]`);
        const isAnswered = Array.from(questionInputs).some(input => input.checked);
        
        if (isAnswered) {
            answeredQuestions++;
            // Add visual feedback to answered question
            const questionCard = document.querySelector(`[data-question="${i}"]`);
            questionCard.classList.add('answered');
        }
    }
    
    // Update progress bar
    const progressPercentage = (answeredQuestions / totalQuestions) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${answeredQuestions} of ${totalQuestions} completed`;
    
    // Enable submit button when all questions are answered
    const submitBtn = document.getElementById('submitBtn');
    if (answeredQuestions === totalQuestions) {
        submitBtn.disabled = false;
        submitBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else {
        submitBtn.disabled = true;
        submitBtn.style.background = '#9ca3af';
    }
}

function handleSubmit(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.classList.add('loading');
    
    // Simulate processing time for better UX
    setTimeout(() => {
        const formData = new FormData(e.target);
        let totalScore = 0;
        let answeredQuestions = 0;
        
        // Calculate total score
        for (let i = 1; i <= 9; i++) {
            const answer = formData.get(`q${i}`);
            if (answer !== null) {
                totalScore += parseInt(answer);
                answeredQuestions++;
            }
        }
        
        const userName = document.getElementById('userName').value.trim();
        
        // Check if all questions are answered (should not happen due to button state)
        if (answeredQuestions < 10 || !userName) {
            showNotification('Please complete all fields before submitting.', 'error');
            submitBtn.classList.remove('loading');
            return;
        }
        
        // Set hidden form fields for Netlify
        document.getElementById('hiddenScore').value = totalScore;
        document.getElementById('hiddenDate').value = new Date().toISOString();
        
        // Display results with animation
        displayResults(totalScore, userName);
        submitBtn.classList.remove('loading');
    }, 1500);
}

function displayResults(score, userName) {
    const resultsDiv = document.getElementById('results');
    const scoreElement = document.getElementById('totalScore');
    const scorePercentage = document.getElementById('scorePercentage');
    const interpretationDiv = document.getElementById('interpretation');
    const scoreRing = document.getElementById('scoreRing');
    
    // Calculate percentage
    const percentage = Math.round((score / 27) * 100);
    
    // Animate score display
    animateScore(0, score, scoreElement);
    animateScore(0, percentage, scorePercentage, '%');
    
    // Animate progress ring
    const circumference = 2 * Math.PI * 50; // radius = 50
    const offset = circumference - (percentage / 100) * circumference;
    
    // Add SVG gradient
    addScoreGradient(scoreRing, percentage);
    
    setTimeout(() => {
        scoreRing.style.strokeDashoffset = offset;
    }, 500);
    
    // Generate interpretation
    const interpretation = generateInterpretation(score, percentage, userName);
    interpretationDiv.innerHTML = interpretation;
    
    // Set risk level for Netlify form
    let riskLevel = score <= 9 ? 'Low Risk' : score <= 18 ? 'Moderate Risk' : 'Higher Risk';
    document.getElementById('hiddenRiskLevel').value = riskLevel;
    
    // Hide form and show results with animation
    const form = document.getElementById('screeningForm');
    form.style.opacity = '0';
    form.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        form.style.display = 'none';
        resultsDiv.classList.remove('hidden');
        resultsDiv.style.opacity = '0';
        resultsDiv.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultsDiv.style.opacity = '1';
            resultsDiv.style.transform = 'translateY(0)';
            resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }, 300);
}

function animateScore(start, end, element, suffix = '') {
    const duration = 1500;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (end - start) * easeOutCubic);
        
        element.textContent = current + suffix;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

function addScoreGradient(ringElement, percentage) {
    // Create SVG gradient based on score
    const svg = ringElement.closest('svg');
    let defs = svg.querySelector('defs');
    
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.id = 'scoreGradient';
    
    let color1, color2;
    if (percentage <= 33) {
        color1 = '#10b981'; // Green
        color2 = '#34d399';
    } else if (percentage <= 66) {
        color1 = '#f59e0b'; // Yellow
        color2 = '#fbbf24';
    } else {
        color1 = '#ef4444'; // Red
        color2 = '#f87171';
    }
    
    gradient.innerHTML = `
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
    `;
    
    defs.appendChild(gradient);
    ringElement.style.stroke = 'url(#scoreGradient)';
}

function generateInterpretation(score, percentage, userName) {
    let interpretation = '';
    let riskLevel = '';
    let recommendations = '';
    
    if (score <= 9) {
        riskLevel = 'Low Risk';
        interpretation = `
            <div class="risk-badge low-risk">Low Risk</div>
            <h3>Hello ${userName}, Minimal Arrhythmia Symptoms</h3>
            <p>${userName}, your assessment indicates minimal symptoms associated with arrhythmias. This is a positive result suggesting your heart rhythm symptoms are likely not significant at this time.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Recommendations for ${userName}:</h4>
                <ul>
                    <li>Continue maintaining a healthy lifestyle</li>
                    <li>Monitor symptoms and note any changes</li>
                    <li>Regular check-ups with your healthcare provider</li>
                    <li>Maintain good sleep hygiene and stress management</li>
                </ul>
            </div>
        `;
    } else if (score <= 18) {
        riskLevel = 'Moderate Risk';
        interpretation = `
            <div class="risk-badge moderate-risk">Moderate Risk</div>
            <h3>Hello ${userName}, Moderate Arrhythmia Symptoms</h3>
            <p>${userName}, your assessment suggests moderate symptoms that may be related to arrhythmias. While not immediately concerning, these symptoms warrant medical attention for proper evaluation.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Recommendations for ${userName}:</h4>
                <ul>
                    <li>Schedule an appointment with your healthcare provider</li>
                    <li>Consider keeping a symptom diary</li>
                    <li>Discuss your symptoms and medical history with a doctor</li>
                    <li>Avoid excessive caffeine and stress when possible</li>
                </ul>
            </div>
        `;
    } else {
        riskLevel = 'Higher Risk';
        interpretation = `
            <div class="risk-badge high-risk">Higher Risk</div>
            <h3>Hello ${userName}, Significant Arrhythmia Symptoms</h3>
            <p>${userName}, your assessment indicates significant symptoms that may be associated with arrhythmias. It is important to seek medical evaluation promptly to determine the cause and appropriate treatment.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Immediate Recommendations for ${userName}:</h4>
                <ul>
                    <li><strong>Contact your healthcare provider soon</strong></li>
                    <li>Consider urgent care if symptoms are severe or worsening</li>
                    <li>Keep a detailed record of your symptoms</li>
                    <li>Avoid strenuous activities until evaluated by a doctor</li>
                </ul>
            </div>
        `;
    }
    
    return interpretation + recommendations + `
        <div class="disclaimer-box">
            <p><strong>Important for ${userName}:</strong> This assessment is for informational purposes only and does not constitute medical advice. Always consult with qualified healthcare professionals for proper diagnosis and treatment.</p>
        </div>
    `;
}

function animateQuestionCards() {
    const cards = document.querySelectorAll('.question-card');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, { threshold: 0.1 });
    
    cards.forEach(card => {
        observer.observe(card);
    });
}

function resetForm() {
    // Reset form with animation
    const form = document.getElementById('screeningForm');
    const results = document.getElementById('results');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    // Animate results out
    results.style.opacity = '0';
    results.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        // Reset form state
        form.reset();
        
        // Remove answered classes
        document.querySelectorAll('.question-card').forEach(card => {
            card.classList.remove('answered');
        });
        
        // Reset progress
        progressFill.style.width = '0%';
        progressText.textContent = '0 of 10 completed';
        
        // Reset submit button
        submitBtn.disabled = true;
        submitBtn.style.background = '#9ca3af';
        
        // Show form and hide results
        results.classList.add('hidden');
        form.style.display = 'block';
        form.style.opacity = '0';
        form.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            form.style.opacity = '1';
            form.style.transform = 'translateY(0)';
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
    }, 300);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}