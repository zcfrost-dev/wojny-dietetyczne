const GA_MEASUREMENT_ID = "G-RRWH7YG41V";
const GOOGLE_ADS_ID = "AW-973113840";

if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag("js", new Date());
  gtag("config", GA_MEASUREMENT_ID, {
    anonymize_ip: true
  });

  if (GOOGLE_ADS_ID && GOOGLE_ADS_ID !== "AW-XXXXXXXXXX") {
    gtag("config", GOOGLE_ADS_ID);
  }
}
