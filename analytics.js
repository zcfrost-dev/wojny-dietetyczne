const GA_MEASUREMENT_ID = "G-RRWH7YG41V";
const GOOGLE_ADS_ID = "AW-973113840";
const CONSENT_STORAGE_KEY = "wd-cookie-consent";

window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}

gtag("consent", "default", {
  ad_storage: "denied",
  analytics_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  functionality_storage: "granted",
  security_storage: "granted"
});

function updateConsent(granted) {
  gtag("consent", "update", {
    ad_storage: granted ? "granted" : "denied",
    analytics_storage: granted ? "granted" : "denied",
    ad_user_data: granted ? "granted" : "denied",
    ad_personalization: granted ? "granted" : "denied"
  });
}

function loadGoogleTags() {
  if (!GA_MEASUREMENT_ID || GA_MEASUREMENT_ID === "G-XXXXXXXXXX") return;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_ID !== "AW-XXXXXXXXXX") {
    gtag("config", GOOGLE_ADS_ID);
  }
}

function hideConsentBanner() {
  const banner = document.querySelector("[data-cookie-consent]");
  if (banner) banner.remove();
}

function showConsentBanner() {
  if (localStorage.getItem(CONSENT_STORAGE_KEY)) return;

  const banner = document.createElement("section");
  banner.className = "cookie-consent";
  banner.setAttribute("data-cookie-consent", "true");
  banner.innerHTML = `
    <div>
      <strong>Pliki cookies i pomiar reklam</strong>
      <p>Używamy Google Analytics i Google Ads do mierzenia oglądalności oraz skuteczności reklam. Możesz zaakceptować albo odrzucić pomiar marketingowy.</p>
      <a href="polityka-prywatnosci.html">Polityka prywatności</a>
    </div>
    <div class="cookie-actions">
      <button type="button" class="ghost-button" data-consent-deny>Odrzuć</button>
      <button type="button" class="primary-button" data-consent-accept>Akceptuję</button>
    </div>
  `;
  document.body.appendChild(banner);

  banner.querySelector("[data-consent-accept]").addEventListener("click", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "granted");
    updateConsent(true);
    hideConsentBanner();
  });

  banner.querySelector("[data-consent-deny]").addEventListener("click", () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, "denied");
    updateConsent(false);
    hideConsentBanner();
  });
}

const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
if (storedConsent === "granted") {
  updateConsent(true);
}

loadGoogleTags();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", showConsentBanner);
} else {
  showConsentBanner();
}
