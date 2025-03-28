document.addEventListener('DOMContentLoaded', function() {
    // Initialize current survey form
    const form = document.querySelector('form');
    if (!form) return;
  
    // Survey navigation elements
    const sections = Array.from(document.querySelectorAll('.survey-section'));
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const submitBtn = document.getElementById('submit-btn');
    const progressBar = document.querySelector('.progress');
    let currentSection = 0;
  
    // Initialize all survey components
    initSliders();
    initCheckboxes();
    initRanking();
  
    // ======================
    // CORE NAVIGATION SYSTEM
    // ======================
    function showSection(index) {
      sections.forEach((section, i) => {
        section.classList.toggle('active', i === index);
      });
      updateProgress();
      updateButtons();
    }
  
    function updateProgress() {
      const progress = ((currentSection + 1) / sections.length) * 100;
      progressBar.style.width = `${progress}%`;
    }
  
    function updateButtons() {
      prevBtn.disabled = currentSection === 0;
      nextBtn.style.display = currentSection === sections.length - 1 ? 'none' : 'block';
      submitBtn.style.display = currentSection === sections.length - 1 ? 'block' : 'none';
    }
  
    // ======================
    // SURVEY COMPONENTS
    // ======================
    function initSliders() {
      document.querySelectorAll('.slider').forEach(slider => {
        const output = slider.nextElementSibling;
        output.textContent = slider.value;
        
        slider.addEventListener('input', () => {
          output.textContent = slider.value;
        });
      });
    }
  
    function initCheckboxes() {
      document.querySelectorAll('.checkbox-option').forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        
        // Set initial state
        if (checkbox.checked) {
          option.style.backgroundColor = '#e3f2fd';
          option.style.borderColor = '#90caf9';
        }
  
        checkbox.addEventListener('change', () => {
          option.style.backgroundColor = checkbox.checked ? '#e3f2fd' : '#f8f9fa';
          option.style.borderColor = checkbox.checked ? '#90caf9' : '#e0e0e0';
        });
      });
    }
  
    function initRanking() {
      const container = document.getElementById('drag-container');
      if (!container) return;
  
      let draggedItem = null;
  
      container.querySelectorAll('.rank-item').forEach(item => {
        item.addEventListener('dragstart', () => {
          draggedItem = item;
          setTimeout(() => item.classList.add('dragging'), 0);
        });
  
        item.addEventListener('dragend', () => {
          item.classList.remove('dragging');
        });
      });
  
      container.addEventListener('dragover', e => {
        e.preventDefault();
        if (!draggedItem) return;
        
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement) {
          container.insertBefore(draggedItem, afterElement);
        } else {
          container.appendChild(draggedItem);
        }
      });
  
      // Helper function for drag-and-drop
      function getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.rank-item:not(.dragging)')];
        
        return elements.reduce((closest, child) => {
          const box = child.getBoundingClientRect();
          const offset = y - box.top - box.height / 2;
          return offset < 0 && offset > closest.offset ? { offset, element: child } : closest;
        }, { offset: Number.NEGATIVE_INFINITY }).element;
      }
    }
  
    // ======================
    // EVENT HANDLERS
    // ======================
    prevBtn.addEventListener('click', (e) => {
      // Prevent navigation if clicking came from a ranking button
      if (!e.target.classList.contains('move-btn')) {
        if (currentSection > 0) {
          currentSection--;
          showSection(currentSection);
        }
      }
    });
  
    nextBtn.addEventListener('click', (e) => {
      // Prevent navigation if clicking came from a ranking button
      if (!e.target.classList.contains('move-btn')) {
        if (currentSection < sections.length - 1) {
          currentSection++;
          showSection(currentSection);
        }
      }
    });
  
    submitBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
      
      try {
        // Collect form data
        const formData = new FormData(form);
        const data = {};
        
        // Process form data
        formData.forEach((value, key) => {
          if (!data[key]) data[key] = [];
          data[key].push(value);
        });
  
        // Add rankings if available
        const rankingContainer = document.getElementById('drag-container');
        if (rankingContainer) {
          data.rankings = Array.from(rankingContainer.querySelectorAll('.rank-item'))
            .map(item => item.textContent.trim());
        }
  
        // Submit data (using Formspree as in your original code)
        const response = await fetch('https://formspree.io/f/manebrab', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
  
        if (response.ok) {
          alert('¡Gracias por su participación!');
          form.reset();
          // Reset to first section
          currentSection = 0;
          showSection(currentSection);
        } else {
          throw new Error('Error en el envío');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al enviar. Por favor intente nuevamente.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar';
      }
    });
  
    // Initialize first section
    showSection(0);
  });