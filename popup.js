document.addEventListener('DOMContentLoaded', function () {
    const loadProfile1Button = document.getElementById('loadProfile1Button');
    const profile1NameDisplay = document.getElementById('profile1Name');
    const profile1HeadlineDisplay = document.getElementById('profile1Headline');
    const profile1SchoolDisplay = document.getElementById('profile1School');
    const profile1CompanyDisplay = document.getElementById('profile1Company');

    const loadProfile2Button = document.getElementById('loadProfile2Button');
    const profile2NameDisplay = document.getElementById('profile2Name');
    const profile2HeadlineDisplay = document.getElementById('profile2Headline');
    const profile2SchoolDisplay = document.getElementById('profile2School');
    const profile2CompanyDisplay = document.getElementById('profile2Company');

    const calculateMatchButton = document.getElementById('calculateMatchButton');
    const resultsSection = document.getElementById('resultsSection');
    const matchPercentageDisplay = document.getElementById('matchPercentage');
    const matchScoreCircle = document.getElementById('matchScoreCircle');
    const matchBreakdownDisplay = document.getElementById('matchBreakdown');

    const heartModal = document.getElementById('heartModal');
    const closeModalButton = heartModal.querySelector('.close-button');
    const heartIconDisplay = document.getElementById('heartIconDisplay');
    const modalTitle = document.getElementById('modalTitle');
    const connectionFactDisplay = document.getElementById('connectionFact');

    let profile1Data = null;
    let profile2Data = null;

    const connectionFacts = {
        low: [
            "Sorry, it seems like your professional vibes might be on different frequencies. Keep networking!",
            "Sometimes the best connection is realizing it's not the right connection. Onward and upward!",
            "Don't worry, there are plenty of other LinkedIn profiles in the sea! Your perfect professional match is out there.",
            "Compatibility isn't always about shared interests, but about shared direction. Maybe your paths diverge here.",
            "Every 'no' gets you closer to a 'yes'. Keep building your network!",
            "Love isn't always about shared pasts, but about shared futures. Keep searching for that perfect professional synergy."
        ],
        medium: [
            "A yellow heart for a promising connection! There's definite potential for a great professional relationship here.",
            "Good vibes are in the air! You share some strong common ground for collaboration and growth.",
            "This connection has potential! Explore further to see how your professional journeys can align.",
            "Building bridges takes effort, but the foundation is there. This could lead to something great!",
            "Mutual growth begins with mutual understanding. You're off to a solid start!"
        ],
        good: [
            "A green heart for a fantastic match! You share a significant number of professional commonalities.",
            "Excellent connection potential! Your professional paths seem to align beautifully.",
            "This is a strong professional pairing! Get ready for some synergistic collaborations.",
            "High compatibility detected! You've found someone on your professional wavelength.",
            "The stars are aligning for a great professional relationship!"
        ],
        excellent: [
            "A sparkling heart for an undeniable connection! This is a rare and powerful professional match!",
            "Off the charts! You've found a professional soulmate. The potential for impact is immense.",
            "This is more than a match, it's destiny! Prepare for groundbreaking collaborations.",
            "Unbelievable compatibility! Your professional journeys are perfectly intertwined.",
            "It's a perfect match! You're professionally inseparable."
        ]
    };

    function saveProfileData(profileNum, data) {
        if (profileNum === 1) {
            chrome.storage.local.set({ 'profile1Data': data }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error saving profile 1 data:", chrome.runtime.lastError.message);
                } else {
                    console.log('Profile 1 data saved.');
                }
            });
        } else if (profileNum === 2) {
            chrome.storage.local.set({ 'profile2Data': data }, function() {
                if (chrome.runtime.lastError) {
                    console.error("Error saving profile 2 data:", chrome.runtime.lastError.message);
                } else {
                    console.log('Profile 2 data saved.');
                }
            });
        }
    }

    function loadSavedProfiles() {
        chrome.storage.local.get(['profile1Data', 'profile2Data'], function(result) {
            if (chrome.runtime.lastError) {
                console.error("Error loading saved profiles:", chrome.runtime.lastError.message);
                return;
            }
            if (result.profile1Data) {
                updateProfileDisplay(1, result.profile1Data, false);
            }
            if (result.profile2Data) {
                updateProfileDisplay(2, result.profile2Data, false);
            }
            checkIfReadyToCalculate();
        });
    }

    function updateProfileDisplay(profileNum, data, save = true) {
        if (!data) {
            console.warn(`No data provided for profile ${profileNum}`);
            return;
        }
        if (profileNum === 1) {
            profile1NameDisplay.textContent = data.name || 'N/A';
            profile1HeadlineDisplay.textContent = data.headline || 'N/A';
            profile1SchoolDisplay.textContent = data.school || 'N/A';
            profile1CompanyDisplay.textContent = data.company || 'N/A';
            profile1Data = data;
        } else if (profileNum === 2) {
            profile2NameDisplay.textContent = data.name || 'N/A';
            profile2HeadlineDisplay.textContent = data.headline || 'N/A';
            profile2SchoolDisplay.textContent = data.school || 'N/A';
            profile2CompanyDisplay.textContent = data.company || 'N/A';
            profile2Data = data;
        }
        if (save) {
            saveProfileData(profileNum, data);
        }
        checkIfReadyToCalculate();
    }

    async function loadProfileData(profileNum) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && (tab.url.includes("linkedin.com/in/") || tab.url.includes("linkedin.com/company/"))) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                }).catch(err => console.log("Content script might already be injected or error:", err));

                const response = await chrome.tabs.sendMessage(tab.id, { action: "fetchExtendedProfileInfo" });
                if (chrome.runtime.lastError) {
                     alert(`Profile ${profileNum}: Could not communicate with content script: ${chrome.runtime.lastError.message}. Ensure the extension was reloaded after changes, and you are on a valid LinkedIn profile.`);
                     console.error("chrome.runtime.lastError after sendMessage:", chrome.runtime.lastError.message);
                     return;
                }

                if (response) {
                    updateProfileDisplay(profileNum, response, true);
                } else {
                    alert(`Profile ${profileNum}: No response from page. Ensure you're on a profile and the content script is active. Try reloading the extension and the page.`);
                }
            } else {
                alert(`Profile ${profileNum}: Please navigate to a valid LinkedIn profile or company page first.`);
            }
        } catch (error) {
            alert(`Profile ${profileNum}: Failed to fetch: ${error.message}. Is the extension reloaded? Are you on a LinkedIn profile page? The content script might not be responding.`);
            console.error(`Error loading profile data for profile ${profileNum}:`, error);
        }
    }

    loadProfile1Button.addEventListener('click', () => loadProfileData(1));
    loadProfile2Button.addEventListener('click', () => loadProfileData(2));

    function checkIfReadyToCalculate() {
        if (profile1Data && profile2Data) {
            calculateMatchButton.disabled = false;
        } else {
            calculateMatchButton.disabled = true;
        }
    }

    loadSavedProfiles();
    checkIfReadyToCalculate();

    calculateMatchButton.addEventListener('click', () => {
        if (!profile1Data || !profile2Data) {
            alert("Please load data for both profiles first.");
            return;
        }

        let score = 0;
        let breakdownHtml = "";

        if (profile1Data.school && profile1Data.school !== 'N/A' && profile1Data.school === profile2Data.school) {
            score += 30;
            breakdownHtml += `<p>🎓 Shared Education: Both attended <strong>${profile1Data.school}</strong>!</p>`;
        }

        if (profile1Data.company && profile1Data.company !== 'N/A' && profile1Data.company === profile2Data.company) {
            score += 25;
            breakdownHtml += `<p>🤝 Work Together: Both associated with <strong>${profile1Data.company}</strong>!</p>`;
        }

        const headlineKeywords1 = profile1Data.headline ? profile1Data.headline.toLowerCase().match(/\b(\w{4,})\b/g) || [] : [];
        const headlineKeywords2 = profile2Data.headline ? profile2Data.headline.toLowerCase().match(/\b(\w{4,})\b/g) || [] : [];
        const sharedHeadlineKeywords = [...new Set(headlineKeywords1)].filter(k => headlineKeywords2.includes(k));
        if (sharedHeadlineKeywords.length > 0) {
            let headlineScore = Math.min(sharedHeadlineKeywords.length * 5, 25);
            score += headlineScore;
            breakdownHtml += `<p>🗣️ Headline Sync: Shared keyword(s) like <strong>${sharedHeadlineKeywords.slice(0,3).join(', ')}</strong>.</p>`;
        }

        if (profile1Data.summaryText && profile1Data.summaryText !== 'N/A' && profile2Data.summaryText && profile2Data.summaryText !== 'N/A') {
            const getSignificantWords = (text) => {
                const stopWords = new Set(["a", "an", "the", "and", "or", "but", "about", "above", "after", "again", "against", "all", "am", "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "by", "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some", "such", "than", "that", "that's", "their", "theirs", "them", "themselves", "then", "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours", "yourself", "yourselves", "also", "just", "like", "will", "work", "company", "experience", "role"]);
                return text.toLowerCase()
                           .match(/\b[a-zA-Z]{4,}\b/g)
                           ?.filter(word => !stopWords.has(word)) || [];
            };

            let summaryWords1 = getSignificantWords(profile1Data.summaryText);
            let summaryWords2 = getSignificantWords(profile2Data.summaryText);

            const getTermFrequency = (wordArray) => {
                const tf = {};
                wordArray.forEach(word => {
                    tf[word] = (tf[word] || 0) + 1;
                });
                return tf;
            };

            const tf1 = getTermFrequency(summaryWords1);
            const tf2 = getTermFrequency(summaryWords2);

            let commonSignificantWords = [];
            let currentSummaryScore = 0;

            for (const word in tf1) {
                if (tf2[word]) {
                    const weight = Math.min(tf1[word], tf2[word]);
                    currentSummaryScore += weight * 2;
                    commonSignificantWords.push(word);
                }
            }
             commonSignificantWords.sort((a, b) => (tf1[b] + (tf2[b] || 0)) - (tf1[a] + (tf2[a] || 0)));


            if (commonSignificantWords.length > 0) {
                let summaryScore = Math.min(currentSummaryScore, 20);
                score += summaryScore;
                breakdownHtml += `<p>💡 About You Vibe: Similar themes in summaries (e.g., <strong>${commonSignificantWords.slice(0,3).join(', ')}</strong>).</p>`;
            }
        }

        let percentage = Math.min(Math.max(score, 0), 100);

        matchPercentageDisplay.textContent = `${percentage}%`;
        matchBreakdownDisplay.innerHTML = breakdownHtml || "<p>No direct commonalities found with current data. Broaden search or check profile details!</p>";
        resultsSection.style.display = 'block';

        const circleSpan = matchScoreCircle.querySelector('span');
        if (percentage >= 75) {
            matchScoreCircle.style.borderColor = '#28a745';
            if (circleSpan) circleSpan.style.color = '#28a745';
        } else if (percentage >= 50) {
            matchScoreCircle.style.borderColor = '#ffc107';
            if (circleSpan) circleSpan.style.color = '#ffc107';
        } else {
            matchScoreCircle.style.borderColor = '#dc3545';
            if (circleSpan) circleSpan.style.color = '#dc3545';
        }

        heartIconDisplay.className = 'heart-icon-display';
        let titleText = "";
        let quotesArray = [];
        let heartEmoji = "";

        if (percentage <= 50) {
            heartEmoji = '💔';
            titleText = "Sorry, Try Someone Else!";
            quotesArray = connectionFacts.low;
            heartIconDisplay.classList.add('heart-icon-broken');
        } else if (percentage <= 80) {
            heartEmoji = '💛';
            titleText = "Promising Connection!";
            quotesArray = connectionFacts.medium;
            heartIconDisplay.classList.add('heart-icon-yellow');
        } else if (percentage <= 90) {
            heartEmoji = '💚';
            titleText = "Great Match Potential!";
            quotesArray = connectionFacts.good;
            heartIconDisplay.classList.add('heart-icon-green');
        } else {
            heartEmoji = '💖';
            titleText = "Perfect Professional Match!";
            quotesArray = connectionFacts.excellent;
            heartIconDisplay.classList.add('heart-icon-red');
        }

        heartIconDisplay.textContent = heartEmoji;
        modalTitle.textContent = titleText;
        const randomIndex = Math.floor(Math.random() * quotesArray.length);
        connectionFactDisplay.textContent = quotesArray[randomIndex];
        heartModal.style.display = 'flex';
    });

    closeModalButton.addEventListener('click', () => {
        heartModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target == heartModal) {
            heartModal.style.display = 'none';
        }
    });
});
