chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fetchExtendedProfileInfo") {
        const profileInfo = {
            name: "N/A",
            headline: "N/A",
            url: window.location.href,
            school: "N/A",
            company: "N/A",
            summaryText: "N/A",
            topSkills: []
        };

        const getTextContent = (selector) => {
            const element = document.querySelector(selector);
            return element ? element.innerText.trim() : null;
        };

        const findSectionByHeaderText = (text) => {
            const sections = Array.from(document.querySelectorAll('section.artdeco-card, section.artdeco-card'));
            for (const section of sections) {
                const header = section.querySelector('h2.pvs-header__title span[aria-hidden="true"], h2.pvs-header__title, #experience ~ .pvs-header__container h2, #education ~ .pvs-header__container h2, #about ~ .pvs-header__container h2');
                if (header && header.innerText.toLowerCase().includes(text.toLowerCase())) {
                    return section;
                }
                const sectionIdElement = document.getElementById(text.toLowerCase());
                if (sectionIdElement) {
                    let parentSection = sectionIdElement.closest('section');
                    if (parentSection) return parentSection;
                }
            }
            const allH2s = Array.from(document.querySelectorAll('h2'));
            for (const h2 of allH2s) {
                if (h2.innerText.toLowerCase().includes(text.toLowerCase())) {
                    return h2.closest('section, div.artdeco-card, div.ember-view');
                }
            }
            return null;
        };

        profileInfo.name = getTextContent('h1.text-heading-xlarge') ||
                           getTextContent('.pv-text-details__left-panel h1 span[aria-hidden="true"]') ||
                           getTextContent('.pv-text-details__left-panel h1') ||
                           getTextContent('div[class^="artdeco-entity-lockup__title"] > span[aria-hidden="true"]');

        if (!profileInfo.name || profileInfo.name === 'N/A') {
             const h1s = document.querySelectorAll('h1');
             if (h1s.length > 0) {
                let foundName = false;
                for(let h1 of h1s) {
                    if (h1.id && (h1.id.includes('profile-name') || h1.id.includes('name')) || h1.className && typeof h1.className === 'string' && (h1.className.includes('profile-name') || h1.className.includes('name'))) {
                        profileInfo.name = h1.innerText.trim();
                        foundName = true;
                        break;
                    }
                }
                if (!foundName) profileInfo.name = h1s[0].innerText.trim();
             }
        }
        if (!profileInfo.name || profileInfo.name === 'N/A') {
            profileInfo.name = getTextContent('.profile-top-card-summary-info__name, .top-card-layout__title');
        }

        profileInfo.headline = getTextContent('.text-body-medium.break-words') ||
                               getTextContent('.pv-text-details__left-panel .text-body-medium') ||
                               getTextContent('.top-card-layout__headline') ||
                               getTextContent('.profile-top-card-summary-info__headline');

        const extractFromSectionList = (section, entityType) => {
            if (!section) return "N/A";
            const items = section.querySelectorAll('.pvs-list__paged-list-item, .artdeco-list__item, .pv-profile-section__list-item, .profile-section-card__list-item');
            if (items.length > 0) {
                const firstItem = items[0];
                let primaryTextElement;
                if (entityType === 'company') {
                    primaryTextElement = firstItem.querySelector('span[aria-hidden="true"] > span[aria-hidden="true"], .display-flex.flex-column.full-width span[aria-hidden="true"], .t-bold span[aria-hidden="true"], .pv-entity__secondary-title');
                    if (primaryTextElement) return primaryTextElement.innerText.split('·')[0].trim();
                    primaryTextElement = firstItem.querySelector('h3, .t-16.t-bold, .t-14.t-normal, .pv-entity__company-summary-info > h3');
                } else if (entityType === 'school') {
                    primaryTextElement = firstItem.querySelector('.t-bold span[aria-hidden="true"], .pv-entity__school-name, .display-flex.flex-column.full-width span[aria-hidden="true"]');
                     if (primaryTextElement) return primaryTextElement.innerText.trim();
                    primaryTextElement = firstItem.querySelector('h3, .t-16.t-bold, .t-14.t-normal');
                }
                return primaryTextElement ? primaryTextElement.innerText.trim() : "N/A";
            }
            if (entityType === 'company') {
                const companyLink = section.querySelector('a[data-control-name="background_details_company"] span[aria-hidden="true"], a[href*="/company/"] span[aria-hidden="true"]');
                if (companyLink) return companyLink.innerText.trim();
            } else if (entityType === 'school') {
                const schoolLink = section.querySelector('a[data-control-name="background_details_school"] span[aria-hidden="true"], a[href*="/school/"] span[aria-hidden="true"]');
                if (schoolLink) return schoolLink.innerText.trim();
            }
            return "N/A";
        };

        try {
            const experienceSection = findSectionByHeaderText('Experience');
            if (experienceSection) {
                 profileInfo.company = extractFromSectionList(experienceSection, 'company');
            }
            if (profileInfo.company === 'N/A') {
                profileInfo.company = getTextContent('[data-field="experience_company_name"] span:last-child') ||
                                      getTextContent('.experience li:first-child .pv-entity__secondary-title') ||
                                      getTextContent('.pvs-entity__secondary-title');
            }
        } catch (e) {
            console.warn("Could not parse company:", e);
        }

        try {
            const educationSection = findSectionByHeaderText('Education');
            if (educationSection) {
                profileInfo.school = extractFromSectionList(educationSection, 'school');
            }
            if (profileInfo.school === 'N/A') {
                 profileInfo.school = getTextContent('.education li:first-child .pv-entity__school-name') ||
                                     getTextContent('.pvs-entity__school-name');
            }
        } catch (e) {
            console.warn("Could not parse education/school:", e);
        }

        try {
            const aboutSection = findSectionByHeaderText('About') || document.querySelector('[id^="about"]');
            if (aboutSection) {
                let summaryElement = aboutSection.querySelector('.inline-show-more-text--is-collapsed span[aria-hidden="true"], .inline-show-more-text--is-expanded span[aria-hidden="true"], .pv-about__summary-text .lt-line-clamp__raw-line, .display-flex.full-width > span[aria-hidden="true"], section[id^="about"] .lt-line-clamp__line, .inline-show-more-text > span:not([class*="see-more"])');

                if (summaryElement && summaryElement.innerText.trim().length > 10) {
                    profileInfo.summaryText = summaryElement.innerText.trim();
                } else {
                    const fullSummaryContainer = aboutSection.querySelector('.inline-show-more-text, .pv-about__summary-text, div.display-flex.full-width');
                    if (fullSummaryContainer) {
                        const seeMoreButton = fullSummaryContainer.querySelector('button.inline-show-more-text__button, button.lt-line-clamp__more');
                        if (seeMoreButton && seeMoreButton.offsetParent !== null) {
                            seeMoreButton.click();
                            setTimeout(() => {
                                let updatedSummaryElement = aboutSection.querySelector('.inline-show-more-text--is-expanded span[aria-hidden="true"], .pv-about__summary-text .lt-line-clamp__raw-line, .display-flex.full-width > span[aria-hidden="true"], section[id^="about"] .lt-line-clamp__line, .inline-show-more-text > span:not([class*="see-more"])');
                                if (!updatedSummaryElement || updatedSummaryElement.innerText.trim().length < 10) {
                                     updatedSummaryElement = fullSummaryContainer;
                                }
                                profileInfo.summaryText = updatedSummaryElement ? updatedSummaryElement.innerText.trim() : "N/A";
                                sendResponse(profileInfo);
                            }, 150);
                            return true;
                        } else {
                            profileInfo.summaryText = fullSummaryContainer.innerText.trim();
                        }
                    }
                }
            }
            if (profileInfo.summaryText === 'N/A') {
                const genericAbout = document.querySelector('#about, .pv-about__summary-text, section[aria-label*="About"]');
                if(genericAbout) profileInfo.summaryText = genericAbout.innerText.trim().replace(/^About\s*/i, '').trim();
            }
        } catch (e) {
            console.warn("Could not parse summary:", e);
        }

        if (!profileInfo.summaryText || profileInfo.summaryText === "N/A" || !document.querySelector('.inline-show-more-text__button, .lt-line-clamp__more')) {
            sendResponse(profileInfo);
        }
    }
    return true;
});
