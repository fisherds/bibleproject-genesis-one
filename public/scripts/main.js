
document.addEventListener('DOMContentLoaded', () => {
    const pageContainer = document.getElementById('page-container');
    const drawer = document.getElementById('drawer');
    const mainContent = document.getElementById('main-content');

    let hebrewDictionary = {};
    let genesisOneWords = {};
    let isDrawerOpen = false;

    // Fetch both data files
    Promise.all([
        fetch('./genesis_one.json').then(res => res.json()),
        fetch('./hebrew.json').then(res => res.json())
    ]).then(([genesisData, hebrewData]) => {
        // Create lookup maps for faster access
        genesisOneWords = genesisData.reduce((acc, word) => {
            acc[word.id] = word;
            return acc;
        }, {});
        hebrewDictionary = hebrewData.reduce((acc, word) => {
            acc[word.strongs] = word;
            return acc;
        }, {});
    }).catch(error => {
        console.error('Error fetching data:', error);
        drawer.innerHTML = '<p>Could not load necessary data.</p>';
    });

    // Function to open and populate the drawer
    const updateDrawer = (wordId, strongsClass) => {
        if (!hebrewDictionary || !genesisOneWords) return;

        const strongsNumber = strongsClass.startsWith('h') ? strongsClass : `h${strongsClass}`;
        console.log("Finding data for:", strongsNumber, "with wordId:", wordId);
        const hebrewDictionaryWordData = hebrewDictionary[strongsNumber];
        const concordanceWordData = genesisOneWords[wordId];
        let contentHTML = '<button id="close-drawer" class="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-3xl font-bold">&times;</button>';

        if (concordanceWordData && hebrewDictionaryWordData) {
            let occurrencesHTML = `
                        <div class="font-bold text-sm text-center text-gray-500">#</div>
                        <div class="font-bold text-sm text-center text-gray-500">Ref</div>
                        <div class="font-bold text-sm text-center text-gray-500">Day</div>
                        <div class="font-bold text-sm text-gray-500">Line</div>
                    `;
            let occurrenceIndex = 1;
            document.querySelectorAll('.english-line').forEach(line => {
                if (line.querySelector(`.${strongsClass}`)) {
                    const card = line.closest('.card');
                    const dayId = card ? card.id : 'N/A';
                    const dayNumber = dayId.replace('day', '');
                    let chapter = "";
                    let verse = "";

                    const tempLine = document.createElement('div');
                    tempLine.innerHTML = line.innerHTML;
                    tempLine.querySelectorAll('.' + strongsClass).forEach(el => {
                        el.classList.add('drawer-highlight');
                        console.log(el.dataset.id);
                        const wordData = genesisOneWords[el.dataset.id];
                        if (wordData) {
                            chapter = wordData.chapter || chapter;
                            verse = wordData.verse || verse;
                        }
                    });
                    const highlightedLineHTML = tempLine.innerHTML;
                    
                    occurrencesHTML += `
                                <div class="text-sm text-center text-sky-600">${occurrenceIndex++}</div>
                                <div class="text-sm text-center text-gray-500">${chapter}:${verse}</div>
                                <div class="text-sm text-center text-gray-500">${dayNumber}</div>
                                <div>${highlightedLineHTML}</div>
                            `;
                }
            });

            contentHTML += `
                        <h3 class="text-3xl hebrew-line mb-2 text-center">${concordanceWordData.hebrew_word || ''}</h3> 
                        <h3 class="text-lg font-semibold text-sky-700 mb-1 text-center">${concordanceWordData.gloss_transliteration || ''}</h3>   
                        <h4 class="font-bold border-b pb-1 mb-2 mt-2">Occurrences in this text:</h4>
                        <div class="occurrences-grid mt-2">${occurrencesHTML}</div>
                        <hr class="my-4">
                        <h3 class="text-3xl hebrew-line mb-2 text-center">${concordanceWordData.lexeme}</h3>
                        <h3 class="text-lg font-semibold text-sky-700 mb-1 text-center">${concordanceWordData.transliteration || ''}</h3>   
                        <p class="text-xs text-gray-500 mb-4 text-center">(Strongs: ${concordanceWordData.strongs_number}) </p>                     
                        <p class="text-sky-700 mb-1">${hebrewDictionaryWordData.word || 'N/A'}</p>
                        <div class="italic ml-4 mb-4">${concordanceWordData.definition || 'No definition available.'}</div>
                    `;
        } else {
            contentHTML += `<p>No data found for ${strongsClass}.</p>`;
        }

        drawer.innerHTML = contentHTML;

        if (!isDrawerOpen) {
            pageContainer.classList.add('drawer-open');
            isDrawerOpen = true;
        }

        // Add event listener to the new close button
        document.getElementById('close-drawer').addEventListener('click', closeDrawer);
    };

    const closeDrawer = () => {
        pageContainer.classList.remove('drawer-open');
        isDrawerOpen = false;
    };

    const handleWordInteraction = (event) => {
        const target = event.target.closest('span[class*="h"]');
        if (!target) return;

        const classList = target.className.split(' ');
        const strongsClass = classList.find(c => c.startsWith('h'));
        const wordId = target.dataset.id;

        if (!strongsClass || strongsClass === 'h0') return;

        if (event.type === 'click') {
            updateDrawer(wordId, strongsClass);
        } else if (event.type === 'mouseover') {
            document.querySelectorAll('.' + strongsClass).forEach(el => el.classList.add('highlight'));
        } else if (event.type === 'mouseout') {
            document.querySelectorAll('.' + strongsClass).forEach(el => el.classList.remove('highlight'));
        }
    };


    mainContent.addEventListener('click', (event) => {
        // Close drawer if clicking on the background, not on a card or its children
        if (isDrawerOpen && !event.target.closest('.card')) {
            closeDrawer();
        }

        // Handle word interaction if a word was clicked
        handleWordInteraction(event);
    });
    document.getElementById('main-content').addEventListener('mouseover', handleWordInteraction);
    document.getElementById('main-content').addEventListener('mouseout', handleWordInteraction);
});