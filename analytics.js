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

function unlockPage() {
  document.documentElement.classList.remove("consent-locked");
  const modal = document.querySelector("[data-cookie-consent]");
  if (modal) modal.remove();
}

function saveConsent(value) {
  localStorage.setItem(CONSENT_STORAGE_KEY, value);
  updateConsent(value === "granted");
  unlockPage();
}

function showConsentModal() {
  if (localStorage.getItem(CONSENT_STORAGE_KEY)) return;

  document.documentElement.classList.add("consent-locked");

  const modal = document.createElement("section");
  modal.className = "cookie-consent-modal";
  modal.setAttribute("data-cookie-consent", "true");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "cookieConsentTitle");
  modal.innerHTML = `
    <div class="cookie-consent-card">
      <p class="eyebrow">Zgody i prywatność</p>
      <h2 id="cookieConsentTitle">Zanim wejdziesz na stronę</h2>
      <p>Potwierdź, że zapoznałeś się z dokumentami serwisu. Strona używa plików cookies, pamięci przeglądarki oraz narzędzi Google Analytics i Google Ads do pomiaru oglądalności i skuteczności reklam.</p>
      <p class="cookie-links">
        <a href="polityka-prywatnosci.html">Polityka prywatności</a>
        <a href="regulamin.html">Regulamin</a>
        <a href="zastrzezenie.html">Zastrzeżenie medyczne</a>
      </p>
      <div class="cookie-actions">
        <button type="button" class="ghost-button" data-consent-deny>Tylko niezbędne</button>
        <button type="button" class="primary-button" data-consent-accept>Akceptuję i przechodzę dalej</button>
      </div>
      <small>Opcja „Tylko niezbędne” pozwala korzystać ze strony bez zgody na pomiar reklamowy i analityczny.</small>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector("[data-consent-accept]").addEventListener("click", () => saveConsent("granted"));
  modal.querySelector("[data-consent-deny]").addEventListener("click", () => saveConsent("denied"));
}

const storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
if (storedConsent === "granted") {
  updateConsent(true);
}

loadGoogleTags();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", showConsentModal);
} else {
  showConsentModal();
}
