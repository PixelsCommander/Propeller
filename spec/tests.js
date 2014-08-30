var propeller = new Propeller(document.body);

describe("Angle transformation routines", function() {
    it("should be able to determine shortest angle between two angles", function() {
        expect(propeller.differenceBetweenAngles(45, 0)).toEqual(45);
    });
});

describe("Defaults configuration", function() {
    it("should have minimal inertia and minimal angle change be set from defaults", function() {
        expect(propeller.minimalAngleChange).toEqual(0.1);
        expect(propeller.minimalSpeed).toEqual(0.001);
    });
});

describe("Element coordinates detection", function() {
    it("should return 0 for document.body.left", function() {
        expect(propeller.getViewOffset().x).toEqual(0);
    });
});