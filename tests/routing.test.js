const { getOptimalRoute } = require('../server');

describe('SmartCrowd AI Routing Logic', () => {
    test('Should find the shortest path from Entry to Exit', () => {
        const result = getOptimalRoute('Entry', 'Exit');
        expect(result.path).toContain('Entry');
        expect(result.path).toContain('Exit');
    });

    test('Should handle invalid nodes gracefully', () => {
        const result = getOptimalRoute('NonExistent', 'Exit');
        expect(result).toBeNull();
    });

    test('Path should be an array of zones', () => {
        const result = getOptimalRoute('FoodCourt', 'SeatingB');
        expect(Array.isArray(result.path)).toBe(true);
        expect(result.path.length).toBeGreaterThan(0);
    });
});
