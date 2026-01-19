const express = require('express');
const app = express();
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const fs = require('fs');

// Middleware
app.use(expressLayouts);
app.set('layout', 'layout');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Data Persistence
const DATA_FILE = path.join(__dirname, 'data', 'pets.json');
let pets = [];

// Load data on start
try {
    if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        pets = JSON.parse(data);
        console.log(`Loaded ${pets.length} pets from file.`);
    }
} catch (err) {
    console.error("Error loading data:", err);
}

function savePets() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(pets, null, 2));
    } catch (err) {
        console.error("Error saving data:", err);
    }
}

// Helper for active tab
app.use((req, res, next) => {
    res.locals.path = req.path;
    next();
});

// Routes
app.get('/', (req, res) => {
    if (pets.length === 0) {
        return res.redirect('/onboarding');
    }
    res.render('index', { pets });
});
app.get('/home', (req, res) => {
    res.redirect('/');
});

app.get('/scan', (req, res) => {
    res.redirect('/scan/guide');
});

app.get('/scan/guide', (req, res) => {
    res.render('scan/guide');
});

app.get('/scan/timer', (req, res) => {
    res.render('scan/timer');
});

app.get('/scan/camera', (req, res) => {
    res.render('scan/camera');
});

app.get('/history', (req, res) => {
    res.render('records');
});

app.get('/vet', (req, res) => {
    res.render('vet');
});

app.get('/my', (req, res) => {
    res.render('my/index', { pets, userId: req.userId });
});

app.get('/my/pets', (req, res) => {
    res.render('my/pets', { pets });
});

app.get('/new', (req, res) => {
    res.render('add-pet');
});

app.post('/pets', (req, res) => {
    const { name, breed, age, gender, weight } = req.body;

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
    savePets();
    res.redirect('/');
});

app.post('/pets/:id/delete', (req, res) => {
    const id = parseInt(req.params.id);
    pets = pets.filter(p => p.id !== id);
    savePets();
    res.redirect('/my/pets');
});

// Edit Routes
app.get('/pets/:id/edit', (req, res) => {
    const id = parseInt(req.params.id);
    const pet = pets.find(p => p.id === id);
    if (!pet) return res.redirect('/my/pets');
    res.render('edit-pet', { pet });
});

app.post('/pets/:id/edit', (req, res) => {
    const id = parseInt(req.params.id);
    const { name, breed, age, gender, weight } = req.body;

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
        savePets();
    }
    res.redirect('/my/pets');
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

app.get('/scan/result', (req, res) => {
    // Redirect if direct access if needed, or render mock
    res.redirect('/');
});

app.post('/scan/analyze', async (req, res) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

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
        // 80% chance of being Normal (index 0)
        const isNormal = Math.random() > 0.2;
        let valueIndex = 0;

        if (!isNormal) {
            // Pick a random abnormal value
            valueIndex = Math.floor(Math.random() * (param.vals.length - 1)) + 1;
            totalPenalty += (valueIndex * 10); // Simple penalty logic
        }

        return {
            name: param.name,
            value: param.vals[valueIndex],
            status: valueIndex === 0 ? 'Normal' : 'Abnormal',
            description: valueIndex === 0 ? '정상입니다' : '주의가 필요합니다'
        };
    });

    // Calculate score (100 - penalties, min 40)
    const score = Math.max(40, 100 - totalPenalty);

    // Save result (Optional: In a real app, save to history array)
    // For now, just render
    res.render('scan/result', { score, results });
});

app.get('/onboarding', (req, res) => {
    res.render('onboarding');
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Hotwire App running on http://localhost:${PORT}`);
});
