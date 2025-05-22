document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const aboutBtn = document.getElementById('about-btn');
    const accountBtn = document.getElementById('account-btn');
    const transactionsBtn = document.getElementById('transactions-btn');
    const aboutModal = document.getElementById('about-modal');
    const accountModal = document.getElementById('account-modal');
    const transactionsModal = document.getElementById('transactions-modal');
    const closeBtns = document.querySelectorAll('.close-btn');
    
    // Show modals
    aboutBtn.addEventListener('click', () => aboutModal.style.display = 'flex');
    accountBtn.addEventListener('click', () => accountModal.style.display = 'flex');
    transactionsBtn.addEventListener('click', () => transactionsModal.style.display = 'flex');
    

    // Close modals
    closeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal').style.display = 'none';
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // Payment tabs functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            document.querySelector('.tab-btn.active').classList.remove('active');
            this.classList.add('active');
            
            // Update active tab content
            document.querySelector('.tab-content.active').classList.remove('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Game selection functionality
    const gameItems = document.querySelectorAll('.game-item');
    gameItems.forEach(item => {
        item.addEventListener('click', function() {
            document.querySelector('.game-item.selected').classList.remove('selected');
            this.classList.add('selected');
            
            // Here you would load the selected game into the iframe
            // For demo purposes, we'll just show a placeholder
            const gameFrame = document.getElementById('game-frame');
            gameFrame.src = "https://example.com/game-" + (Array.from(gameItems).indexOf(this) + 1);
        });
    });
    
    // Game controls
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const muteBtn = document.getElementById('mute-btn');
    let isMuted = false;
    
    fullscreenBtn.addEventListener('click', function() {
        const gameFrame = document.getElementById('game-frame');
        if (gameFrame.requestFullscreen) {
            gameFrame.requestFullscreen();
        } else if (gameFrame.webkitRequestFullscreen) {
            gameFrame.webkitRequestFullscreen();
        } else if (gameFrame.msRequestFullscreen) {
            gameFrame.msRequestFullscreen();
        }
    });
    
    muteBtn.addEventListener('click', function() {
        isMuted = !isMuted;
        const gameFrame = document.getElementById('game-frame');
        
        // This would actually control the game's audio
        // For demo, we'll just toggle the icon
        if (isMuted) {
            muteBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Unmute';
        } else {
            muteBtn.innerHTML = '<i class="fas fa-volume-up"></i> Mute';
        }
    });
    
    // Form submissions
    document.getElementById('account-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Account details updated successfully!');
        accountModal.style.display = 'none';
    });
    
    document.getElementById('bank-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Bank transfer initiated successfully!');
        transactionsModal.style.display = 'none';
    });
    
    document.getElementById('gpay-form').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('GPay payment initiated successfully!');
        transactionsModal.style.display = 'none';
    });
    
    // Logout functionality
    document.getElementById('logout-btn').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            alert('Logged out successfully!');
            // In a real app, you would redirect to logout page
            // window.location.href = '/logout';
        }
    });
});