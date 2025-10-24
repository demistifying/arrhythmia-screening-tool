document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    const form = document.getElementById('screeningForm');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    const radioInputs = form.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(input => {
        input.addEventListener('change', updateProgress);
    });
    
    const nameInput = document.getElementById('userName');
    nameInput.addEventListener('input', updateProgress);
    
    form.addEventListener('submit', handleSubmit);
    
    animateQuestionCards();
}

function updateProgress() {
    const totalQuestions = 20;
    let answeredQuestions = 0;
    
    const nameInput = document.getElementById('userName');
    if (nameInput.value.trim()) {
        answeredQuestions++;
        document.querySelector('[data-question="0"]').classList.add('answered');
    }
    
    const questionNames = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 
                          'b10', 'b11', 'b12', 'c13', 'c14', 'c15', 'c16', 
                          'd17', 'd18', 'd19'];
    
    questionNames.forEach((name, index) => {
        const questionInputs = document.querySelectorAll(`input[name="${name}"]`);
        const isAnswered = Array.from(questionInputs).some(input => input.checked);
        
        if (isAnswered) {
            answeredQuestions++;
            const questionCard = document.querySelector(`[data-question="${index + 1}"]`);
            if (questionCard) {
                questionCard.classList.add('answered');
            }
        }
    });
    
    const progressPercentage = (answeredQuestions / totalQuestions) * 100;
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    progressFill.style.width = `${progressPercentage}%`;
    progressText.textContent = `${answeredQuestions} of ${totalQuestions} completed`;
    
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
    
    const form = e.target;
    const formData = new FormData(form);
    let totalScore = 0;
    
    const questionNames = ['a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8', 'a9', 
                          'b10', 'b11', 'b12', 'c13', 'c14', 'c15', 'c16', 
                          'd17', 'd18', 'd19'];
    
    questionNames.forEach(name => {
        const answer = formData.get(name);
        if (answer !== null) {
            totalScore += parseInt(answer);
        }
    });
    
    const userName = document.getElementById('userName').value.trim();
    
    let validationCount = 0;
    if (userName) validationCount++;
    questionNames.forEach(name => {
        if (formData.get(name) !== null) validationCount++;
    });
    
    if (validationCount < 20 || !userName) {
        showNotification('Please complete all fields before submitting.', 'error');
        submitBtn.classList.remove('loading');
        return;
    }
    
    const a2Value = parseInt(formData.get('a2') || '0');
    const a5Value = parseInt(formData.get('a5') || '0');
    const hasWarningFlags = a2Value === 1 || a5Value === 1;
    
    const c13Value = parseInt(formData.get('c13') || '0');
    const c14Value = parseInt(formData.get('c14') || '0');
    const c15Value = parseInt(formData.get('c15') || '0');
    const c16Value = parseInt(formData.get('c16') || '0');
    const hasRiskFactors = (c13Value + c14Value + c15Value + c16Value) > 0;
    
    document.getElementById('hiddenScore').value = totalScore;
    document.getElementById('hiddenDate').value = new Date().toISOString();
    
    let riskLevel = totalScore <= 5 ? 'Low Risk' : totalScore <= 12 ? 'Moderate Risk' : 'Higher Risk';
    document.getElementById('hiddenRiskLevel').value = riskLevel;
    
    let warningFlags = [];
    if (a2Value === 1) warningFlags.push('Dizziness/Fainting');
    if (a5Value === 1) warningFlags.push('Irregular Pulse');
    document.getElementById('hiddenWarningFlags').value = warningFlags.join(', ');
    
    fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
    })
    .then(() => {
        setTimeout(() => {
            displayResults(totalScore, userName, hasWarningFlags, hasRiskFactors);
            submitBtn.classList.remove('loading');
        }, 1500);
    })
    .catch((error) => {
        console.error('Form submission error:', error);
        showNotification('Submission successful! Viewing your results...', 'info');
        setTimeout(() => {
            displayResults(totalScore, userName, hasWarningFlags, hasRiskFactors);
            submitBtn.classList.remove('loading');
        }, 1500);
    });
}

function displayResults(score, userName, hasWarningFlags, hasRiskFactors) {
    const resultsDiv = document.getElementById('results');
    const scoreElement = document.getElementById('totalScore');
    const scorePercentage = document.getElementById('scorePercentage');
    const interpretationDiv = document.getElementById('interpretation');
    const scoreRing = document.getElementById('scoreRing');
    
    const percentage = Math.round((score / 24) * 100);
    
    animateScore(0, score, scoreElement);
    animateScore(0, percentage, scorePercentage, '%');
    
    const circumference = 2 * Math.PI * 50;
    const offset = circumference - (percentage / 100) * circumference;
    
    addScoreGradient(scoreRing, percentage);
    
    setTimeout(() => {
        scoreRing.style.strokeDashoffset = offset;
    }, 500);
    
    const interpretation = generateInterpretation(score, percentage, userName, hasWarningFlags, hasRiskFactors);
    interpretationDiv.innerHTML = interpretation;
    
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
    const svg = ringElement.closest('svg');
    let defs = svg.querySelector('defs');
    
    if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        svg.appendChild(defs);
    }
    
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.id = 'scoreGradient';
    
    let color1, color2;
    if (percentage <= 20) {
        color1 = '#10b981';
        color2 = '#34d399';
    } else if (percentage <= 50) {
        color1 = '#f59e0b';
        color2 = '#fbbf24';
    } else {
        color1 = '#ef4444';
        color2 = '#f87171';
    }
    
    gradient.innerHTML = `
        <stop offset="0%" stop-color="${color1}"/>
        <stop offset="100%" stop-color="${color2}"/>
    `;
    
    defs.appendChild(gradient);
    ringElement.style.stroke = 'url(#scoreGradient)';
}

