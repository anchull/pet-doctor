const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const fs = require('fs');
const cookieParser = require('cookie-parser');

// Middleware
app.use(expressLayouts);
app.use(cookieParser()); // Enable cookies
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

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
    if (!petId) return records;

    // Check if any records have petId assigned
    const hasAnyPetId = records.some(r => r.petId);

    // If no records have petId (old data), show all records
    if (!hasAnyPetId) return records;

    // Otherwise filter by selected pet
    return records.filter(r => r.petId === petId);
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
    res.render('vet/hospitals');
});

app.get('/vet/faq', (req, res) => {
    res.render('vet/faq');
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
