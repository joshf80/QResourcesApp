// Survey Navigation
document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        const sections = form.querySelectorAll('.survey-section');
        const progressBar = form.querySelector('.progress');
        const prevBtn = form.querySelector('#prev-btn');
        const nextBtn = form.querySelector('#next-btn');
        const submitBtn = form.querySelector('#submit-btn');
        let currentSection = 0;

        // Initialize range sliders
        const rangeSliders = form.querySelectorAll('.range-slider');
        rangeSliders.forEach(slider => {
            const valueDisplay = slider.nextElementSibling;
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        });

        // Initialize option cards
        const optionCards = form.querySelectorAll('.option-card');
        optionCards.forEach(card => {
            card.addEventListener('click', () => {
                const checkbox = card.querySelector('input[type="checkbox"]');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    card.classList.toggle('selected', checkbox.checked);
                }
            });
        });

        // Initialize drag and drop with touch support
        const dragContainer = form.querySelector('#drag-container');
        if (dragContainer) {
            const draggableItems = dragContainer.querySelectorAll('.draggable-item');
            let draggedItem = null;

            // Add touch-friendly controls
            draggableItems.forEach((item, index) => {
                // Add move up/down buttons
                const controls = document.createElement('div');
                controls.className = 'item-controls';
                controls.innerHTML = `
                    <button class="move-btn up" ${index === 0 ? 'disabled' : ''}>↑</button>
                    <button class="move-btn down" ${index === draggableItems.length - 1 ? 'disabled' : ''}>↓</button>
                `;
                item.appendChild(controls);

                // Handle move up/down
                controls.querySelector('.up').addEventListener('click', () => {
                    const items = Array.from(dragContainer.querySelectorAll('.draggable-item'));
                    const currentIndex = items.indexOf(item);
                    if (currentIndex > 0) {
                        dragContainer.insertBefore(item, items[currentIndex - 1]);
                        updateMoveButtons();
                    }
                });

                controls.querySelector('.down').addEventListener('click', () => {
                    const items = Array.from(dragContainer.querySelectorAll('.draggable-item'));
                    const currentIndex = items.indexOf(item);
                    if (currentIndex < items.length - 1) {
                        dragContainer.insertBefore(item, items[currentIndex + 2]);
                        updateMoveButtons();
                    }
                });

                // Keep drag functionality for desktop
                item.addEventListener('dragstart', () => {
                    draggedItem = item;
                    item.classList.add('dragging');
                });

                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                    draggedItem = null;
                    updateMoveButtons();
                });
            });

            // Update move buttons state
            function updateMoveButtons() {
                const items = Array.from(dragContainer.querySelectorAll('.draggable-item'));
                items.forEach((item, index) => {
                    const controls = item.querySelector('.item-controls');
                    controls.querySelector('.up').disabled = index === 0;
                    controls.querySelector('.down').disabled = index === items.length - 1;
                });
            }

            // Keep drag and drop for desktop
            dragContainer.addEventListener('dragover', e => {
                e.preventDefault();
                if (!draggedItem) return;
                
                const items = Array.from(dragContainer.querySelectorAll('.draggable-item:not(.dragging)'));
                const nextSibling = items.find(sibling => {
                    const rect = sibling.getBoundingClientRect();
                    return e.clientY <= rect.top + rect.height / 2;
                });
                
                if (nextSibling) {
                    dragContainer.insertBefore(draggedItem, nextSibling);
                    updateMoveButtons();
                }
            });
        }

        // Update progress bar
        function updateProgress() {
            const progress = ((currentSection + 1) / sections.length) * 100;
            progressBar.style.width = `${progress}%`;
        }

        // Show/hide navigation buttons
        function updateNavigation() {
            prevBtn.disabled = currentSection === 0;
            nextBtn.style.display = currentSection === sections.length - 1 ? 'none' : 'block';
            submitBtn.style.display = currentSection === sections.length - 1 ? 'block' : 'none';
        }

        // Navigate between sections
        function navigate(direction) {
            sections[currentSection].classList.remove('active');
            currentSection += direction;
            sections[currentSection].classList.add('active');
            updateProgress();
            updateNavigation();
        }

        // Event listeners for navigation
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect form data
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                // Skip empty values
                if (!value && value !== '0') return;
                
                if (key === 'resources' || key === 'features' || key === 'preferences') {
                    if (!data[key]) data[key] = [];
                    data[key].push(value);
                } else {
                    // Convert range slider values to numbers
                    if (form.querySelector(`input[name="${key}"]`)?.type === 'range') {
                        data[key] = parseInt(value);
                    } else {
                        data[key] = value;
                    }
                }
            });

            // Add timestamp and survey type
            data.timestamp = new Date().toISOString();
            data.surveyType = form.id;

            // Get rankings if they exist
            if (dragContainer) {
                const rankings = Array.from(dragContainer.querySelectorAll('.draggable-item'))
                    .map(item => item.dataset.value)
                    .filter(value => value && value.trim() !== '');
                if (rankings.length > 0) {
                    data.rankings = rankings;
                }
            }

            // Log the data being sent for debugging
            console.log('Form data being sent:', data);

            try {
                // Submit to Formspree
                const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Show success message
                    alert('Gracias!');
                    form.reset();
                    // Reset to first section
                    while (currentSection > 0) {
                        navigate(-1);
                    }
                } else {
                    throw new Error('Error');
                }
            } catch (error) {
                console.error('Error submitting survey response:', error);
                alert('There was an error submitting your response. Please try again later.');
            }
        });

        // Initialize progress and navigation
        updateProgress();
        updateNavigation();
    });
});
  