function generateInterpretation(score, percentage, userName, hasWarningFlags, hasRiskFactors) {
    let interpretation = '';
    let riskLevel = '';
    let recommendations = '';
    let warningSection = '';
    
    if (hasWarningFlags) {
        warningSection = `
            <div class="warning-box">
                <h4>⚠️ Important Warning Flags</h4>
                <p>You answered "Yes" to critical symptom questions (dizziness/fainting or irregular pulse). These symptoms warrant medical attention regardless of your total score.</p>
            </div>
        `;
    }
    
    if (score <= 5) {
        riskLevel = 'Low Risk';
        interpretation = `
            <div class="risk-badge low-risk">Low Likelihood</div>
            <h3>Hello ${userName}, Low Arrhythmia Symptom Burden</h3>
            <p>${userName}, your assessment indicates a low likelihood of significant arrhythmia symptoms. Your score of ${score} out of 24 suggests minimal symptom burden at this time.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Recommendations for ${userName}:</h4>
                <ul>
                    <li>Continue monitoring your symptoms</li>
                    <li>Maintain a healthy lifestyle with regular exercise</li>
                    <li>Practice stress management techniques</li>
                    <li>Regular check-ups with your healthcare provider</li>
                </ul>
            </div>
        `;
    } else if (score <= 12) {
        riskLevel = 'Moderate Risk';
        interpretation = `
            <div class="risk-badge moderate-risk">Moderate Possibility</div>
            <h3>Hello ${userName}, Moderate Arrhythmia Symptoms</h3>
            <p>${userName}, your assessment suggests a moderate possibility of arrhythmia symptoms. Your score of ${score} out of 24 indicates you should discuss these symptoms with your healthcare provider.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Recommendations for ${userName}:</h4>
                <ul>
                    <li><strong>Schedule an appointment with your healthcare provider</strong></li>
                    <li>Keep a detailed symptom diary (timing, duration, triggers)</li>
                    <li>Note any patterns with exercise, caffeine, or stress</li>
                    <li>Discuss potential ECG or cardiac monitoring</li>
                    ${hasRiskFactors ? '<li><strong>Given your risk factors, evaluation is particularly important</strong></li>' : ''}
                </ul>
            </div>
        `;
    } else {
        riskLevel = 'Higher Risk';
        interpretation = `
            <div class="risk-badge high-risk">Higher Likelihood</div>
            <h3>Hello ${userName}, Significant Arrhythmia Symptom Burden</h3>
            <p>${userName}, your assessment indicates a higher likelihood of arrhythmia-related symptoms or risk. Your score of ${score} out of 24 strongly suggests the need for medical evaluation including ECG/cardiac monitoring.</p>
        `;
        recommendations = `
            <div class="recommendations">
                <h4>Immediate Recommendations for ${userName}:</h4>
                <ul>
                    <li><strong>Contact your healthcare provider promptly</strong></li>
                    <li><strong>Request ECG and/or cardiac monitoring evaluation</strong></li>
                    <li>Keep a detailed record of all symptoms with dates and times</li>
                    <li>Avoid excessive caffeine, alcohol, and strenuous activities until evaluated</li>
                    ${hasRiskFactors ? '<li><strong>Your risk factors increase the urgency of evaluation</strong></li>' : ''}
                    <li>Seek urgent care if symptoms worsen or become severe</li>
                </ul>
            </div>
        `;
    }
    
    let additionalNotes = '';
    if (hasRiskFactors && score > 6) {
        additionalNotes = `
            <div class="info-box">
                <h4>ℹ️ Risk Factor Consideration</h4>
                <p>You indicated having one or more cardiovascular risk factors combined with a moderate or higher score. This increases the importance of prompt medical evaluation.</p>
            </div>
        `;
    }
    
    return warningSection + interpretation + recommendations + additionalNotes + `
        <div class="disclaimer-box">
            <p><strong>Important for ${userName}:</strong> This assessment is for informational purposes only and does not constitute medical advice, diagnosis, or treatment. The score is based on symptom reporting and risk stratification. Always consult with qualified healthcare professionals for proper evaluation, diagnosis, and treatment. Lifestyle factors raise risk but alone do not confirm arrhythmia.</p>
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
    const form = document.getElementById('screeningForm');
    const results = document.getElementById('results');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    results.style.opacity = '0';
    results.style.transform = 'translateY(-20px)';
    
    setTimeout(() => {
        form.reset();
        
        document.querySelectorAll('.question-card').forEach(card => {
            card.classList.remove('answered');
        });
        
        progressFill.style.width = '0%';
        progressText.textContent = '0 of 20 completed';
        
        submitBtn.disabled = true;
        submitBtn.style.background = '#9ca3af';
        
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
