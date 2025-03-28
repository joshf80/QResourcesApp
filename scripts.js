document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[id$="-form"]');
    if (!form) return;

    // Elements
    const sections = form.querySelectorAll('.survey-section');
    const progressBar = form.querySelector('.progress');
    const prevBtn = form.querySelector('#prev-btn');
    const nextBtn = form.querySelector('#next-btn');
    const submitBtn = form.querySelector('#submit-btn');
    let currentSection = 0;

    // Initialize
    initRangeSliders();
    initOptionCards();
    initDragRanking();
    updateProgress();
    updateNavigation();

    // ===== CORE FUNCTIONS =====

    function navigate(direction) {
        if (validateCurrentSection()) {
            sections[currentSection].classList.remove('active');
            currentSection += direction;
            sections[currentSection].classList.add('active');
            updateProgress();
            updateNavigation();
            sections[currentSection].querySelector('input, textarea, select')?.focus();
        }
    }

    function validateCurrentSection() {
        const currentSectionEl = sections[currentSection];
        const requiredInputs = currentSectionEl.querySelectorAll('[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                if (!input.nextElementSibling?.classList.contains('error-message')) {
                    const errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.textContent = 'This field is required';
                    input.insertAdjacentElement('afterend', errorMsg);
                }
            }
        });

        return isValid;
    }

    function updateProgress() {
        const progress = ((currentSection + 1) / sections.length) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function updateNavigation() {
        prevBtn.disabled = currentSection === 0;
        nextBtn.style.display = currentSection === sections.length - 1 ? 'none' : 'block';
        submitBtn.style.display = currentSection === sections.length - 1 ? 'block' : 'none';
    }

    // ===== COMPONENT INITIALIZERS =====

    function initRangeSliders() {
        form.querySelectorAll('.range-slider').forEach(slider => {
            const valueDisplay = slider.nextElementSibling;
            valueDisplay.textContent = slider.value;
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        });
    }

    function initOptionCards() {
        form.querySelectorAll('.option-card').forEach(card => {
            const checkbox = card.querySelector('input[type="checkbox"]');
            if (checkbox) {
                card.classList.toggle('selected', checkbox.checked);
                
                card.addEventListener('click', (e) => {
                    // Ignore clicks on move buttons or their children
                    if (!e.target.closest('.move-btn')) {
                        checkbox.checked = !checkbox.checked;
                        card.classList.toggle('selected', checkbox.checked);
                    }
                });
            }
        });
    }

    function initDragRanking() {
        const dragContainer = form.querySelector('#drag-container');
        if (!dragContainer) return;

        const draggableItems = dragContainer.querySelectorAll('.draggable-item');
        let draggedItem = null;

        draggableItems.forEach((item, index) => {
            // Add move controls
            const controls = document.createElement('div');
            controls.className = 'item-controls';
            controls.innerHTML = `
                <button class="move-btn up" ${index === 0 ? 'disabled' : ''}>↑</button>
                <button class="move-btn down" ${index === draggableItems.length - 1 ? 'disabled' : ''}>↓</button>
            `;
            item.appendChild(controls);

            // Move handlers
            controls.querySelector('.up').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                moveItem(item, 'up');
            });

            controls.querySelector('.down').addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event bubbling
                moveItem(item, 'down');
            });

            // Drag events
            item.setAttribute('draggable', 'true');
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

        dragContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedItem) return;
            
            const afterElement = getDragAfterElement(dragContainer, e.clientY);
            if (afterElement) {
                dragContainer.insertBefore(draggedItem, afterElement);
            } else {
                dragContainer.appendChild(draggedItem);
            }
        });

        function moveItem(item, direction) {
            const items = Array.from(dragContainer.querySelectorAll('.draggable-item'));
            const currentIndex = items.indexOf(item);
            const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

            if (newIndex >= 0 && newIndex < items.length) {
                dragContainer.insertBefore(item, items[newIndex + (direction === 'up' ? 0 : 1)]);
                updateMoveButtons();
            }
        }

        function updateMoveButtons() {
            const items = Array.from(dragContainer.querySelectorAll('.draggable-item'));
            items.forEach((item, index) => {
                const upBtn = item.querySelector('.move-btn.up');
                const downBtn = item.querySelector('.move-btn.down');
                
                if (upBtn) upBtn.disabled = index === 0;
                if (downBtn) downBtn.disabled = index === items.length - 1;
            });
        }

        function getDragAfterElement(container, y) {
            const draggableElements = [...container.querySelectorAll('.draggable-item:not(.dragging)')];
            
            return draggableElements.reduce((closest, child) => {
                const box = child.getBoundingClientRect();
                const offset = y - box.top - box.height / 2;
                
                if (offset < 0 && offset > closest.offset) {
                    return { offset: offset, element: child };
                } else {
                    return closest;
                }
            }, { offset: Number.NEGATIVE_INFINITY }).element;
        }
    }

    // ===== EVENT LISTENERS =====

    prevBtn.addEventListener('click', (e) => {
        if (!e.target.classList.contains('move-btn')) {
            navigate(-1);
        }
    });

    nextBtn.addEventListener('click', (e) => {
        if (!e.target.classList.contains('move-btn')) {
            navigate(1);
        }
    });

    submitBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!validateCurrentSection()) return;
        
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';
        
        try {
            const formData = new FormData(form);
            const data = {};
            
            formData.forEach((value, key) => {
                if (!value && value !== '0') return;
                
                if (key === 'resources' || key === 'preferences') {
                    if (!data[key]) data[key] = [];
                    data[key].push(value);
                } else {
                    data[key] = form.querySelector(`input[name="${key}"]`)?.type === 'range' 
                        ? parseInt(value) 
                        : value;
                }
            });

            // Add rankings if available
            const dragContainer = form.querySelector('#drag-container');
            if (dragContainer) {
                data.rankings = Array.from(dragContainer.querySelectorAll('.draggable-item'))
                    .map(item => item.dataset.value)
                    .filter(Boolean);
            }

            // Submit data
            const response = await fetch('', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                alert('Thank you for your feedback!');
                form.reset();
                // Reset to first section
                while (currentSection > 0) navigate(-1);
            } else {
                throw new Error('Submission failed');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('There was an error submitting your form. Please try again.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
});