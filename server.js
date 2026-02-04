const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Middleware
app.use(expressLayouts);
app.use(cookieParser()); // Enable cookies
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // For API requests

// Data Persistence (Multi-User)
const DATA_FILE = path.join(__dirname, 'data', 'db.json');
let db = {}; // Structure: { "USER_ID": { pets: [], records: [] } }

// Load data on start
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        db = JSON.parse(data);
        console.log(`Loaded database with ${Object.keys(db).length} users.`);
    }
} catch (err) {
    console.error("Error loading data:", err);
    db = {};
}

function saveDb() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

// User ID Middleware & Locals
app.use((req, res, next) => {
    let userId = req.cookies.userId;

    // If no user/cookie, create one
    if (!userId) {
        userId = 'U' + Math.random().toString(36).substr(2, 6).toUpperCase();
        res.cookie('userId', userId, { maxAge: 90 * 24 * 60 * 60 * 1000, httpOnly: true }); // 90 days
        console.log("New User Created:", userId);
    }

    // Ensure storage exists for this user
    if (!db[userId]) {
        db[userId] = { pets: [], records: [] };
        saveDb();
    }
    // Migration for old array format if any
    else if (Array.isArray(db[userId])) {
        db[userId] = { pets: db[userId], records: [] };
        saveDb();
    }

    req.userId = userId;

    // Selected Pet ID from cookie (defaults to first pet)
    req.selectedPetId = req.cookies.selectedPetId ? parseInt(req.cookies.selectedPetId) : null;

    res.locals.path = req.path;
    res.locals.userId = userId; // Make available to all views globally
    next();
});

// Helper functions (Scoped to User)
const getUserData = (req) => {
    let data = db[req.userId];
    if (!data.pets) data.pets = [];
    if (!data.records) data.records = [];
    return data;
};

const getPets = (req) => getUserData(req).pets;
const setPets = (req, newPets) => {
    const data = getUserData(req);
    data.pets = newPets;
    saveDb();
};
const getRecords = (req) => getUserData(req).records;
const getRecordsByPet = (req, petId) => {
    const records = getRecords(req);
    const pets = getPets(req);
    const firstPetId = pets.length > 0 ? pets[0].id : null;

    if (!petId) return records;

    // Filter records: show records that match petId OR (have no petId AND this is the first pet)
    return records.filter(r => {
        if (r.petId === petId) return true;
        if (!r.petId && petId === firstPetId) return true; // Old records go to first pet
        return false;
    });
};
const addRecord = (req, record) => {
    const data = getUserData(req);
    data.records.unshift(record); // Newest first
    saveDb();
};

// Get selected pet or first pet
const getSelectedPet = (req) => {
    const pets = getPets(req);
    if (pets.length === 0) return null;

    if (req.selectedPetId) {
        const found = pets.find(p => p.id === req.selectedPetId);
        if (found) return found;
    }
    return pets[0]; // Default to first pet
};

// Routes
app.get('/', (req, res) => {
    const pets = getPets(req);
    if (pets.length === 0) {
        return res.redirect('/onboarding');
    }
    const selectedPet = getSelectedPet(req);
    res.render('index', { pets, selectedPet });
});
app.get('/home', (req, res) => {
    res.redirect('/');
});

