// Authentication check and user data loading
        fetch('/api/user-data', {
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                window.location.href = '/';
                throw new Error('Not authenticated');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                const user = data.user;
                document.getElementById('account-username').value = user.username;
                document.getElementById('account-email').value = user.email;
                document.getElementById('account-phone').value = user.phone || '';
                document.getElementById('account-gender').value = user.gender || '';
                document.getElementById('account-country').value = user.country || '';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            window.location.href = '/';
        });

        // Logout functionality
        document.getElementById('logout-btn').addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                fetch('/api/logout', {
                    method: 'POST',
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        window.location.href = '/';
                    }
                });
            }
        });

        // Unity game loader
        function loadUnityGame(gamePath) {
            const container = document.getElementById('unity-container');
            container.innerHTML = '<canvas id="unity-canvas"></canvas>';
            
            createUnityInstance(document.querySelector("#unity-canvas"), {
                dataUrl: gamePath + "/Build/Web.data",
                frameworkUrl: gamePath + "/Build/Web.framework.js",
                codeUrl: gamePath + "/Build/Web.wasm",
                companyName: "Blueout",
                productName: "TileVania",
                productVersion: "1.0",
            }).then((unityInstance) => {
                console.log("Unity game loaded");
                window.currentUnityInstance = unityInstance;
            }).catch((err) => {
                console.error("Unity load error:", err);
            });
        }

        // Load TileVania by default
        document.addEventListener('DOMContentLoaded', function() {
            // Load the Unity loader script dynamically
            const script = document.createElement('script');
            script.src = 'games/TileVania/Build/Web.loader.js';
            script.onload = function() {
                loadUnityGame('games/TileVania');
                
                // Game selection functionality
                const gameItems = document.querySelectorAll('.game-item');
                gameItems.forEach(item => {
                    item.addEventListener('click', function() {
                        if (this.classList.contains('coming-soon')) return;
                        if (this.classList.contains('selected')) return;
                        
                        document.querySelector('.game-item.selected').classList.remove('selected');
                        this.classList.add('selected');
                        
                        const gamePath = this.getAttribute('data-path');
                        if (gamePath) {
                            loadUnityGame(gamePath);
                        }
                    });
                });

                // Fullscreen functionality
                document.getElementById('fullscreen-btn').addEventListener('click', function() {
                    const canvas = document.getElementById('unity-canvas');
                    if (canvas.requestFullscreen) {
                        canvas.requestFullscreen();
                    } else if (canvas.webkitRequestFullscreen) {
                        canvas.webkitRequestFullscreen();
                    }
                });

                // Mute functionality
                document.getElementById('mute-btn').addEventListener('click', function() {
                    if (window.currentUnityInstance) {
                        const isMuted = window.currentUnityInstance.GetMute();
                        window.currentUnityInstance.SetMute(!isMuted);
                        this.innerHTML = isMuted ? 
                            '<i class="fas fa-volume-up"></i> Mute' : 
                            '<i class="fas fa-volume-mute"></i> Unmute';
                    }
                });
            };
            document.body.appendChild(script);

            // Modal functionality
            const aboutBtn = document.getElementById('about-btn');
            const accountBtn = document.getElementById('account-btn');
            const transactionsBtn = document.getElementById('transactions-btn');
            const aboutModal = document.getElementById('about-modal');
            const accountModal = document.getElementById('account-modal');
            const transactionsModal = document.getElementById('transactions-modal');
            const closeBtns = document.querySelectorAll('.close-btn');
            
            aboutBtn.addEventListener('click', () => aboutModal.style.display = 'flex');
            accountBtn.addEventListener('click', () => accountModal.style.display = 'flex');
            transactionsBtn.addEventListener('click', () => transactionsModal.style.display = 'flex');
            
            closeBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    this.closest('.modal').style.display = 'none';
                });
            });
            
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
                    
                    document.querySelector('.tab-btn.active').classList.remove('active');
                    this.classList.add('active');
                    
                    document.querySelector('.tab-content.active').classList.remove('active');
                    document.getElementById(tabId).classList.add('active');
                });
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
        });