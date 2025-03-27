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

        // Initialize drag and drop
        const dragContainer = form.querySelector('#drag-container');
        if (dragContainer) {
            const draggableItems = dragContainer.querySelectorAll('.draggable-item');
            draggableItems.forEach(item => {
                item.addEventListener('dragstart', () => {
                    item.classList.add('dragging');
                });
                item.addEventListener('dragend', () => {
                    item.classList.remove('dragging');
                });
            });

            dragContainer.addEventListener('dragover', e => {
                e.preventDefault();
                const draggingItem = document.querySelector('.dragging');
                const siblings = [...dragContainer.querySelectorAll('.draggable-item:not(.dragging)')];
                const nextSibling = siblings.find(sibling => {
                    const rect = sibling.getBoundingClientRect();
                    return e.clientY <= rect.top + rect.height / 2;
                });
                dragContainer.insertBefore(draggingItem, nextSibling);
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
                if (key === 'resources' || key === 'features' || key === 'preferences') {
                    if (!data[key]) data[key] = [];
                    data[key].push(value);
                } else {
                    data[key] = value;
                }
            });

            // Add timestamp and survey type
            data.timestamp = new Date().toISOString();
            data.surveyType = form.id;

            // Get drag and drop rankings if they exist
            if (dragContainer) {
                data.rankings = Array.from(dragContainer.querySelectorAll('.draggable-item'))
                    .map(item => item.dataset.value);
            }

            try {
                // Submit to Formspree
                const response = await fetch('https://formspree.io/f/manebrab', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Show success message
                    alert('Thank you for your feedback!');
                    form.reset();
                    // Reset to first section
                    while (currentSection > 0) {
                        navigate(-1);
                    }
                } else {
                    throw new Error('Failed to submit response');
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
  