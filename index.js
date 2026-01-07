// index.js
(function () {
    // ชื่อ User ปัจจุบัน (ดึงจาก SillyTavern ถ้าได้, ถ้าไม่ได้ใช้ Default)
    let currentUser = "Player";
    
    // ข้อมูล Default
    const defaultData = {
        hp: 100, maxHp: 100,
        mp: 50, maxMp: 50,
        gold: 0,
        inventory: ["Potion"]
    };

    let rpgData = JSON.parse(JSON.stringify(defaultData));

    // ฟังก์ชันดึงชื่อ User จาก SillyTavern Context
    function getCurrentUserName() {
        // พยายามดึงชื่อจากตัวแปรของ SillyTavern (name2 คือชื่อ User)
        try {
            if (typeof SillyTavern !== 'undefined' && SillyTavern.getContext) {
                return SillyTavern.getContext().name2 || "Player";
            }
            // fallback วิธีเข้าถึงแบบอื่น
            if (typeof render_user_name !== 'undefined') return render_user_name; 
        } catch (e) {
            console.log("RPG Extension: Could not fetch user name, defaulting to Player.");
        }
        return "Player";
    }

    // โหลดข้อมูลตามชื่อ User
    function loadData() {
        currentUser = getCurrentUserName(); // อัปเดตชื่อก่อนโหลด
        const key = `st_rpg_data_${currentUser}`; // สร้าง Key เฉพาะตัว
        const stored = localStorage.getItem(key);
        
        if (stored) {
            rpgData = JSON.parse(stored);
        } else {
            // ถ้าเป็นคนใหม่ ให้รีเซ็ตเป็นค่าเริ่มต้น
            rpgData = JSON.parse(JSON.stringify(defaultData));
        }
        updateUI(); // รีเฟรชหน้าจอหลังโหลด
    }

    // บันทึกข้อมูล
    function saveData() {
        const key = `st_rpg_data_${currentUser}`;
        localStorage.setItem(key, JSON.stringify(rpgData));
    }

    // HTML Structure
    const rpgHtml = `
    <div id="rpg-overlay">
        <div class="minimized-icon">⚔️</div>

        <div class="rpg-header">
            <span>⚔️ Status: <span id="user-name-display"></span></span>
            <span style="font-size: 12px;">▼</span>
        </div>
        
        <div class="rpg-content">
            <div class="rpg-stat">
                <div class="stat-label"><span>HP</span> <span id="hp-text"></span></div>
                <div class="bar-container"><div id="hp-fill" class="hp-bar" style="width: 100%"></div></div>
                <div class="rpg-controls">
                    <button class="rpg-btn" id="hp-minus">-</button>
                    <button class="rpg-btn" id="hp-plus">+</button>
                </div>
            </div>

            <div class="rpg-stat">
                <div class="stat-label"><span>MP</span> <span id="mp-text"></span></div>
                <div class="bar-container"><div id="mp-fill" class="mp-bar" style="width: 100%"></div></div>
                <div class="rpg-controls">
                    <button class="rpg-btn" id="mp-minus">-</button>
                    <button class="rpg-btn" id="mp-plus">+</button>
                </div>
            </div>

            <div class="rpg-stat">
                <div class="stat-label"><span>Gold 💰</span> <span id="gold-text"></span></div>
                <div class="rpg-controls">
                    <button class="rpg-btn" id="gold-minus">-</button>
                    <button class="rpg-btn" id="gold-plus">+</button>
                </div>
            </div>

            <div class="inventory-section">
                <div class="stat-label">🎒 Inventory</div>
                <div style="display:flex; gap:5px; margin-bottom:5px;">
                    <input type="text" id="item-input" placeholder="Item..." style="width:65%; color:black;">
                    <button class="rpg-btn" id="add-item">Add</button>
                </div>
                <ul id="inventory-list"></ul>
            </div>
        </div>
    </div>
    `;

    // ฟังก์ชันอัปเดตหน้าจอ
    function updateUI() {
        $('#user-name-display').text(currentUser); // โชว์ชื่อเจ้าของ Status
        
        $('#hp-text').text(`${rpgData.hp}/${rpgData.maxHp}`);
        $('#hp-fill').css('width', `${(rpgData.hp / rpgData.maxHp) * 100}%`);
        
        $('#mp-text').text(`${rpgData.mp}/${rpgData.maxMp}`);
        $('#mp-fill').css('width', `${(rpgData.mp / rpgData.maxMp) * 100}%`);

        $('#gold-text').text(rpgData.gold);

        const list = $('#inventory-list');
        list.empty();
        rpgData.inventory.forEach((item, index) => {
            list.append(`<li>${item} <span class="delete-item" data-index="${index}">x</span></li>`);
        });

        saveData();
    }

    $(document).ready(function () {
        $('body').append(rpgHtml);
        
        // โหลดข้อมูลครั้งแรก
        loadData();
        
        // *** Event Listeners ***

        // ตรวจจับการเปลี่ยน User (กด refresh หรือเปลี่ยน chat อาจต้องโหลดใหม่)
        // เพื่อความชัวร์ เราจะตั้ง Interval เช็คเบาๆ หรือผูก Event ถ้า ST รองรับ
        // แต่เพื่อความง่าย: กดที่ Header จะทำการ re-check ชื่อ User ให้ด้วย
        $('.rpg-header').click(function() {
             $('#rpg-overlay').toggleClass('minimized');
        });

        // คลิกที่ไอคอนตอนย่อ เพื่อขยายออก
        $('.minimized-icon').click(function() {
            $('#rpg-overlay').removeClass('minimized');
            loadData(); // เช็คชื่อ User อีกรอบตอนเปิดขึ้นมา
        });

        // Logic ปุ่มต่างๆ
        $('#hp-minus').click((e) => { e.stopPropagation(); if(rpgData.hp > 0) rpgData.hp -= 10; updateUI(); });
        $('#hp-plus').click((e) => { e.stopPropagation(); if(rpgData.hp < rpgData.maxHp) rpgData.hp += 10; updateUI(); });
        $('#mp-minus').click((e) => { e.stopPropagation(); if(rpgData.mp > 0) rpgData.mp -= 5; updateUI(); });
        $('#mp-plus').click((e) => { e.stopPropagation(); if(rpgData.mp < rpgData.maxMp) rpgData.mp += 5; updateUI(); });
        $('#gold-minus').click((e) => { e.stopPropagation(); if(rpgData.gold > 0) rpgData.gold -= 10; updateUI(); });
        $('#gold-plus').click((e) => { e.stopPropagation(); rpgData.gold += 10; updateUI(); });

        $('#add-item').click((e) => {
            e.stopPropagation();
            const val = $('#item-input').val();
            if(val) {
                rpgData.inventory.push(val);
                $('#item-input').val('');
                updateUI();
            }
        });

        // กันการคลิก Input แล้วเผลอไปปิดหน้าต่าง
        $('#item-input').click((e) => e.stopPropagation());

        $('#inventory-list').on('click', '.delete-item', function(e) {
            e.stopPropagation();
            const idx = $(this).data('index');
            rpgData.inventory.splice(idx, 1);
            updateUI();
        });
        
        // ลองดึงข้อมูลทุกครั้งที่เปลี่ยนแชท (ถ้าทำได้) หรือตั้งเวลาเช็ค
        setInterval(() => {
            const currentCheck = getCurrentUserName();
            if (currentCheck !== currentUser) {
                console.log("User changed, reloading RPG data...");
                loadData();
            }
        }, 2000); // เช็คทุก 2 วินาทีว่าเปลี่ยน User Persona หรือยัง
    });
})();