// Select Pet Route (AJAX/API)
app.post('/pets/select/:id', (req, res) => {
    const petId = parseInt(req.params.id);
    res.cookie('selectedPetId', petId, { maxAge: 90 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.json({ success: true, petId });
});

app.get('/scan', (req, res) => {
    res.redirect('/scan/guide');
});

app.get('/scan/guide', (req, res) => {
    const selectedPet = getSelectedPet(req);
    res.render('scan/guide', { selectedPet });
});

app.get('/scan/timer', (req, res) => {
    res.render('scan/timer');
});

app.get('/scan/camera', (req, res) => {
    res.render('scan/camera');
});

// Mock Analysis Route
app.get('/scan/result', (req, res) => {
    res.redirect('/');
});

app.post('/scan/analyze', async (req, res) => {
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Get selected pet
    const selectedPet = getSelectedPet(req);

    // Mock Analysis Logic
    const parameters = [
        { name: '잠혈 (Blood)', key: 'blood', vals: ['Negative', 'Trace', 'Small', 'Moderate', 'Large'] },
        { name: '빌리루빈 (Bilirubin)', key: 'bil', vals: ['Negative', '1+'] },
        { name: '우로빌리노겐 (Urobilinogen)', key: 'uro', vals: ['Normal', '1+'] },
        { name: '케톤 (Ketones)', key: 'ket', vals: ['Negative', 'Trace'] },
        { name: '단백질 (Protein)', key: 'pro', vals: ['Negative', 'Trace', '1+'] },
        { name: '아질산염 (Nitrite)', key: 'nit', vals: ['Negative', 'Positive'] },
        { name: '포도당 (Glucose)', key: 'glu', vals: ['Negative', 'Trace'] },
        { name: '산성도 (pH)', key: 'ph', vals: ['5.0', '6.0', '6.5', '7.0', '7.5', '8.0'] },
        { name: '비중 (S.G)', key: 'sg', vals: ['1.005', '1.010', '1.015', '1.020', '1.025'] },
        { name: '백혈구 (Leukocytes)', key: 'leu', vals: ['Negative', 'Trace', '1+', '2+'] }
    ];

    let totalPenalty = 0;
    const results = parameters.map(param => {
        const isNormal = Math.random() > 0.2;
        let valueIndex = 0;

        if (!isNormal) {
            valueIndex = Math.floor(Math.random() * (param.vals.length - 1)) + 1;
            totalPenalty += (valueIndex * 10);
        }

        return {
            name: param.name,
            value: param.vals[valueIndex],
            status: valueIndex === 0 ? 'Normal' : 'Abnormal',
            description: valueIndex === 0 ? '정상입니다' : '주의가 필요합니다'
        };
    });

    const score = Math.max(40, 100 - totalPenalty);

    // Save to History with Pet ID
    const newRecord = {
        id: Date.now(),
        petId: selectedPet ? selectedPet.id : null,
        petName: selectedPet ? selectedPet.name : '알 수 없음',
        date: new Date().toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' }),
        fullDate: new Date().toISOString(),
        type: '소변 검사',
        score: score,
        results: results,
        summary: score >= 80 ? '정상' : '주의'
    };
    addRecord(req, newRecord);

    res.render('scan/result', { score, results, petName: newRecord.petName });
});

app.get('/history', (req, res) => {
    const pets = getPets(req);
    const selectedPet = getSelectedPet(req);
    const petId = selectedPet ? selectedPet.id : null;
    const records = getRecordsByPet(req, petId);
    res.render('records', { records, pets, selectedPet });
});

// Detail View Route
app.get('/history/:id', (req, res) => {
    const records = getRecords(req);
    const id = parseInt(req.params.id);
    const record = records.find(r => r.id === id);

    if (!record) {
        return res.redirect('/history');
    }

    res.render('history-detail', { record });
});

app.get('/vet', (req, res) => {
    res.render('vet');
});

app.get('/vet/chat', (req, res) => {
    res.render('vet/chat');
});

app.get('/vet/hospitals', (req, res) => {
    res.render('vet/hospitals', { 
        kakaoApiKey: process.env.KAKAO_MAPS_API_KEY || 'd9fc8a2f15e7df4452c092b4786bfddc'
    });
});

app.get('/vet/faq', (req, res) => {
    res.render('vet/faq');
});

// AI Chat API Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, petInfo } = req.body;

        if (!message) {
            return res.status(400).json({ error: '메시지를 입력해주세요.' });
        }

        // Rate limiting: 20 questions per day per user
        const userId = req.userId;
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        // Initialize chatUsage in db if not exists
        if (!db[userId].chatUsage) {
            db[userId].chatUsage = { date: today, count: 0 };
        }

        // Reset count if it's a new day
        if (db[userId].chatUsage.date !== today) {
            db[userId].chatUsage = { date: today, count: 0 };
        }

        // Check if user exceeded daily limit
        if (db[userId].chatUsage.count >= 20) {
            return res.status(429).json({
                error: '오늘의 질문 횟수를 모두 사용하셨습니다. (20/20)\n내일 다시 이용해주세요. 🙏',
                remaining: 0,
                limit: 20
            });
        }

        // Get user's recent test results for context
        const selectedPet = getSelectedPet(req);
        const recentRecords = getRecordsByPet(req, selectedPet?.id).slice(0, 3);

        // Build context from test results
        let contextInfo = '';
        if (selectedPet) {
            contextInfo += `반려동물 정보: ${selectedPet.name} (${selectedPet.breed}, ${selectedPet.age}세)\n`;
        }
        if (recentRecords.length > 0) {
            contextInfo += '\n최근 검사 기록:\n';
            recentRecords.forEach(record => {
                contextInfo += `- ${record.date}: ${record.summary} (점수: ${record.score}/100)\n`;
                // Add abnormal results
                const abnormalResults = record.results.filter(r => r.status === 'Abnormal');
                if (abnormalResults.length > 0) {
                    contextInfo += `  이상 수치: ${abnormalResults.map(r => r.name).join(', ')}\n`;
                }
            });
        }

        const systemPrompt = `당신은 친절하고 전문적인 AI 수의사 도우미입니다. 다음 규칙을 따라주세요:

1. 반려동물 건강에 대해 명확하고 이해하기 쉽게 설명하세요
2. 소변 검사 결과 해석, 증상 설명, 일반적인 건강 정보를 제공하세요
3. 답변은 200자 이내로 간결하게 작성하세요
4. 이모지를 적절히 사용하여 친근감을 주세요 (🐾 💡 ⚠️ 등)
5. 심각한 증상이나 지속적인 이상 수치는 반드시 동물병원 방문을 권장하세요
6. "저는 AI이므로 정확한 진단은 수의사와 상담이 필요합니다" 같은 면책 문구를 자연스럽게 포함하세요
7. 의학적 진단이나 처방은 절대 하지 마세요

${contextInfo ? `현재 반려동물 정보:\n${contextInfo}` : ''}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const reply = completion.choices[0].message.content;

        // Increment usage count and save
        db[userId].chatUsage.count++;
        saveDb();

        res.json({
            reply,
            usage: completion.usage, // For monitoring
            remaining: 20 - db[userId].chatUsage.count,
            limit: 20
        });

    } catch (error) {
        console.error('OpenAI API Error:', error);

        if (error.code === 'insufficient_quota') {
            return res.status(503).json({
                error: 'API 사용량을 초과했습니다. 잠시 후 다시 시도해주세요.'
            });
        }

        res.status(500).json({
            error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
        });
    }
});

app.get('/my', (req, res) => {
    const pets = getPets(req);
    res.render('my/index', { pets, userId: req.userId });
});

app.get('/my/pets', (req, res) => {
    const pets = getPets(req);
    res.render('my/pets', { pets });
});

app.get('/new', (req, res) => {
    res.render('add-pet');
});

app.post('/pets', (req, res) => {
    const { name, breed, age, gender, weight } = req.body;
    let pets = getPets(req);

    // Duplicate Name Check
    const exists = pets.find(p => p.name === name);
    if (exists) {
        return res.status(422).render('add-pet', { error: '이미 등록된 이름입니다! 다른 이름을 사용해주세요.' });
    }

    const newPet = {
        id: Date.now(),
        name,
        breed,
        age: parseInt(age),
        gender, // 'male' or 'female'
        weight: parseFloat(weight),
        image: null
    };

    pets.push(newPet);
    setPets(req, pets); // Save specific user data

    // Auto-select newly added pet
    res.cookie('selectedPetId', newPet.id, { maxAge: 90 * 24 * 60 * 60 * 1000, httpOnly: true });
    res.redirect('/');
});

app.post('/pets/:id/delete', (req, res) => {
    const id = parseInt(req.params.id);
    let pets = getPets(req);
    pets = pets.filter(p => p.id !== id);
    setPets(req, pets);
    res.redirect('/my/pets');
});

// Edit Routes
app.get('/pets/:id/edit', (req, res) => {
    const id = parseInt(req.params.id);
    const pets = getPets(req);
    const pet = pets.find(p => p.id === id);
    if (!pet) return res.redirect('/my/pets');
    res.render('edit-pet', { pet });
});

app.post('/pets/:id/edit', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, breed, age, gender, weight } = req.body;
    let pets = getPets(req);

    const petIndex = pets.findIndex(p => p.id === id);
    if (petIndex !== -1) {
        pets[petIndex] = {
            ...pets[petIndex],
            name,
            breed,
            age: parseInt(age),
            gender,
            weight: parseFloat(weight)
        };
        setPets(req, pets);
    }
    res.redirect('/my/pets');
});

// Sync Route (Data Migration)
app.post('/auth/sync', (req, res) => {
    const { targetCode } = req.body;
    if (targetCode && targetCode.length >= 6) {
        // Simple Sync: Just switch identity to that code
        res.cookie('userId', targetCode, { maxAge: 90 * 24 * 60 * 60 * 1000, httpOnly: true });
        console.log(`User ${req.userId} switched to ${targetCode}`);
    }
    res.redirect('/my');
});

// My Page Routes
app.get('/my/settings', (req, res) => {
    res.render('my/settings');
});
app.get('/my/terms', (req, res) => {
    res.render('my/terms');
});
app.get('/my/privacy', (req, res) => {
    res.render('my/privacy');
});
app.get('/onboarding', (req, res) => {
    res.render('onboarding');
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hotwire App running on http://localhost:${PORT}`);
});
