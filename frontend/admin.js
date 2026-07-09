// Admin Dashboard JavaScript
const API = '';
const token = localStorage.getItem('userToken');

// Authorization & Role protection
if (!token || localStorage.getItem('userRole') !== 'admin') {
  window.location.href = 'auth.html';
}

const socket = io('');

let allDonations = [];
let allUsers = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadDonations();
  loadUsers();
  
  // Real-time updates
  socket.on('foodAdded', () => {
    loadDashboardStats();
    loadDonations();
  });
  
  socket.on('foodUpdated', () => {
    loadDashboardStats();
    loadDonations();
  });
});

// Load Dashboard Statistics
async function loadDashboardStats() {
  try {
    // Fetch donations from both endpoints
    const [ngoRes, compostRes, usersRes] = await Promise.all([
      fetch(`${API}/api/food/ngo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API}/api/food/compost`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const ngoDonations = ngoRes.ok ? await ngoRes.json() : [];
    const compostDonations = compostRes.ok ? await compostRes.json() : [];
    const donations = [...ngoDonations, ...compostDonations];
    allDonations = donations;

    const users = usersRes.ok ? await usersRes.json() : [];
    allUsers = users;

    // Calculate stats
    const totalKg = donations.reduce((sum, d) => sum + (d.quantity || 0), 0);
    const activeDonations = donations.filter(d => d.status === 'available').length;
    const co2Saved = (totalKg * 0.5).toFixed(1);

    // Count users by role
    const restaurants = users.filter(u => u.role === 'restaurant').length;
    const ngos = users.filter(u => u.role === 'ngo').length;
    const compost = users.filter(u => u.role === 'compost').length;

    // Update UI
    const updateStat = (id, value) => {
      const elem = document.getElementById(id);
      if (elem) elem.textContent = value;
    };

    updateStat('totalUsers', users.length);
    updateStat('totalDonations', donations.length);
    updateStat('totalKg', totalKg.toFixed(1));
    updateStat('activeDonations', activeDonations);
    updateStat('totalRestaurants', restaurants);
    updateStat('totalNGOs', ngos);
    updateStat('totalCompost', compost);
    updateStat('co2Saved', co2Saved);

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// Load All Donations
async function loadDonations() {
  const loading = document.getElementById('donationsLoading');
  const table = document.getElementById('donationsTable');
  const empty = document.getElementById('donationsEmpty');
  const tbody = document.getElementById('donationsBody');

  if (!loading || !table || !empty || !tbody) {
    console.error('Required DOM elements not found');
    return;
  }

  loading.style.display = 'block';
  table.style.display = 'none';
  empty.style.display = 'none';

  try {
    const [ngoRes, compostRes] = await Promise.all([
      fetch(`${API}/api/food/ngo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${API}/api/food/compost`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const ngoFood = ngoRes.ok ? await ngoRes.json() : [];
    const compostFood = compostRes.ok ? await compostRes.json() : [];

    allDonations = [...ngoFood, ...compostFood];

    loading.style.display = 'none';

    if (allDonations.length === 0) {
      empty.style.display = 'block';
      return;
    }

    table.style.display = 'block';
    tbody.innerHTML = allDonations.map(donation => `
      <tr>
        <td>${donation._id ? donation._id.slice(-6) : 'N/A'}</td>
        <td>${donation.donor?.name || 'N/A'}</td>
        <td>${donation.foodName || 'N/A'}</td>
        <td>${donation.quantity || 0}</td>
        <td>${donation.condition || 'N/A'}</td>
        <td>${donation.location || 'N/A'}</td>
        <td><span class="status-badge status-${donation.status || 'available'}">${donation.status || 'available'}</span></td>
        <td>${donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : 'N/A'}</td>
        <td class="action-buttons">
          <button class="btn btn-small btn-primary" onclick="viewDonation('${donation._id}')"><span class="material-symbols-outlined">visibility</span>️ View</button>
          <button class="btn btn-small btn-danger" onclick="deleteDonation('${donation._id}')"><span class="material-symbols-outlined">delete</span>️ Delete</button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading donations:', error);
    loading.style.display = 'none';
    empty.style.display = 'block';
  }
}

// Load All Users
async function loadUsers() {
  const loading = document.getElementById('usersLoading');
  const table = document.getElementById('usersTable');
  const empty = document.getElementById('usersEmpty');
  const tbody = document.getElementById('usersBody');

  if (!loading || !table || !empty || !tbody) {
    console.error('Required DOM elements not found');
    return;
  }

  loading.style.display = 'block';
  table.style.display = 'none';
  empty.style.display = 'none';

  try {
    const response = await fetch(`${API}/api/admin/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const users = response.ok ? await response.json() : [];
    allUsers = users;

    loading.style.display = 'none';

    if (allUsers.length === 0) {
      empty.style.display = 'block';
      return;
    }

    table.style.display = 'block';
    tbody.innerHTML = allUsers.map(user => `
      <tr>
        <td>${user._id ? user._id.slice(-6) : 'N/A'}</td>
        <td>${user.name || 'N/A'}</td>
        <td>${user.email || 'N/A'}</td>
        <td><span class="role-badge role-${user.role}">${user.role || 'N/A'}</span></td>
        <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
        <td class="action-buttons">
          <button class="btn btn-small btn-primary" onclick="viewUser('${user._id}')"><span class="material-symbols-outlined">visibility</span>️ View</button>
          <button class="btn btn-small btn-danger" onclick="deleteUser('${user._id}')"><span class="material-symbols-outlined">delete</span>️ Delete</button>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Error loading users:', error);
    loading.style.display = 'none';
    empty.style.display = 'block';
  }
}

// Tab Switching
function switchTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.remove('active');
  });

  // Remove active class from all tabs
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected tab content
  const selectedContent = document.getElementById(`${tabName}-tab`);
  if (selectedContent) {
    selectedContent.classList.add('active');
  }

  // Add active class to clicked tab
  event.currentTarget.classList.add('active');

  // Load data for specific tabs
  if (tabName === 'donations') {
    loadDonations();
  } else if (tabName === 'users') {
    loadUsers();
  } else if (tabName === 'dashboard') {
    loadDashboardStats();
  }
}

// Filter Donations
function filterDonations() {
  const searchTerm = document.getElementById('donationsSearch').value.toLowerCase();
  const tbody = document.getElementById('donationsBody');
  
  if (!tbody) return;

  const filteredDonations = allDonations.filter(donation => {
    return (donation.donor?.name && donation.donor.name.toLowerCase().includes(searchTerm)) ||
           (donation.foodName && donation.foodName.toLowerCase().includes(searchTerm)) ||
           (donation.status && donation.status.toLowerCase().includes(searchTerm));
  });

  tbody.innerHTML = filteredDonations.map(donation => `
    <tr>
      <td>${donation._id ? donation._id.slice(-6) : 'N/A'}</td>
      <td>${donation.donor?.name || 'N/A'}</td>
      <td>${donation.foodName || 'N/A'}</td>
      <td>${donation.quantity || 0}</td>
      <td>${donation.condition || 'N/A'}</td>
      <td>${donation.location || 'N/A'}</td>
      <td><span class="status-badge status-${donation.status || 'available'}">${donation.status || 'available'}</span></td>
      <td>${donation.createdAt ? new Date(donation.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td class="action-buttons">
        <button class="btn btn-small btn-primary" onclick="viewDonation('${donation._id}')"><span class="material-symbols-outlined">visibility</span>️ View</button>
        <button class="btn btn-small btn-danger" onclick="deleteDonation('${donation._id}')"><span class="material-symbols-outlined">delete</span>️ Delete</button>
      </td>
    </tr>
  `).join('');
}

// Filter Users
function filterUsers() {
  const searchTerm = document.getElementById('usersSearch').value.toLowerCase();
  const tbody = document.getElementById('usersBody');
  
  if (!tbody) return;

  const filteredUsers = allUsers.filter(user => {
    return (user.name && user.name.toLowerCase().includes(searchTerm)) ||
           (user.email && user.email.toLowerCase().includes(searchTerm)) ||
           (user.role && user.role.toLowerCase().includes(searchTerm));
  });

  tbody.innerHTML = filteredUsers.map(user => `
    <tr>
      <td>${user._id ? user._id.slice(-6) : 'N/A'}</td>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td><span class="role-badge role-${user.role}">${user.role || 'N/A'}</span></td>
      <td>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td class="action-buttons">
        <button class="btn btn-small btn-primary" onclick="viewUser('${user._id}')"><span class="material-symbols-outlined">visibility</span>️ View</button>
        <button class="btn btn-small btn-danger" onclick="deleteUser('${user._id}')"><span class="material-symbols-outlined">delete</span>️ Delete</button>
      </td>
    </tr>
  `).join('');
}

// View Donation Details
function viewDonation(id) {
  const donation = allDonations.find(d => d._id === id);
  
  if (!donation) {
    alert('Donation not found');
    return;
  }

  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (modalTitle) modalTitle.textContent = 'Donation Details';
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Restaurant:</span>
        <span class="detail-value">${donation.donor?.name || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Food Name:</span>
        <span class="detail-value">${donation.foodName || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Quantity:</span>
        <span class="detail-value">${donation.quantity || 0} kg</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Condition:</span>
        <span class="detail-value">${donation.condition || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value"><span class="status-badge status-${donation.status}">${donation.status || 'available'}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Address:</span>
        <span class="detail-value">${donation.location || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">GST:</span>
        <span class="detail-value">${donation.gstNumber || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Created:</span>
        <span class="detail-value">${donation.createdAt ? new Date(donation.createdAt).toLocaleString() : 'N/A'}</span>
      </div>
    `;
  }

  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.add('show');
}

// View User Details
function viewUser(id) {
  const user = allUsers.find(u => u._id === id);
  
  if (!user) {
    alert('User not found');
    return;
  }

  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  if (modalTitle) modalTitle.textContent = 'User Details';
  if (modalBody) {
    modalBody.innerHTML = `
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${user.name || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${user.email || 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Role:</span>
        <span class="detail-value"><span class="role-badge role-${user.role}">${user.role || 'N/A'}</span></span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Joined:</span>
        <span class="detail-value">${user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}</span>
      </div>
    `;
  }

  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.add('show');
}

// Delete Donation
async function deleteDonation(id) {
  if (!confirm('Are you sure you want to delete this donation?')) {
    return;
  }

  try {
    const response = await fetch(`${API}/api/food/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('Donation deleted successfully');
      loadDonations();
      loadDashboardStats();
    } else {
      const errData = await response.json();
      alert('Failed to delete donation: ' + (errData.message || response.statusText));
    }
  } catch (error) {
    console.error('Error deleting donation:', error);
    alert('Error deleting donation.');
  }
}

// Delete User
async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) {
    return;
  }

  try {
    const response = await fetch(`${API}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      alert('User deleted successfully');
      loadUsers();
      loadDashboardStats();
    } else {
      const errData = await response.json();
      alert('Failed to delete user: ' + (errData.message || response.statusText));
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    alert('Error deleting user.');
  }
}

// Close Modal
function closeModal() {
  const detailModal = document.getElementById('detailModal');
  if (detailModal) detailModal.classList.remove('show');
}

// Close modal when clicking outside
window.onclick = function(event) {
  const modal = document.getElementById('detailModal');
  if (event.target === modal) {
    closeModal();
  }
};

function logout() {
  localStorage.clear();
  window.location.href = 'auth.html';
}

// Parallax mouse effect
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.gradient-orb');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;

  orbs.forEach((orb, index) => {
    const speed = (index + 1) * 15;
    const x = (mouseX - 0.5) * speed;
    const y = (mouseY - 0.5) * speed;
    orb.style.transform = `translate(${x}px, ${y}px)`;
  });
});
