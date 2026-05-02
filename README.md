# Wojny Dietetyczne

Statyczny prototyp portalu o sporach dietetycznych.

## Struktura

- `index.html` - strona główna
- `war.html` - podstrona pojedynczego sporu
- `data.js` - treści tematów, argumenty, źródła i ścieżki zdjęć
- `app.js` - logika strony, sondy i lokalne komentarze
- `styles.css` - wygląd
- `photos/` - zdjęcia kafelków
- `test-zdjec.html` - szybki test, czy hosting widzi zdjęcia
- `netlify.toml` i `_headers` - konfiguracja Netlify

## Publikacja przez GitHub + Netlify

1. Utwórz repozytorium na GitHubie, np. `wojny-dietetyczne`.
2. Wgraj zawartość tego folderu do repozytorium.
3. W Netlify wybierz `Add new site` -> `Import an existing project`.
4. Wskaż repozytorium GitHub.
5. Build command zostaw puste.
6. Publish directory ustaw na `.`.

Po wdrożeniu sprawdź:

`/test-zdjec.html`

Jeśli test pokazuje zdjęcia, strona główna też powinna je widzieć.

## Edycja treści

Na start najprościej edytować plik `data.js` przez GitHub albo lokalnie przez Codex.

Każdy temat ma pola:

- `title`
- `kicker`
- `summary`
- `hook`
- `sideA`, `authorityA`, `argumentsFor`
- `sideB`, `authorityB`, `argumentsAgainst`
- `contradiction`
- `conclusion`
- `question`
- `sources`
- `image`

Zdjęcia trzymaj w folderze `photos/` i wpisuj ścieżkę w `image`, np.

```js
image: "photos/mieso-rak-czy-mit.jpg"
```

## Uwaga o komentarzach

Komentarze i sondy są teraz lokalne w przeglądarce. To znaczy, że służą do prototypu. Do prawdziwej strony z komentarzami widocznymi dla wszystkich będzie potrzebny backend albo zewnętrzna usługa komentarzy.
