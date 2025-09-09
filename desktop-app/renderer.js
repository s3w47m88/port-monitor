const API_URL = 'http://localhost:2920';

let ports = [];
let portNames = {};
let searchTerm = '';
let showNamedOnly = false;
let sortField = 'port';
let sortOrder = 'asc';
let isLoading = false;

// Elements
const portsList = document.getElementById('ports-list');
const portCount = document.getElementById('port-count');
const lastUpdate = document.getElementById('last-update');
const searchInput = document.getElementById('search');
const filterNamedBtn = document.getElementById('filter-named');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');

// Fetch ports from API
async function fetchPorts() {
  if (isLoading) return;
  isLoading = true;
  refreshIcon.classList.add('animate-spin');
  
  try {
    const response = await fetch(`${API_URL}/api/ports`);
    const data = await response.json();
    ports = data.ports || [];
    portCount.textContent = ports.length;
    lastUpdate.textContent = new Date().toLocaleTimeString();
    renderPorts();
  } catch (error) {
    console.error('Error fetching ports:', error);
    portsList.innerHTML = '<div class="p-8 text-center text-muted-foreground">Error loading ports. Make sure the app is running.</div>';
  } finally {
    isLoading = false;
    refreshIcon.classList.remove('animate-spin');
  }
}

// Fetch port names
async function fetchPortNames() {
  try {
    const response = await fetch(`${API_URL}/api/port-names`);
    portNames = await response.json();
  } catch (error) {
    console.error('Error fetching port names:', error);
  }
}

// Save port name
async function savePortName(port, name) {
  try {
    await fetch(`${API_URL}/api/port-names`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port, name })
    });
    
    if (name.trim()) {
      portNames[port] = name;
    } else {
      delete portNames[port];
    }
    renderPorts();
  } catch (error) {
    console.error('Error saving port name:', error);
  }
}

// Filter and sort ports
function getFilteredAndSortedPorts() {
  let filtered = ports.filter(port => {
    const matchesSearch = 
      port.port.toString().includes(searchTerm) ||
      port.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
      port.pid.includes(searchTerm) ||
      (portNames[port.port] && portNames[port.port].toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesNamedFilter = !showNamedOnly || portNames[port.port];
    
    return matchesSearch && matchesNamedFilter;
  });

  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'port':
        comparison = a.port - b.port;
        break;
      case 'process':
        comparison = a.process.localeCompare(b.process);
        break;
      case 'name':
        const nameA = portNames[a.port] || '';
        const nameB = portNames[b.port] || '';
        comparison = nameA.localeCompare(nameB);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return filtered;
}

// Render ports list
function renderPorts() {
  const filteredPorts = getFilteredAndSortedPorts();
  
  if (filteredPorts.length === 0) {
    portsList.innerHTML = `
      <div class="p-8 text-center text-muted-foreground">
        ${searchTerm || showNamedOnly ? 'No ports match your filters' : 'No active ports found'}
      </div>
    `;
    return;
  }

  portsList.innerHTML = filteredPorts.map(port => `
    <div class="grid grid-cols-12 gap-4 p-3 hover:bg-muted/30 transition-colors">
      <div class="col-span-2 font-mono font-semibold">${port.port}</div>
      <div class="col-span-3 font-medium">${port.process}</div>
      <div class="col-span-2 text-muted-foreground">${port.pid}</div>
      <div class="col-span-1">
        <span class="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
          ${port.protocol}
        </span>
      </div>
      <div class="col-span-4">
        <input type="text" 
          class="interactive port-name-input w-full bg-transparent hover:bg-muted/50 px-2 py-1 rounded focus:outline-none focus:ring-2 focus:ring-ring"
          data-port="${port.port}"
          value="${portNames[port.port] || ''}"
          placeholder="Click to add name..."
        />
      </div>
    </div>
  `).join('');

  // Add event listeners to name inputs
  document.querySelectorAll('.port-name-input').forEach(input => {
    let timeout;
    input.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        savePortName(parseInt(e.target.dataset.port), e.target.value);
      }, 500);
    });
  });
}

// Event listeners
searchInput.addEventListener('input', (e) => {
  searchTerm = e.target.value;
  renderPorts();
});

filterNamedBtn.addEventListener('click', () => {
  showNamedOnly = !showNamedOnly;
  filterNamedBtn.classList.toggle('bg-primary');
  filterNamedBtn.classList.toggle('text-primary-foreground');
  filterNamedBtn.textContent = showNamedOnly ? 'Show All' : 'Named Only';
  renderPorts();
});

refreshBtn.addEventListener('click', fetchPorts);

// Sort buttons
document.querySelectorAll('[data-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    const field = btn.dataset.sort;
    if (sortField === field) {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      sortField = field;
      sortOrder = 'asc';
    }
    
    // Update sort icons
    document.querySelectorAll('[data-sort] .sort-icon').forEach(icon => {
      icon.textContent = '↕';
    });
    btn.querySelector('.sort-icon').textContent = sortOrder === 'asc' ? '↑' : '↓';
    
    renderPorts();
  });
});

// Add spin animation style
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .animate-spin {
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(style);

// Initial load
async function init() {
  await fetchPortNames();
  await fetchPorts();
  
  // Refresh every 3 seconds
  setInterval(fetchPorts, 3000);
  
  // Refresh on window focus
  window.addEventListener('focus', fetchPorts);
}

init();