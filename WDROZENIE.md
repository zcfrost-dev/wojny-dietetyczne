# Wdrożenie testowe

## Rekomendacja

Najlepszy docelowy układ to:

GitHub jako repozytorium zmian + Netlify jako hosting.

Dlaczego:
- GitHub trzyma historię zmian i pozwala wrócić do starszej wersji.
- Netlify automatycznie publikuje stronę po zmianach.
- Domena może być podpięta do Netlify.
- Nie trzeba ręcznie przeciągać paczki ZIP po każdej poprawce.

## Najszybszy test

Na teraz najprościej użyć Netlify Drop:

1. Wejdź na https://app.netlify.com/drop
2. Wrzuć paczkę publiczną `wojny-dietetyczne-netlify-public-*.zip`
3. Netlify da tymczasowy link.
4. Po sprawdzeniu można podpiąć domenę.

## Którą paczkę wrzucać?

Do publicznego testu:

`wojny-dietetyczne-netlify-public-*.zip`

Ta paczka nie zawiera panelu redakcyjnego.

Do pracy lokalnej:

`wojny-dietetyczne-robocze-z-panelem-*.zip`

Ta paczka zawiera `admin.html` i `editor.js`, czyli panel do pisania szkiców.

## Kiedy GitHub?

GitHub warto włączyć, gdy:
- zaczniemy regularnie poprawiać treści,
- dodasz zdjęcia lokalne,
- chcesz mieć historię zmian,
- domena ma działać stabilnie,
- będziemy dodawać prawdziwy system komentarzy.

## Ważna uwaga

Obecne komentarze i sondy działają lokalnie w przeglądarce. Do prawdziwej publikacji z komentarzami widocznymi dla wszystkich potrzebny będzie backend albo zewnętrzna usługa komentarzy.
