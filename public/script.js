
const form = document.querySelector('#project-form');
const nameInput = document.querySelector('#name');
const statusInput = document.querySelector('#status');
const projectList = document.querySelector('#project-list');
const emptyState = document.querySelector('#empty-state');

// Store all projects in memory
const projects = [];

// Display every project in the list
function renderProjects() {
  // Remove previously displayed items
  projectList.replaceChildren();

  // Show empty-state message only when no projects exist
  if (emptyState) {
    emptyState.hidden = projects.length > 0;
  }

  // Create one list item for each project
  projects.forEach(project => {
    const listItem = document.createElement('li');

    // textContent safely displays user-entered text
    listItem.textContent = `${project.name} — ${project.status}`;

    projectList.appendChild(listItem);
  });
}

// Handle form submission (one listener only)
form.addEventListener('submit', event => {
  // Stop the browser from reloading the page
  event.preventDefault();

  // Read current values from the form
  const name = nameInput.value.trim();
  const status = statusInput.value;

  // Reject an empty project name
  if (name === '') {
    nameInput.setCustomValidity('Please enter a project name.');
    nameInput.reportValidity();
    return;
  }

  nameInput.setCustomValidity('');

  // Create a new project with a unique ID
  const newProject = {
    id: crypto.randomUUID(),
    name: name,
    status: status
  };

  // Add the project to the array
  projects.push(newProject);

  // Update the visible project list
  renderProjects();

  // Clear the form for the next project
  form.reset();
});

// Clear any custom validation error when typing
nameInput.addEventListener('input', () => {
  nameInput.setCustomValidity('');
});

// Display the initial empty list
renderProjects();
