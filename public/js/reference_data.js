// PetCheck Urinalysis Reference Data
// Approximate RGB values for standard dipstick pads.

const ReferenceChart = {
    glucose: {
        name: "Glucose (Glu)",
        unit: "mg/dL",
        pads: [
            { label: "Neg", value: 0, color: [100, 200, 220] },   // Sky Blue
            { label: "100", value: 100, color: [100, 220, 150] }, // Light Green
            { label: "250", value: 250, color: [150, 200, 50] },  // Olive
            { label: "500", value: 500, color: [150, 100, 50] },  // Brownish
            { label: "1000+", value: 1000, color: [100, 50, 50] } // Dark Brown
        ]
    },
    protein: {
        name: "Protein (Pro)",
        unit: "mg/dL",
        pads: [
            { label: "Neg", value: 0, color: [220, 220, 100] },   // Yellow
            { label: "Trace", value: 15, color: [200, 220, 100] },// Greenish Yellow
            { label: "30", value: 30, color: [150, 220, 100] },   // Light Green
            { label: "100", value: 100, color: [100, 200, 150] }, // Green
            { label: "300+", value: 300, color: [50, 150, 150] }  // Teal
        ]
    },
    ph: {
        name: "pH",
        unit: "",
        pads: [
            { label: "5.0", value: 5.0, color: [255, 150, 100] }, // Orange
            { label: "6.0", value: 6.0, color: [255, 200, 100] }, // Yellow-Orange
            { label: "6.5", value: 6.5, color: [150, 200, 100] }, // Yellow-Green
            { label: "7.0", value: 7.0, color: [100, 200, 100] }, // Green
            { label: "8.0", value: 8.0, color: [50, 150, 200] }   // Blue
        ]
    },
    blood: {
        name: "Blood (Bld)",
        unit: "Ery/uL",
        pads: [
            { label: "Neg", value: 0, color: [255, 255, 150] },  // Pale Yellow
            { label: "Trace", value: 10, color: [200, 200, 100] }, // Darker Yellow spots
            { label: "Small", value: 50, color: [150, 200, 100] }, // Greenish
            { label: "Mod", value: 250, color: [100, 150, 100] },  // Dark Green
            { label: "Large", value: 500, color: [50, 100, 100] }  // Very Dark Green
        ]
    }
};

export default ReferenceChart;
