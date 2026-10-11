
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');
const saveButton = document.querySelector('#save-button');
const cancelButton = document.querySelector('#cancel-button');
const message = document.querySelector('#message');

const STORAGE_KEY = 'workshop-projects-v1';

// Projects are restored from localStorage when possible.
let projects = [];
let editingId = null;
let storageReady = false;

// Display a message without inserting HTML.
function showMessage(text) {
  if (message) {
    message.textContent = text;
  }
}

// Validate the stored data before using it.
function isValidProjectArray(data) {
  return (
    Array.isArray(data) &&
    data.every(project =>
      project !== null &&
      typeof project === 'object' &&
      !Array.isArray(project) &&
      typeof project.id === 'string' &&
      project.id.length > 0 &&
      typeof project.name === 'string' &&
      typeof project.status === 'string' &&
      ['Planned', 'In Progress', 'Completed'].includes(project.status)
    ) &&
    new Set(data.map(project => project.id)).size === data.length
  );
}

// Save the current collection.
// Update localStorage only after a successful write.
function persistProjects() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    showMessage('Changes saved.');
    return true;
  } catch (error) {
    showMessage(
      'Changes could not be saved to browser storage. Your changes may be lost if you refresh.'
    );
    return false;
  }
}

// Return the form to Add mode.
function resetForm() {
  form.reset();
  editingId = null;
  nameInput.setCustomValidity('');
  saveButton.textContent = 'Save Project';
  cancelButton.hidden = true;
}

// Render every project.
function renderProjects() {
  projectList.replaceChildren();

  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }

  projects.forEach(project => {
    const listItem = document.createElement('li');

    const projectText = document.createElement('span');
    projectText.textContent = `${project.name} — ${project.status} `;

    // Edit button
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.textContent = 'Edit';

    editButton.addEventListener('click', () => {
      editingId = project.id;
      nameInput.value = project.name;
      statusInput.value = project.status;

      nameInput.setCustomValidity('');
      saveButton.textContent = 'Save changes';
      cancelButton.hidden = false;

      showMessage('');
      nameInput.focus();
    });

    // Delete button
    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';

    deleteButton.addEventListener('click', () => {
      const confirmed = window.confirm(
        `Delete project "${project.name}"?`
      );

      if (!confirmed) {
        return;
      }

      const projectIndex = projects.findIndex(
        item => item.id === project.id
      );

      if (projectIndex === -1) {
        return;
      }

      // Keep a copy so a failed storage write can be rolled back.
      const previousProjects = [...projects];
      projects.splice(projectIndex, 1);

      if (!persistProjects()) {
        projects.splice(0, projects.length, ...previousProjects);
        renderProjects();
        return;
      }

      if (editingId === project.id) {
        resetForm();
      }

      renderProjects();
    });

    listItem.appendChild(projectText);
    listItem.appendChild(editButton);
    listItem.appendChild(deleteButton);

    projectList.appendChild(listItem);
  });
}

// Restore projects when the page starts.
function loadProjects() {
  let storedText;

  try {
    storedText = localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    showMessage(
      'Saved projects could not be read. Browser storage may be unavailable.'
    );
    return;
  }

  // A missing key means this is a new collection.
  if (storedText === null) {
    projects = [];
    storageReady = true;
    renderProjects();
    return;
  }

  let storedProjects;

  try {
    storedProjects = JSON.parse(storedText);
  } catch (error) {
    showMessage(
      'Saved project data is invalid JSON. Your stored data was not overwritten.'
    );
    return;
  }

  if (!isValidProjectArray(storedProjects)) {
    showMessage(
      'Saved project data has an invalid format. Your stored data was not overwritten.'
    );
    return;
  }

  projects = storedProjects;
  storageReady = true;
  renderProjects();
}

// Handle both Add and Edit with one submit listener.
form.addEventListener('submit', event => {
  event.preventDefault();

  if (!storageReady) {
    showMessage(
      'Projects cannot be changed until saved data can be read safely.'
    );
    return;
  }

  const name = nameInput.value.trim();
  const status = statusInput.value;

  if (name === '') {
    nameInput.setCustomValidity('Please enter a project name.');
    nameInput.reportValidity();
    return;
  }

  nameInput.setCustomValidity('');

  if (!['Planned', 'In Progress', 'Completed'].includes(status)) {
    showMessage('Please select a valid project status.');
    return;
  }

  // Keep the previous collection in case saving fails.
  const previousProjects = projects.map(project => ({ ...project }));

  if (editingId === null) {
    projects.push({
      id: crypto.randomUUID(),
      name,
      status
    });
  } else {
    const project = projects.find(item => item.id === editingId);

    if (!project) {
      resetForm();
      renderProjects();
      showMessage('The project being edited could not be found.');
      return;
    }

    project.name = name;
    project.status = status;
  }

  if (!persistProjects()) {
    projects = previousProjects;
    renderProjects();
    return;
  }

  renderProjects();
  resetForm();
});

// Cancel edit does not write to storage.
cancelButton.addEventListener('click', () => {
  resetForm();
  showMessage('');
});

// Clear custom validation errors while typing.
nameInput.addEventListener('input', () => {
  nameInput.setCustomValidity('');
});

// Restore and display saved projects.
loadProjects();
