# GitHub + Netlify krok po kroku

## Opcja bez instalowania Git

1. Wejdź na GitHub.
2. Kliknij `New repository`.
3. Nazwij repozytorium, np. `wojny-dietetyczne`.
4. Wybierz `Private`, jeśli nie chcesz jeszcze pokazywać kodu publicznie.
5. Po utworzeniu repozytorium kliknij `uploading an existing file`.
6. Przeciągnij wszystkie pliki i foldery z katalogu `wojny-dietetyczne-github`.
7. Kliknij `Commit changes`.

## Podpięcie Netlify

1. Wejdź do Netlify.
2. `Add new site` -> `Import an existing project`.
3. Wybierz GitHub.
4. Wskaż repozytorium `wojny-dietetyczne`.
5. Build command: zostaw puste.
6. Publish directory: wpisz `.`
7. Kliknij `Deploy`.

## Aktualizacja treści

Po każdej zmianie w GitHubie Netlify sam opublikuje nową wersję.

Jeśli edytujesz teksty przez GitHub:

1. Otwórz `data.js`.
2. Kliknij ikonę edycji.
3. Popraw treść.
4. Kliknij `Commit changes`.
5. Poczekaj, aż Netlify wdroży zmianę.

## Kiedy warto zainstalować GitHub Desktop

Jeśli zmian będzie dużo, GitHub Desktop będzie wygodniejszy niż ręczne wgrywanie plików przez przeglądarkę.
